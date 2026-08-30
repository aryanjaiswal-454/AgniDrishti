# Track A handoff module

Track A packages completed A0–A3 work for later Dev Phase D7 integration. A1 produces land-cover/radiometric/temporal features; A2 provides the rule baseline; A3 supplies the `track_a_ml_v1.0` Random Forest model. This A4 wrapper does not retrain or alter that model.

The A3 artifact is `data/sample/models/track_a_ml_v1_0.joblib`. A3 expects `a1_brightness_normalized`, `a1_frp_normalized`, `a2_neighborhood_detection_count`, `a1_month`, `a1_land_cover_type`, `a1_daynight`, `a1_season`, and `a1_instrument_group`. Its labels are A2 self-generated labels, so its evaluation is agreement with A2 rather than independent real-world accuracy.

Use `classify_track_a(hotspot_features)` from `track_a/a4/handoff.py`. The caller must provide a non-empty `hotspot_id`, numeric `latitude` and `longitude`, the A3 features above, and `a1_land_cover_type` (or `land_cover_type`). The return value is a JSON-serializable record conforming to `shared/shared_output_contract.schema.json`.

Track A fills `hotspot_id`, coordinates, `land_cover_type`, A3 `primary_class`, `sub_class`, `confidence_score`, and `model_version`. It always emits `null` for `facility_id`, `distance_to_facility_m`, `recurrence_count_90d`, `z_score_frp`, and `is_anomalous`; these are Track B-owned fields. The shared schema does not include `facility_type`, so A4 does not emit it.

Run `python track_a/a4/validate_a4_handoff.py` from the repository root to validate natural and industrial sample rows against the actual Draft 2020-12 shared schema (`jsonschema` is required only for this validation script). To retrain the existing A3 model, run `python track_a/a3/train_a3_model.py`; no new A4 training path exists. For D7, the future FastAPI service can import `classify_track_a` and pass one enriched hotspot record at a time. D7 itself is not implemented here.
