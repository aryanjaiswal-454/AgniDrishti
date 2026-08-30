# Track A — Phase A3 ML model refinement

Run `python track_a/a3/train_a3_model.py`, then `python track_a/a3/validate_a3_model.py` from the repository root. Training consumes `data/sample/processed/firms_sample_a2_rule_based.csv`; it does not rebuild A1 or A2 and does not overwrite source or processed FIRMS datasets.

The model is a fixed-seed (`42`) `RandomForestClassifier` with a stratified 75/25 primary-class train/test split. Numeric features are `a1_brightness_normalized`, `a1_frp_normalized`, `a2_neighborhood_detection_count`, and `a1_month`. Categorical features are `a1_land_cover_type`, `a1_daynight`, `a1_season`, and `a1_instrument_group`. Coordinates, labels, A2 rule IDs/density levels, and A2 confidence are deliberately excluded to prevent target leakage.

The only labels currently in the repository are A2's rule-based baseline outputs (`primary_class` and natural-side `sub_class`), so they are self-generated labels rather than independent ground truth. The evaluation therefore measures held-out agreement with A2; it is not evidence of real-world industrial-vs-natural fire accuracy. The natural sub-class model is trained only on natural training rows, while industrial results return a null `sub_class` because industrial sub-classification remains Track B scope.

Outputs are versioned `track_a_ml_v1.0`: model artifact and metadata in `data/sample/models/`; held-out evaluation JSON and primary/natural-subclass confusion-matrix CSVs in `data/sample/evaluation/`. `inference.py` exposes `classify_primary(hotspot_features)`, returning only `primary_class`, `sub_class`, probability-derived `confidence_score`, and `model_version`. It is not the A4 shared-contract wrapper.

The verified pilot run used 1,020 A2 rows: 765 training and 255 held-out rows, stratified as 13/5 industrial and 752/250 natural. It recorded primary accuracy, precision, recall, and F1 of 1.00 for both classes (confusion matrix: `[[5, 0], [0, 250]]`); natural-subclass held-out accuracy was also 1.00. Those values reflect the model's agreement with the deterministic A2 self-labels and their source signals, so they must not be presented as independently validated real-world performance.
