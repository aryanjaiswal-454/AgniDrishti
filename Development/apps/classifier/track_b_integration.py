"""
Track B Integration Module

Loads pre-computed Track B results from the JSONL output file.
Track B is batch-processed, so we load all results into memory and
perform lookups by hotspot_id.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Track B data cache
_track_b_cache: Optional[Dict[str, Dict[str, Any]]] = None


def load_track_b_results(jsonl_path: Path) -> Dict[str, Dict[str, Any]]:
    """
    Load Track B pre-computed results from JSONL file.

    Returns a dictionary mapping hotspot_id -> classification result.
    """

    results = {}

    if not jsonl_path.exists():
        logger.warning(f"Track B results file not found: {jsonl_path}")
        return results

    try:
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue

                try:
                    record = json.loads(line)
                    hotspot_id = record.get("hotspot_id")

                    if not hotspot_id:
                        logger.warning(f"Line {line_num}: missing hotspot_id")
                        continue

                    results[hotspot_id] = record

                except json.JSONDecodeError as e:
                    logger.error(f"Line {line_num}: invalid JSON: {e}")
                    continue

        logger.info(f"✅ Loaded {len(results)} Track B results from {jsonl_path}")

    except Exception as e:
        logger.error(f"Failed to load Track B results: {e}")

    return results


def get_track_b_cache(jsonl_path: Path) -> Dict[str, Dict[str, Any]]:
    """Get cached Track B results, loading if necessary."""
    global _track_b_cache

    if _track_b_cache is None:
        _track_b_cache = load_track_b_results(jsonl_path)

    return _track_b_cache


def get_track_b_result(hotspot_id: str, jsonl_path: Path) -> Optional[Dict[str, Any]]:
    """
    Get Track B classification result for a specific hotspot_id.

    Returns the Track B result dict, or None if not found.
    """

    cache = get_track_b_cache(jsonl_path)
    result = cache.get(hotspot_id)

    if result:
        logger.debug(f"Track B result found for {hotspot_id}")
    else:
        logger.debug(f"No Track B result for {hotspot_id}")

    return result
