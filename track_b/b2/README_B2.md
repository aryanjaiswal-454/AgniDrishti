# Track B B2 — Persistent-source recurrence and FRP baselines

Run from the repository root:

```powershell
python track_b/b2/build_b2_recurrence_baselines.py
```

The script reads the immutable B1 output at
`data/sample/processed/track_b_b1_facility_matches.csv` and writes:

- `data/sample/processed/track_b_b2_recurrence_baselines.csv`
- `data/sample/validation/track_b_b2_validation.json`

`acq_date` and zero-padded `acq_time` are treated as UTC. For each
facility-matched, timestamp-valid hotspot, `recurrence_count_90d` counts prior
detections at the same `facility_id` in `[timestamp - 90 days, timestamp)`;
events at the same timestamp do not count one another. Unmatched detections
remain in the output with all B2 recurrence/baseline fields null.

FRP baseline fields use the same leakage-safe window, but are grouped by
`facility_id`, `instrument`, and `satellite`. This keeps MODIS, VIIRS SNPP,
and VIIRS NOAA-20 values separate. A mean requires one prior numeric FRP
observation; sample standard deviation requires two. B2 does not calculate
z-scores, anomaly flags, or industrial subclasses; those belong to B3.

`history_coverage_days` is the observed same-facility history before each
matched hotspot, calculated as `min(90, floor(days since the earliest
same-facility detection in this dataset))`. `insufficient_history` is true
when that coverage is below 90 days. Unmatched or timestamp-invalid rows have
null coverage and are conservatively marked `insufficient_history = true`.

B3 must check `insufficient_history` before interpreting low recurrence or an
FRP z-score: suppress the anomaly flag or reduce `confidence_score` for such
rows rather than emitting a high-confidence result.
