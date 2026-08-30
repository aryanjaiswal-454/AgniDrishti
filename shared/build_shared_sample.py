"""Build the versioned AIML shared-kickoff sample from repository raw data.

This intentionally only prepares shared inputs; no Track A or Track B features
or classifications are created here.
"""

from __future__ import annotations

import csv
import io
import mmap
from datetime import date
from pathlib import Path

import numpy as np
import tifffile


ROOT = Path(__file__).resolve().parents[1]
RAW_FIRMS = ROOT / "data/raw/firms/fire_archive_SV-C2_793828.csv"
RAW_TILES = ROOT / "data/raw/worldcover/tiles"
OUT_FIRMS = ROOT / "data/sample/input/firms_sample.csv"
OUT_RASTER = ROOT / "data/sample/input/worldcover_thoothukudi_2025q4.tif"

# Thoothukudi industrial corridor, Tamil Nadu (WGS84).
WEST, SOUTH, EAST, NORTH = 77.85, 8.35, 78.45, 8.95
# The trailing two complete calendar years as of the 2026 kickoff.
START, END = date(2024, 1, 1), date(2025, 12, 31)
SCALE = 1 / 12000  # ESA WorldCover 10 m grid in geographic degrees.


def build_firms_sample() -> int:
    with RAW_FIRMS.open(newline="", encoding="utf-8") as header_source:
        fieldnames = next(csv.reader(header_source))
    with RAW_FIRMS.open("rb") as raw_source, OUT_FIRMS.open("w", newline="", encoding="utf-8") as target:
        mapped = mmap.mmap(raw_source.fileno(), 0, access=mmap.ACCESS_READ)
        start_marker = f",{START.isoformat()},".encode()
        start_offset = mapped.find(start_marker)
        if start_offset < 0:
            raise RuntimeError(f"No FIRMS records found on or after {START.isoformat()}.")
        raw_source.seek(mapped.rfind(b"\n", 0, start_offset) + 1)
        reader = csv.DictReader(io.TextIOWrapper(raw_source, encoding="utf-8", newline=""), fieldnames=fieldnames)
        writer = csv.DictWriter(target, fieldnames=reader.fieldnames)
        writer.writeheader()
        count = 0
        for row in reader:
            observed = date.fromisoformat(row["acq_date"])
            if observed > END:
                break
            latitude, longitude = float(row["latitude"]), float(row["longitude"])
            if START <= observed <= END and SOUTH <= latitude <= NORTH and WEST <= longitude <= EAST:
                writer.writerow(row)
                count += 1
        mapped.close()
    return count


def copy_window(page: tifffile.TiffPage, destination: np.ndarray, source_x0: int, source_x1: int,
                source_y0: int, source_y1: int, destination_x0: int) -> None:
    tiles_x = (page.imagewidth + page.tilewidth - 1) // page.tilewidth
    min_tile_x, max_tile_x = source_x0 // page.tilewidth, (source_x1 - 1) // page.tilewidth
    min_tile_y, max_tile_y = source_y0 // page.tilelength, (source_y1 - 1) // page.tilelength
    handle = page.parent.filehandle
    for tile_y in range(min_tile_y, max_tile_y + 1):
        for tile_x in range(min_tile_x, max_tile_x + 1):
            index = tile_y * tiles_x + tile_x
            handle.seek(page.dataoffsets[index])
            encoded = handle.read(page.databytecounts[index])
            tile, _, _ = page.decode(encoded, index)
            tile = np.squeeze(tile)
            tx0, ty0 = tile_x * page.tilewidth, tile_y * page.tilelength
            ix0, ix1 = max(source_x0, tx0), min(source_x1, tx0 + page.tilewidth)
            iy0, iy1 = max(source_y0, ty0), min(source_y1, ty0 + page.tilelength)
            if ix0 >= ix1 or iy0 >= iy1:
                continue
            dx0 = destination_x0 + ix0 - source_x0
            dy0 = iy0 - source_y0
            destination[dy0 : dy0 + iy1 - iy0, dx0 : dx0 + ix1 - ix0] = tile[
                iy0 - ty0 : iy1 - ty0, ix0 - tx0 : ix1 - tx0
            ]


def build_landcover_clip() -> None:
    width, height = round((EAST - WEST) / SCALE), round((NORTH - SOUTH) / SCALE)
    clipped = np.zeros((height, width), dtype=np.uint8)
    for tile_west, tile_name in ((75, "ESA_WorldCover_10m_2021_v200_N06E075_Map.tif"),
                                 (78, "ESA_WorldCover_10m_2021_v200_N06E078_Map.tif")):
        tile_east = tile_west + 3
        overlap_west, overlap_east = max(WEST, tile_west), min(EAST, tile_east)
        if overlap_west >= overlap_east:
            continue
        with tifffile.TiffFile(RAW_TILES / tile_name) as image:
            page = image.pages[0]
            source_x0, source_x1 = round((overlap_west - tile_west) / SCALE), round((overlap_east - tile_west) / SCALE)
            source_y0, source_y1 = round((9 - NORTH) / SCALE), round((9 - SOUTH) / SCALE)
            destination_x0 = round((overlap_west - WEST) / SCALE)
            copy_window(page, clipped, source_x0, source_x1, source_y0, source_y1, destination_x0)

    extratags = [
        (33550, "d", 3, (SCALE, SCALE, 0.0), False),
        (33922, "d", 6, (0.0, 0.0, 0.0, WEST, NORTH, 0.0), False),
        (34735, "H", 32, (1, 1, 0, 7, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2049, 34737, 7, 0, 2054, 0, 1, 9102, 2057, 34736, 1, 1, 2059, 34736, 1, 0), False),
        (34736, "d", 2, (298.257223563, 6378137.0), False),
        (34737, "s", 7, "WGS 84|", False),
        (42113, "s", 2, "0", False),
    ]
    tifffile.imwrite(OUT_RASTER, clipped, compression="deflate", tile=(512, 512), metadata=None, extratags=extratags)


if __name__ == "__main__":
    records = build_firms_sample()
    build_landcover_clip()
    print(f"Wrote {records} FIRMS records to {OUT_FIRMS.name} and land-cover clip to {OUT_RASTER.name}.")
