"""Optional, authenticated Sentinel-2 thumbnail fetcher for manual B4 review.

The utility is deliberately opt-in: it performs no network requests unless the
caller supplies --allow-network and valid Sentinel Hub client credentials.
It never changes a B3 classification or review label.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
B3_INPUT = ROOT / "data/sample/processed/track_b_b3_classified_anomalies.csv"
DEFAULT_STATUS = ROOT / "data/sample/processed/track_b_b4_imagery_enrichment.jsonl"
DEFAULT_IMAGE_DIR = ROOT / "data/sample/processed/track_b_b4_imagery"
TOKEN_URL = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token"
CATALOG_URL = "https://services.sentinel-hub.com/api/v1/catalog/1.0.0/search"
PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process"


def load_dotenv() -> None:
    dotenv = ROOT / ".env"
    if not dotenv.exists():
        return
    for raw_line in dotenv.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def post_json(url: str, payload: dict, token: str) -> dict:
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def access_token(client_id: str, client_secret: str) -> str:
    payload = urlencode({"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret}).encode("utf-8")
    request = Request(TOKEN_URL, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))["access_token"]


def bounds(latitude: float, longitude: float, buffer_m: float) -> list[float]:
    latitude_delta = buffer_m / 111_320
    longitude_delta = buffer_m / (111_320 * math.cos(math.radians(latitude)))
    return [longitude - longitude_delta, latitude - latitude_delta, longitude + longitude_delta, latitude + latitude_delta]


def append_status(path: Path, record: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, allow_nan=False) + "\n")


def run(args: argparse.Namespace) -> dict:
    # CLI callers commonly pass relative output paths; normalize them before
    # recording repository-relative provenance after a successful download.
    args.status_output = args.status_output.resolve()
    args.image_dir = args.image_dir.resolve()
    load_dotenv()
    b3 = pd.read_csv(B3_INPUT)
    matches = b3.loc[b3["hotspot_id"].eq(args.hotspot_id)]
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one B3 hotspot for {args.hotspot_id!r}; found {len(matches)}.")
    row = matches.iloc[0]
    requested_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    base = {
        "hotspot_id": args.hotspot_id,
        "status": "not_attempted",
        "imagery_source": "Sentinel Hub Sentinel-2 L2A",
        "coordinates": {"latitude": float(row.latitude), "longitude": float(row.longitude)},
        "event_timestamp_utc": str(row.acquisition_timestamp_utc),
        "requested_at_utc": requested_at,
        "parameters": {"buffer_m": args.buffer_m, "days_before": args.days_before, "days_after": args.days_after, "max_cloud_cover_percent": args.max_cloud_cover, "width_px": args.width, "height_px": args.height},
        "provenance": {"catalog_endpoint": CATALOG_URL, "process_endpoint": PROCESS_URL},
        "note": "Manual-review enrichment only; this utility never changes B3 labels, anomaly flags, or confidence scores.",
    }
    client_id = os.getenv("SENTINELHUB_CLIENT_ID")
    client_secret = os.getenv("SENTINELHUB_CLIENT_SECRET")
    if not client_id or not client_secret:
        base.update({"status": "unavailable_missing_authenticated_credentials", "failure_reason": "SENTINELHUB_CLIENT_ID and SENTINELHUB_CLIENT_SECRET are not configured."})
        append_status(args.status_output, base)
        return base
    if not args.allow_network:
        base.update({"status": "not_attempted_network_opt_in_required", "failure_reason": "Credentials are configured but --allow-network was not supplied."})
        append_status(args.status_output, base)
        return base

    event_time = datetime.fromisoformat(str(row.acquisition_timestamp_utc).replace("Z", "+00:00"))
    start = (event_time - timedelta(days=args.days_before)).isoformat().replace("+00:00", "Z")
    end = (event_time + timedelta(days=args.days_after)).isoformat().replace("+00:00", "Z")
    bbox = bounds(float(row.latitude), float(row.longitude), args.buffer_m)
    try:
        token = access_token(client_id, client_secret)
        catalog = post_json(CATALOG_URL, {
            "bbox": bbox,
            "datetime": f"{start}/{end}",
            "collections": ["sentinel-2-l2a"],
            "limit": 100,
            "filter": f"eo:cloud_cover <= {args.max_cloud_cover}",
        }, token)
        features = catalog.get("features", [])
        if not features:
            base.update({"status": "unavailable_no_cloud_qualified_scene", "failure_reason": "No Sentinel-2 L2A catalog scene met the requested date/cloud constraints.", "search_window_utc": [start, end], "bbox_wgs84": bbox})
            append_status(args.status_output, base)
            return base
        scene = min(features, key=lambda feature: abs(datetime.fromisoformat(feature["properties"]["datetime"].replace("Z", "+00:00")) - event_time))
        acquisition = scene["properties"]["datetime"]
        payload = {
            "input": {"bounds": {"bbox": bbox, "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}}, "data": [{"type": "sentinel-2-l2a", "dataFilter": {"timeRange": {"from": acquisition, "to": acquisition}, "maxCloudCoverage": args.max_cloud_cover}}]},
            "output": {"width": args.width, "height": args.height, "responses": [{"identifier": "default", "format": {"type": "image/png"}}]},
            "evalscript": "//VERSION=3\nfunction setup(){return {input:['B04','B03','B02'],output:{bands:3}};}\nfunction evaluatePixel(s){return [2.5*s.B04,2.5*s.B03,2.5*s.B02];}",
        }
        request = Request(PROCESS_URL, data=json.dumps(payload).encode("utf-8"), headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Accept": "image/png"}, method="POST")
        with urlopen(request, timeout=120) as response:
            image = response.read()
        args.image_dir.mkdir(parents=True, exist_ok=True)
        image_path = args.image_dir / f"{args.hotspot_id}_{acquisition.replace(':', '').replace('-', '')}.png"
        image_path.write_bytes(image)
        base.update({"status": "downloaded_for_manual_review", "scene_id": scene.get("id"), "acquisition_datetime_utc": acquisition, "search_window_utc": [start, end], "bbox_wgs84": bbox, "image_path": str(image_path.relative_to(ROOT)), "image_sha256": __import__("hashlib").sha256(image).hexdigest()})
    except (HTTPError, URLError, KeyError, ValueError) as error:
        base.update({"status": "unavailable_request_failed", "failure_reason": f"{type(error).__name__}: {error}", "search_window_utc": [start, end], "bbox_wgs84": bbox})
    append_status(args.status_output, base)
    return base


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hotspot-id", required=True, help="One B3 hotspot ID; batch fetches are intentionally unsupported.")
    parser.add_argument("--allow-network", action="store_true", help="Permit authenticated Sentinel Hub requests after credentials are found.")
    parser.add_argument("--buffer-m", type=float, default=250.0)
    parser.add_argument("--days-before", type=int, default=3)
    parser.add_argument("--days-after", type=int, default=3)
    parser.add_argument("--max-cloud-cover", type=float, default=30.0)
    parser.add_argument("--width", type=int, default=256)
    parser.add_argument("--height", type=int, default=256)
    parser.add_argument("--status-output", type=Path, default=DEFAULT_STATUS)
    parser.add_argument("--image-dir", type=Path, default=DEFAULT_IMAGE_DIR)
    return parser.parse_args()


if __name__ == "__main__":
    print(json.dumps(run(parse_args()), indent=2))
