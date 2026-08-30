"""Document, without relabelling, the March 2025 TTPS external incident lead."""

from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
FIRMS = ROOT / "data/sample/input/firms_sample.csv"
B3 = ROOT / "data/sample/processed/track_b_b3_classified_anomalies.csv"
REPORT = ROOT / "data/sample/validation/track_b_ttps_2025_march_lead.json"
TTPS_LATITUDE = 8.762518
TTPS_LONGITUDE = 78.175976
EVENT_DATES = {"2025-03-15", "2025-03-16"}


def haversine_m(latitude: float, longitude: float) -> float:
    latitude_1, longitude_1 = math.radians(TTPS_LATITUDE), math.radians(TTPS_LONGITUDE)
    latitude_2, longitude_2 = math.radians(latitude), math.radians(longitude)
    delta_latitude = latitude_2 - latitude_1
    delta_longitude = longitude_2 - longitude_1
    value = (
        math.sin(delta_latitude / 2) ** 2
        + math.cos(latitude_1) * math.cos(latitude_2) * math.sin(delta_longitude / 2) ** 2
    )
    return 6_371_000 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def nearby_rows(path: Path) -> dict:
    frame = pd.read_csv(path)
    date_rows = frame.loc[frame["acq_date"].astype(str).isin(EVENT_DATES)].copy()
    date_rows["distance_to_ttps_m"] = date_rows.apply(
        lambda row: haversine_m(float(row["latitude"]), float(row["longitude"])), axis=1
    )
    columns = [
        column for column in (
            "hotspot_id", "latitude", "longitude", "acq_date", "acq_time", "instrument", "satellite", "frp",
            "sub_class", "is_anomalous", "distance_to_ttps_m"
        ) if column in date_rows.columns
    ]
    closest_frame = date_rows.sort_values("distance_to_ttps_m").loc[:, columns].head(20)
    # Pandas serializes missing values as JSON null here, avoiding non-standard NaN literals.
    closest = json.loads(closest_frame.to_json(orient="records"))
    return {
        "path": str(path.relative_to(ROOT)),
        "total_rows": int(len(frame)),
        "rows_on_2025_03_15_or_2025_03_16": int(len(date_rows)),
        "rows_within_1km_of_ttps": int((date_rows["distance_to_ttps_m"] <= 1_000).sum()),
        "rows_within_5km_of_ttps": int((date_rows["distance_to_ttps_m"] <= 5_000).sum()),
        "closest_rows": closest,
    }


def run() -> dict:
    report = {
        "status": "open_follow_up_not_used_for_queue_labels",
        "lead": {
            "facility": "Tamil Nadu / Tuticorin Thermal Power Station (TTPS)",
            "reported_fire_start": "2025-03-15 approximately 22:00 IST (approximately 16:30 UTC); reports describe a cable-gallery/control-room fire.",
            "coordinates_wgs84": {"latitude": TTPS_LATITUDE, "longitude": TTPS_LONGITUDE},
            "sources": [
                {
                    "title": "Central Electricity Authority daily maintenance report",
                    "url": "https://npp.gov.in/public-reports/cea/daily/dgr/03-04-2025/dgr10-2025-04-03.pdf",
                    "support": "Lists TUTICORIN TPS Unit 2 outage from 15/03/2025 22:01 with cause 'FIRE IN CABLE GALLERY'.",
                },
                {
                    "title": "The New Indian Express: Fire at Thoothukudi plant, 630 MW of power generation hit",
                    "url": "https://www.newindianexpress.com/states/tamil-nadu/2025/Mar/17/fire-at-thoothukudi-plant-630-mw-of-power-generation-hit",
                    "support": "Reports the March 15 TTPS fire and response; independent news corroboration.",
                },
                {
                    "title": "Global Energy Monitor: Tuticorin Thermal Power Station",
                    "url": "https://www.gem.wiki/Tuticorin_Thermal_Power_Station",
                    "support": "Provides reference coordinates 8.762518, 78.175976.",
                },
            ],
        },
        "matching_method": "FIRMS rows dated 2025-03-15 or 2025-03-16 are checked by geodesic distance to the TTPS reference coordinate. This is a lead check only, not incident attribution.",
        "firms_sample": nearby_rows(FIRMS),
        "b3_output": nearby_rows(B3),
        "follow_up": "Open: inspect any temporally and spatially proximate FIRMS rows with independent imagery/operations evidence before associating them with the TTPS incident. Do not use this lead to relabel the evaluation queue.",
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
