# Track B B3 evaluation and tuning readiness

Create the deterministic 80-row review queue:

```powershell
python track_b/b3/prepare_b3_evaluation_queue.py
```

The queue is a review aid, not training data. A non-`uncertain` label may only
be assigned by an independent human review decision. An external URL can be
recorded as evidence, but it is not itself a confirmed label.

After conducting one independent web/evidence search per queue row, record
the completed pass without assigning labels:

```powershell
python track_b/b3/finalize_b3_evidence_pass.py
```

Rows with no verified URL stay `no_evidence_found_pending_review`; rows with a
verified URL become `evidence_found_pending_confirmation`. Neither status is a
human review, and both retain a null `review_label`.

## Current review state and metric eligibility

The completed project queue has 80 rows. Each currently has
`review_label=uncertain` and `label_status=ai_assisted_evidence_review`; these
are AI-assisted evidence dispositions pending human confirmation, not ground
truth. They are intentionally excluded from evaluation metrics and threshold
tuning. Consequently, `completed_review_rows=0` and no quantitative
precision/recall/F1 claim is available.

A future reviewer may replace an `uncertain` disposition with a completed,
independently evidenced human label. Only `label_status=reviewed` rows with a
non-null, non-`uncertain` label are eligible for the evaluation script.

After human review, run:

```powershell
python track_b/b3/evaluate_b3_review_labels.py
python track_b/b3/tune_b3_thresholds.py
```

Evaluation uses confusion matrices, per-class precision/recall/F1, macro F1,
weighted F1, and industrial-fire anomaly precision/recall. It separately
reports sufficient- and insufficient-history rows; accuracy is not the primary
metric. Tuning is deliberately deferred until there are at least 75 reviewed
target rows, 20 confirmed rows per target class, and five facility groups.
This is not enough evidence for supervised-model training by itself: retain
the B3 rule baseline until an independently reviewed held-out set exists.

## Evidence Search Findings & Review Scope

Each of the five `industrial_fire` candidates received five distinct extended
search variants: facility/date/district; facility/district without date;
Thoothukudi industrial-fire query for the surrounding month; Thoothukudi
factory-explosion query for the surrounding reporting window; and a
Tamil-language Thoothukudi factory-fire query. No directly date- and
facility-matched independent evidence was found in this pass.

This null result is consistent with either genuinely minor or undocumented
thermal events, or evidence existing outside this search's reach (for example,
Tamil-language outlets, state-agency records, or non-indexed compliance and
complaint logs). General web search, even with Tamil query terms, does not
distinguish between those possibilities.

Full independent human review of all 80 queued rows was not completed within
the project timeline. The five `industrial_fire` rows received extended search
and were exported for blind external review. All 80 rows now carry an
AI-assisted `uncertain` disposition pending human confirmation; there are no
confirmed industrial-fire labels and no rows remaining at
`no_evidence_found_pending_review`. This is a known limitation, not a dropped
task.

**B3 is a transparent rule-based operational baseline. Quantitative precision,
recall, and F1 are not reported because the project does not yet have
sufficient independently verified ground-truth labels. AI-assisted `uncertain`
review dispositions are explicitly excluded from evaluation and threshold
tuning.**

## Evaluation Event-Clustering Safeguard

Before producing review-label metrics, `evaluate_b3_review_labels.py` creates
a view-only event representation for labelled rows. It groups rows with the
same acquisition date/time, instrument, satellite, and FRP (within a small
floating-point tolerance) when their centres are connected within a configurable
1 km geodesic radius. A same-label, same-prediction group contributes one
evaluation event rather than multiple pseudo-replicated samples. A group with
conflicting human labels is reported as `cluster_label_conflict` and excluded
from main metrics until a reviewer resolves it; conflicting predictions are
also reported and excluded conservatively.

This safeguard was added after the 2024-07-19 S-NPP / FRP 44.71 triplet: three
raw FIRMS detections, 433.7–693.8 m apart, were verified as a genuine adjacent-
pixel thermal event rather than a merge artifact. B2 deliberately retains all
three real observations for recurrence and FRP baselines. Only evaluation
support is collapsed, so precision/recall/F1 does not incorrectly count one
physical incident as three independent reviewed events.
