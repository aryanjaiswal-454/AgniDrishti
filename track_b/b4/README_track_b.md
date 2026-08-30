# Track B B4 — contract handoff and optional imagery review

Run the contract adapter and its validation from the repository root:

```powershell
python track_b/b4/build_b4_shared_output.py
python track_b/b4/validate_b4_shared_output.py
```

The adapter reads the immutable B3 output and writes three downstream files:

- `data/sample/processed/track_b_b4_contract_ready.jsonl` — exactly one record
  per B3 hotspot, conforming to `shared/shared_output_contract.schema.json`.
- `data/sample/processed/track_b_b4_traceability.jsonl` — source acquisition,
  instrument/satellite, facility, and B2/B3 context that the strict shared
  contract forbids as additional properties.
- `data/sample/processed/track_b_b4_contract_metadata.json` — version,
  limitations, provenance, and the input fingerprint.

Track B owns facility and industrial-side fields. `primary_class` and
`land_cover_type` are set to `null` because Track A owns those standalone
fields. Null facility, recurrence, and z-score values stay null; they are never
replaced with guesses.

`model_version=track_b_b3_rules_v1_rule_based` means this is a deterministic
rule baseline, not a trained or calibrated model. There are no independently
verified labels sufficient for precision/recall/F1, so AI-assisted `uncertain`
review dispositions are excluded from metrics and tuning. All
`insufficient_history=true` rows preserve B3's guardrail: they cannot be
industrial-fire anomalies and any retained mining confidence is capped.

## Optional Sentinel-2 imagery

The imagery helper is intentionally non-blocking and requests one hotspot at a
time only. It writes a provenance/status record to
`data/sample/processed/track_b_b4_imagery_enrichment.jsonl` and never changes
B3 records or review labels.

```powershell
python track_b/b4/fetch_b4_sentinel_thumbnail.py --hotspot-id firms_aaa475fee26d4c1c
```

Without `SENTINELHUB_CLIENT_ID` and `SENTINELHUB_CLIENT_SECRET` in the runtime
environment, it records `unavailable_missing_authenticated_credentials` and
stops. With legitimate credentials, add `--allow-network` to query the
Sentinel Hub catalog for a cloud-qualified Sentinel-2 L2A scene and download a
small RGB PNG. The output records the selected scene ID, acquisition time,
bounds, parameters, endpoint provenance, and image hash. A thumbnail is only
manual-review evidence; it does not create a ground-truth label or validate a
B3 prediction.

Do not commit imagery credentials. The TTPS March-2025 incident remains an
open follow-up and is not linked to a B3 event.
