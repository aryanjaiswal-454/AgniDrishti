"""Finalize extended evidence status and blind external export for five B3 fire rows."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
EXPORT = ROOT / "data/sample/processed/track_b_b3_industrial_fire_external_review.csv"
REPORT = ROOT / "data/sample/validation/track_b_b3_industrial_fire_extended_evidence.json"
EXTERNAL_COLUMNS = [
    "hotspot_id", "latitude", "longitude", "acq_date", "acq_time", "instrument", "satellite", "frp",
    "facility_id", "facility_name", "facility_type", "distance_to_facility_m", "recurrence_count_90d",
    "history_coverage_days", "insufficient_history", "evidence_reference", "review_notes",
]


def blank(series: pd.Series) -> pd.Series:
    return series.isna() | series.astype("string").str.strip().eq("")


def run() -> dict:
    queue = pd.read_csv(QUEUE)
    fire_rows = queue.loc[queue["sample_stratum"].eq("industrial_fire")].copy()
    if len(fire_rows) != 5 or not fire_rows["hotspot_id"].is_unique:
        raise RuntimeError("The external review scope must contain exactly five unique industrial-fire rows.")
    if queue["review_label"].notna().any():
        raise RuntimeError("Extended evidence collection cannot assign or alter review labels.")
    if fire_rows["evidence_reference"].notna().any() and (~blank(fire_rows["evidence_reference"])).any():
        raise RuntimeError("Populate an independently verified evidence reference before marking this pass complete.")

    # The completed five-variant pass yielded no directly date/facility-matched
    # source. Only these five rows receive the extended-search status.
    queue.loc[queue["sample_stratum"].eq("industrial_fire"), "label_status"] = "no_evidence_found_after_extended_search"
    queue.to_csv(QUEUE, index=False)

    export = queue.loc[queue["sample_stratum"].eq("industrial_fire")].copy().rename(columns={"name": "facility_name"})
    export = export[EXTERNAL_COLUMNS].sort_values("hotspot_id", kind="stable")
    forbidden = {"sub_class", "is_anomalous", "confidence_score", "z_score_frp"}
    if forbidden.intersection(export.columns):
        raise RuntimeError("Blind external-review export leaked B3 prediction fields.")
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    export.to_csv(EXPORT, index=False)
    report = {
        "status": "completed_external_review_pending",
        "queue_path": str(QUEUE.relative_to(ROOT)),
        "external_export_path": str(EXPORT.relative_to(ROOT)),
        "industrial_fire_rows": int(len(export)),
        "search_variants_per_row": 5,
        "search_variants": [
            "facility name/type + acquisition date + district",
            "facility name/type + district without date",
            "Thoothukudi industrial fire + surrounding month",
            "Thoothukudi factory explosion + surrounding month / wider reporting window",
            "Tamil-language Thoothukudi factory-fire query",
        ],
        "direct_evidence_found": 0,
        "review_labels_assigned": int(queue["review_label"].notna().sum()),
        "scope_policy": "Only the five industrial-fire rows were changed. The remaining 75 queue rows retain their prior evidence statuses.",
        "language_limitation": "Tamil-language query terms were used, but general web search cannot establish complete coverage of Tamil outlets or state-agency records that are not indexed.",
        "blind_export_excludes": sorted(forbidden),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    result = run()
    print(json.dumps(result, indent=2))
    print("\nExternal-review CSV:\n")
    print(EXPORT.read_text(encoding="utf-8"), end="")
