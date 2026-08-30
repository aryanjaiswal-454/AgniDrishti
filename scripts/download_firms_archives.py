"""Download standard FIRMS archive extracts for the agreed shared AIML sample."""

from __future__ import annotations

import os
import argparse
import csv
import io
from datetime import date, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv


HERE = Path(__file__).parent
ROOT = HERE.parent
RAW = ROOT / "data/raw/firms"
SAMPLE_INPUT = ROOT / "data/sample/input"
load_dotenv(ROOT / ".env")
MAP_KEY = os.environ.get("MAP_KEY")
BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api"
BBOX = "77.85,8.35,78.45,8.95"
START, END = date(2024, 1, 1), date(2025, 12, 31)
SOURCES = ("MODIS_SP", "VIIRS_SNPP_SP", "VIIRS_NOAA20_SP")
SOURCE_IDENTITY = {
    "MODIS_SP": ("MODIS", None),
    "VIIRS_SNPP_SP": ("VIIRS", "SNPP"),
    "VIIRS_NOAA20_SP": ("VIIRS", "NOAA-20"),
}


def request_csv(url: str, context: str) -> str:
    try:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
    except requests.RequestException as error:
        raise RuntimeError(f"FIRMS request failed for {context}: {error.__class__.__name__}") from error
    if response.text.lstrip().lower().startswith("error"):
        raise RuntimeError(response.text[:500])
    return response.text


def fetch_source(source: str) -> Path:
    """Fetch five-day windows, the largest range accepted by the FIRMS area API."""
    output = RAW / f"{source.lower()}_thoothukudi_2024_2025.csv"
    output.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = None
    rows: list[dict[str, str]] = []
    instrument, required_satellite = SOURCE_IDENTITY[source]
    current = START
    while current <= END:
        window_end = min(current + timedelta(days=4), END)
        url = f"{BASE_URL}/area/csv/{MAP_KEY}/{source}/{BBOX}/5/{window_end.isoformat()}"
        text = request_csv(url, f"{source} ending {window_end.isoformat()}").strip()
        if text:
            reader = csv.DictReader(io.StringIO(text))
            if fieldnames is None:
                fieldnames = reader.fieldnames
            if reader.fieldnames != fieldnames:
                raise RuntimeError(f"Unexpected header for {source} on {current.isoformat()}.")
            for row in reader:
                row["instrument"] = instrument
                if required_satellite:
                    row["satellite"] = required_satellite
                elif not row.get("satellite", "").strip():
                    raise RuntimeError(f"Missing MODIS satellite identifier for {source} on {current.isoformat()}.")
                rows.append(row)
        current += timedelta(days=5)
    if fieldnames is None:
        raise RuntimeError(f"No response header returned for {source}.")
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("sources", nargs="*", choices=SOURCES, default=SOURCES)
    arguments = parser.parse_args()
    if not MAP_KEY:
        raise RuntimeError("MAP_KEY is required in the project-root .env file.")
    availability = request_csv(f"{BASE_URL}/data_availability/csv/{MAP_KEY}/all", "data availability")
    (SAMPLE_INPUT / "firms_source_availability.csv").write_text(availability, encoding="utf-8")
    for source_name in arguments.sources:
        path = fetch_source(source_name)
        print(f"Downloaded {source_name} to {path.name}")
