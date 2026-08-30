"""Gate B3 threshold tuning on enough independently reviewed labels."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
REPORT = ROOT / "data/sample/validation/track_b_b3_tuning.json"
TARGETS = ["industrial_fire", "gas_flare", "mining_activity"]
MIN_REVIEWED_ROWS = 75
MIN_CLASS_SUPPORT = 20
MIN_FACILITY_GROUPS = 5


def run() -> dict:
    queue = pd.read_csv(QUEUE)
    reviewed = queue.loc[
        queue["label_status"].eq("reviewed")
        & queue["review_label"].isin(TARGETS)
    ].copy()
    supports = {label: int((reviewed["review_label"] == label).sum()) for label in TARGETS}
    requirements = {
        "minimum_reviewed_rows": MIN_REVIEWED_ROWS,
        "minimum_support_per_target_class": MIN_CLASS_SUPPORT,
        "minimum_unique_facility_groups": MIN_FACILITY_GROUPS,
    }
    ready = (
        len(reviewed) >= MIN_REVIEWED_ROWS
        and all(support >= MIN_CLASS_SUPPORT for support in supports.values())
        and reviewed["facility_id"].nunique() >= MIN_FACILITY_GROUPS
    )
    report = {
        "status": "ready_for_grouped_threshold_tuning" if ready else "deferred_pending_independent_labels",
        "queue_path": str(QUEUE.relative_to(ROOT)),
        "reviewed_target_rows": int(len(reviewed)),
        "class_support": supports,
        "unique_facility_groups": int(reviewed["facility_id"].nunique()),
        "requirements": requirements,
        "candidate_threshold_ranges": {
            "persistent_recurrence_min": [4, 5, 6, 7, 8, 9, 10, 11, 12],
            "low_recurrence_max": [0, 1, 2, 3, 4, 5],
            "gas_flare_abs_z_max": [0.5, 0.75, 1.0, 1.25, 1.5],
            "industrial_fire_z_min": [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0],
            "facility_distance_m": [1000, 2000, 3000, 4000, 5000],
        },
        "selection_policy": "When prerequisites are met, use facility-grouped evaluation, retain the insufficient-history guardrail in every candidate, and select by macro F1 with industrial-fire precision/recall reported separately. Do not use accuracy as the selection metric.",
        "model_training_decision": "Rule-based B3 remains the validated baseline; more reviewed labels are required before supervised model training." if not ready else "Threshold tuning may proceed; supervised training still requires a separately held-out, independently reviewed evaluation set.",
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
