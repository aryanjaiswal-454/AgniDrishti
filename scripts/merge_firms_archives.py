"""Merge authenticated MODIS/NOAA-20 archives into the validated S-NPP sample."""

from __future__ import annotations

import csv
from datetime import date
from pathlib import Path


HERE = Path(__file__).parent
ROOT = HERE.parent
RAW = ROOT / "data/raw/firms"
COMBINED = ROOT / "data/sample/input/firms_sample.csv"
MODIS = RAW / "modis_sp_thoothukudi_2024_2025.csv"
NOAA20 = RAW / "viirs_noaa20_sp_thoothukudi_2024_2025.csv"
WEST, SOUTH, EAST, NORTH = 77.85, 8.35, 78.45, 8.95
START, END = date(2024, 1, 1), date(2025, 12, 31)
FIELDS = [
    "source_dataset", "latitude", "longitude", "brightness", "bright_ti4", "scan", "track",
    "acq_date", "acq_time", "satellite", "instrument", "confidence", "version",
    "bright_t31", "bright_ti5", "frp", "daynight", "type",
]
SOURCE_IDENTITY = {
    "MODIS_SP": ("MODIS", None),
    "VIIRS_SNPP_SP": ("VIIRS", "SNPP"),
    "VIIRS_NOAA20_SP": ("VIIRS", "NOAA-20"),
}


def key(row: dict[str, str]) -> tuple[str, str, str, str, str, str]:
    return (
        f"{float(row['latitude']):.5f}", f"{float(row['longitude']):.5f}", row["acq_date"],
        row["acq_time"], row["instrument"], row["satellite"],
    )


def normalize(row: dict[str, str], source_dataset: str) -> dict[str, str]:
    normalized = {field: row.get(field, "") for field in FIELDS}
    normalized["source_dataset"] = source_dataset
    instrument, required_satellite = SOURCE_IDENTITY[source_dataset]
    normalized["instrument"] = instrument
    if required_satellite:
        normalized["satellite"] = required_satellite
    elif not normalized["satellite"].strip():
        raise ValueError("MODIS record is missing its Terra/Aqua satellite identifier.")
    # MODIS natively reports brightness/bright_t31; VIIRS reports bright_ti4/bright_ti5.
    return normalized


def in_scope(row: dict[str, str]) -> bool:
    latitude, longitude = float(row["latitude"]), float(row["longitude"])
    observed = date.fromisoformat(row["acq_date"])
    return SOUTH <= latitude <= NORTH and WEST <= longitude <= EAST and START <= observed <= END


def load(path: Path, default_source_dataset: str) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return [
            normalize(row, row.get("source_dataset") or default_source_dataset)
            for row in csv.DictReader(handle)
            if in_scope(row)
        ]


def main() -> None:
    baseline = load(COMBINED, "VIIRS_SNPP_SP")
    # The validated existing sample is authoritative for S-NPP; do not add its new archive again.
    incoming = load(MODIS, "MODIS_SP") + load(NOAA20, "VIIRS_NOAA20_SP")
    merged, seen, discarded = [], set(), 0
    for row in baseline + incoming:
        identity = key(row)
        if identity in seen:
            discarded += 1
            continue
        seen.add(identity)
        merged.append(row)
    merged.sort(key=lambda row: (row["acq_date"], row["acq_time"].zfill(4), row["source_dataset"], row["latitude"], row["longitude"]))
    with COMBINED.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(merged)
    print(f"Merged {len(baseline)} baseline and {len(incoming)} authenticated rows into {len(merged)} records; {discarded} same-sensor duplicates removed.")


if __name__ == "__main__":
    main()
