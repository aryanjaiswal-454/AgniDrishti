"""Create a deterministic, human-review-only B3 evaluation queue."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
INPUT = ROOT / "data/sample/processed/track_b_b3_classified_anomalies.csv"
OUTPUT = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
VALIDATION_OUTPUT = ROOT / "data/sample/validation/track_b_b3_evaluation_queue_validation.json"
RANDOM_SEED = 26162
LABEL_VOCABULARY = {
    "industrial_fire", "gas_flare", "mining_activity", "other_industrial",
    "natural_or_nonindustrial", "uncertain",
}
SAMPLE_PLAN = {
    "industrial_fire": {"count": None, "minimum_insufficient_history": 0},
    "gas_flare": {"count": 28, "minimum_insufficient_history": 0},
    "mining_activity": {"count": 18, "minimum_insufficient_history": 6},
    "unclassified_facility_matched": {"count": 29, "minimum_insufficient_history": 8},
}
CONTEXT_COLUMNS = [
    "hotspot_id", "latitude", "longitude", "acquisition_timestamp_utc", "acq_date", "acq_time",
    "source_dataset", "instrument", "satellite", "frp", "facility_id", "name", "facility_type",
    "osm_element_type", "osm_element_id", "distance_to_facility_m", "recurrence_count_90d",
    "facility_frp_observation_count_90d", "facility_frp_mean_90d", "facility_frp_std_90d",
    "history_coverage_days", "insufficient_history", "z_score_frp", "sub_class",
    "is_anomalous", "confidence_score",
]
REVIEW_COLUMNS = [
    "sample_stratum", "evidence_search_query", "review_label", "label_status", "reviewer",
    "review_date", "evidence_reference", "review_notes",
]


def deterministic_sample(frame: pd.DataFrame, count: int, minimum_insufficient: int, seed: int) -> pd.DataFrame:
    if len(frame) < count:
        raise RuntimeError(f"Requested {count} rows but only {len(frame)} are available.")
    insufficient = frame.loc[frame["insufficient_history"].astype(bool)]
    if len(insufficient) < minimum_insufficient:
        raise RuntimeError("The requested stratum lacks sufficient insufficient-history rows.")
    selected_parts = []
    if minimum_insufficient:
        selected_parts.append(insufficient.sample(n=minimum_insufficient, random_state=seed))
    selected_ids = set(selected_parts[0]["hotspot_id"]) if selected_parts else set()
    remaining = frame.loc[~frame["hotspot_id"].isin(selected_ids)]
    selected_parts.append(remaining.sample(n=count - len(selected_ids), random_state=seed + 1))
    return pd.concat(selected_parts).sort_values("hotspot_id", kind="stable")


def make_query(row: pd.Series) -> str:
    facility = row["name"] if pd.notna(row["name"]) and str(row["name"]).strip() else row["facility_type"]
    return f"{facility} fire {row['acq_date']} Thoothukudi"


def run() -> dict:
    source = pd.read_csv(INPUT)
    missing = set(CONTEXT_COLUMNS) - set(source.columns)
    if missing:
        raise RuntimeError(f"B3 output is missing review context: {sorted(missing)}")
    if not source["hotspot_id"].is_unique:
        raise RuntimeError("B3 output must have unique hotspot IDs.")

    industrial_fire = source.loc[source["sub_class"].eq("industrial_fire")].copy()
    gas_flare = source.loc[source["sub_class"].eq("gas_flare")].copy()
    mining = source.loc[source["sub_class"].eq("mining_activity")].copy()
    unclassified = source.loc[source["sub_class"].isna() & source["facility_id"].notna()].copy()
    selections = [
        industrial_fire.assign(sample_stratum="industrial_fire"),
        deterministic_sample(gas_flare, 28, 0, RANDOM_SEED + 10).assign(sample_stratum="gas_flare"),
        deterministic_sample(mining, 18, 6, RANDOM_SEED + 20).assign(sample_stratum="mining_activity"),
        deterministic_sample(unclassified, 29, 8, RANDOM_SEED + 30).assign(sample_stratum="unclassified_facility_matched"),
    ]
    queue = pd.concat(selections, ignore_index=True)
    if len(industrial_fire) != 5:
        raise RuntimeError(f"Expected all 5 industrial-fire candidates, found {len(industrial_fire)}.")
    if not queue["hotspot_id"].is_unique:
        raise RuntimeError("Evaluation queue contains duplicate hotspot IDs.")
    queue["evidence_search_query"] = queue.apply(make_query, axis=1)
    queue["review_label"] = pd.NA
    queue["label_status"] = "pending_human_review"
    queue["reviewer"] = pd.NA
    queue["review_date"] = pd.NA
    queue["evidence_reference"] = pd.NA
    queue["review_notes"] = pd.NA
    queue = queue[CONTEXT_COLUMNS + REVIEW_COLUMNS].sort_values(["sample_stratum", "hotspot_id"], kind="stable")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    queue.to_csv(OUTPUT, index=False)
    counts = {key: int(value) for key, value in queue["sample_stratum"].value_counts().sort_index().items()}
    validation = {
        "status": "passed",
        "input_path": str(INPUT.relative_to(ROOT)),
        "output_path": str(OUTPUT.relative_to(ROOT)),
        "random_seed": RANDOM_SEED,
        "queue_rows": int(len(queue)),
        "unique_hotspot_ids": int(queue["hotspot_id"].nunique()),
        "stratum_counts": counts,
        "all_industrial_fire_candidates_included": int(len(industrial_fire)),
        "insufficient_history_rows": int(queue["insufficient_history"].astype(bool).sum()),
        "review_label_non_null": int(queue["review_label"].notna().sum()),
        "initial_label_status": "pending_human_review",
        "review_label_vocabulary": sorted(LABEL_VOCABULARY),
    }
    VALIDATION_OUTPUT.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    return validation


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
