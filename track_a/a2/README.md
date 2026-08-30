# Track A — Phase A2 rule-based baseline classifier

Run `python track_a/a2/build_a2_rule_based_classifier.py`, followed by `python track_a/a2/validate_a2_rule_based_classifier.py`, from the repository root. A2 consumes `data/sample/processed/firms_sample_a1_enriched.csv` and writes `data/sample/processed/firms_sample_a2_rule_based.csv` with `data/sample/validation/firms_sample_a2_validation.json`; it never overwrites the FIRMS source or A1 output.

The classifier preserves every A1 column and adds `a2_neighborhood_detection_count`, `a2_density_level`, `a2_rule_id`, `primary_class`, `sub_class`, `confidence_score`, and `model_version` (`rule_based_v1.0`). The neighborhood count is the number of pilot hotspots within 1,000 m of each valid point, including itself. It is a spatial density calculation only—not facility matching and not a trailing 90-day recurrence measure.

Thresholds are in `A2Config`: radius 1,000 m; low density at 2 or fewer detections; strong cluster at 10 or more. The defaults are explicit and can be passed to `build_a2_classifier` for a documented pilot rerun.

Rules are deterministic. Cropland is natural/agricultural_burning; forest is natural/forest_fire; grassland is natural/other_natural. Built-up or bare is industrial only when a strong cluster corroborates it. Non-clustered built-up/bare and unknown land cover fall back to natural/other_natural with lower confidence because Track A intentionally lacks facility evidence. Strong agreement receives higher confidence; conflicting or missing context receives lower confidence. A2 does not create an industrial sub-class, which remains Track B scope.

This is a transparent baseline, not a validated real-world fire classifier. WorldCover is local 2021 context; a fixed pilot spatial density can change if the sample extent or time span changes. A3 model training and all Track B functions remain out of scope.
