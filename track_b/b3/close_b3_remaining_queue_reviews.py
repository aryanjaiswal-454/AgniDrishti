"""Record the requested AI-assisted disposition for the 75 pending queue rows."""

from __future__ import annotations

from datetime import date
from pathlib import Path

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
REVIEWER = "AI-assisted blind review (Claude), pending human confirmation"
DCW_IDS = {"firms_44fe2536260b14fa", "firms_864b601a5fd1850a"}
IBTPL_IDS = {"firms_8df0c19064f038af", "firms_93d6cb77ea58298f", "firms_adc308dd418cfe59"}
DCW_NOTE = (
    "Facility-level search for 'DCW Limited Thoothukudi fire' found no incident/fire reports — only business directory and "
    "litigation records for DCW Limited (caustic soda/chlorine manufacturer, Sahupuram). No evidence found for this specific "
    "date; not independently confirmed."
)
IBTPL_NOTE = (
    "No direct incident report found for this facility. Search surfaced a separate, well-documented major fire at Tamil Nadu "
    "Thermal Power Station (TTPS), Thoothukudi, 2025-03-15 ~16:30 UTC onward — but that is a different plant (~15km away, "
    "~8.764N 78.177E vs this facility's ~8.88N 78.05E) and no date here matches. Not evidence for this row."
)
UNNAMED_FACILITY_NOTE = (
    "No OSM facility name available for targeted search. General district-level searches across this evaluation round (including "
    "the confirmed TTPS fire, which does not match this row's date/coordinates) found no report for this specific detection. "
    "Recurrence/FRP pattern not independently verified against external evidence."
)
MINING_NOTE = (
    "General search for Thoothukudi-area quarry/mining fire or explosion incidents (2024–2025) found no matching report. "
    "This coast is predominantly beach/mineral-sand mining (ilmenite, garnet), a different risk profile than deep coal mining, "
    "consistent with absence of explosion-type reports. Not independently verified."
)


def run() -> dict:
    queue = pd.read_csv(QUEUE)
    for column in ("review_label", "label_status", "reviewer", "review_date", "evidence_reference", "review_notes"):
        queue[column] = queue[column].astype("object")
    pending = queue["label_status"].eq("no_evidence_found_pending_review")
    if int(pending.sum()) != 75:
        raise ValueError(f"Expected exactly 75 pending rows, found {int(pending.sum())}.")

    notes = pd.Series(index=queue.index, dtype="object")
    notes.loc[pending & queue["hotspot_id"].isin(DCW_IDS)] = DCW_NOTE
    notes.loc[pending & queue["hotspot_id"].isin(IBTPL_IDS)] = IBTPL_NOTE
    notes.loc[pending & queue["sample_stratum"].eq("mining_activity")] = MINING_NOTE
    remaining = pending & notes.isna() & queue["sample_stratum"].isin(
        ["gas_flare", "unclassified_facility_matched"]
    )
    notes.loc[remaining] = UNNAMED_FACILITY_NOTE
    if notes.loc[pending].isna().any():
        missing = queue.loc[pending & notes.isna(), "hotspot_id"].tolist()
        raise ValueError(f"Pending rows lack an approved review-note group: {missing}")

    queue.loc[pending, "review_label"] = "uncertain"
    queue.loc[pending, "label_status"] = "ai_assisted_evidence_review"
    queue.loc[pending, "reviewer"] = REVIEWER
    queue.loc[pending, "review_date"] = date.today().isoformat()
    queue.loc[pending, "evidence_reference"] = ""
    queue.loc[pending, "review_notes"] = notes.loc[pending]
    queue.to_csv(QUEUE, index=False)
    return {
        "updated_rows": int(pending.sum()),
        "dcw_rows": int((pending & queue["hotspot_id"].isin(DCW_IDS)).sum()),
        "ibtpl_rows": int((pending & queue["hotspot_id"].isin(IBTPL_IDS)).sum()),
        "mining_rows": int((pending & queue["sample_stratum"].eq("mining_activity")).sum()),
        "remaining_gas_or_unclassified_rows": int(remaining.sum()),
        "remaining_pending_rows": int(queue["label_status"].eq("no_evidence_found_pending_review").sum()),
    }


if __name__ == "__main__":
    print(run())
