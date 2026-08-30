"""Record the explicitly requested first, AI-assisted blind-review disposition."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
REPORT = ROOT / "data/sample/validation/track_b_b3_first_review_closure.json"
TARGET_IDS = {
    "firms_26795529990e487f",
    "firms_70b31109e57d4d2c",
    "firms_aaa475fee26d4c1c",
    "firms_c6e6132bd0d7afdb",
    "firms_fefe6139f7128536",
}
REVIEWER = "AI-assisted blind review (Claude), pending human confirmation"
NOTES = (
    "No independent evidence was found after the extended multi-variant search. "
    "The 2024-07-19 triplet is a confirmed genuine multi-pixel FIRMS detection, "
    "not a merge artifact, with FRP 44.71 versus 8.23 and 8.55 for the other two "
    "candidates; it is the strongest candidate for further manual investigation "
    "(for example, satellite-basemap inspection) if time permits. All five remain "
    "unconfirmed and must not be presented as validated industrial_fire events."
)


def run() -> dict:
    queue = pd.read_csv(QUEUE)
    for column in ("review_label", "label_status", "reviewer", "review_date", "review_notes"):
        queue[column] = queue[column].astype("object")
    target_mask = queue["hotspot_id"].isin(TARGET_IDS)
    target = queue.loc[target_mask]
    if len(target) != len(TARGET_IDS) or set(target["hotspot_id"]) != TARGET_IDS:
        raise ValueError("The five requested industrial_fire review rows were not found exactly once.")
    if not target["sub_class"].eq("industrial_fire").all():
        raise ValueError("A requested review row is no longer an industrial_fire candidate.")
    if queue.loc[~target_mask, "review_label"].notna().any():
        raise ValueError("Refusing to alter the queue because a non-target row already has a review label.")

    queue.loc[target_mask, "review_label"] = "uncertain"
    queue.loc[target_mask, "label_status"] = "ai_assisted_evidence_review"
    queue.loc[target_mask, "reviewer"] = REVIEWER
    queue.loc[target_mask, "review_date"] = date.today().isoformat()
    queue.loc[target_mask, "review_notes"] = NOTES
    queue.to_csv(QUEUE, index=False)

    result = {
        "status": "first_review_pass_closed_pending_human_confirmation",
        "queue_path": str(QUEUE.relative_to(ROOT)),
        "reviewed_rows": int(target_mask.sum()),
        "review_label": "uncertain",
        "non_target_review_labels": int(queue.loc[~target_mask, "review_label"].notna().sum()),
        "reviewer": REVIEWER,
        "review_date": date.today().isoformat(),
        "human_confirmation_required": True,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
