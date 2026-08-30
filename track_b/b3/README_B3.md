# Track B B3 — Industrial sub-classification and anomaly detection

Run from the repository root:

```powershell
python track_b/b3/build_b3_classified_anomalies.py
```

The script reads `data/sample/processed/track_b_b2_recurrence_baselines.csv`
and writes:

- `data/sample/processed/track_b_b3_classified_anomalies.csv`
- `data/sample/validation/track_b_b3_validation.json`

The deterministic defaults were chosen from the B2 matched-row distribution:
recurrence >= 8 is the 75th percentile and recurrence <= 3 is the median.
`gas_flare` requires sufficient history, recurrence >= 8, and `|z_score_frp|`
<= 1. `industrial_fire` requires sufficient history, recurrence <= 3, and
`z_score_frp` >= 3; it is the only rule that sets `is_anomalous = true`.
`mining_activity` is based directly on B1's `facility_type = mining`.

Z-scores are emitted only for matched rows with sufficient history, at least
two prior sensor-specific FRP observations, a positive FRP standard deviation,
and numeric current FRP. B2's `facility_id + instrument + satellite` baseline
is used without pooling sensors.

Confidence is a transparent rule-evidence score, not a calibrated probability.
It combines match proximity, rule evidence, and history availability. Unmatched
rows have null confidence. Rows with `insufficient_history = true` cannot be
anomalous or classified as `industrial_fire`; only a direct mining tag may be
emitted, with confidence capped at 0.55. B4 must preserve these guardrails.
