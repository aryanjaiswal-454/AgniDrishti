"""Record a completed B3 evidence-search pass without assigning review labels."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
REPORT = ROOT / "data/sample/validation/track_b_b3_evidence_pass.json"


def blank(series: pd.Series) -> pd.Series:
    return series.isna() | series.astype("string").str.strip().eq("")


def run() -> dict:
    queue = pd.read_csv(QUEUE)
    required = {"hotspot_id", "review_label", "label_status", "reviewer", "review_date", "evidence_reference", "review_notes"}
    missing = required - set(queue.columns)
    if missing:
        raise RuntimeError(f"Evaluation queue is missing columns: {sorted(missing)}")
    # This pass deliberately never creates labels, reviewers, or review dates.
    if queue["review_label"].notna().any() or (~blank(queue["reviewer"])).any() or (~blank(queue["review_date"])).any():
        raise RuntimeError("Evidence collection cannot overwrite or fabricate a human review.")
    evidence_found = ~blank(queue["evidence_reference"])
    queue.loc[evidence_found, "label_status"] = "evidence_found_pending_confirmation"
    queue.loc[~evidence_found, "label_status"] = "no_evidence_found_pending_review"
    queue.loc[~evidence_found, "review_notes"] = pd.NA
    queue.to_csv(QUEUE, index=False)
    report = {
        "status": "completed_pending_human_confirmation",
        "queue_path": str(QUEUE.relative_to(ROOT)),
        "queue_rows": int(len(queue)),
        "search_attempts": int(len(queue)),
        "evidence_found_pending_confirmation": int(evidence_found.sum()),
        "no_evidence_found_pending_review": int((~evidence_found).sum()),
        "review_labels_assigned": int(queue["review_label"].notna().sum()),
        "policy": "Evidence collection records only independently verifiable URLs and factual summaries. It never assigns review_label, reviewer, review_date, or reviewed status.",
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
