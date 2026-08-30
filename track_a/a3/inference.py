"""Inference API for the serialized Phase A3 Track A model."""

from __future__ import annotations

from pathlib import Path
from typing import Mapping

import joblib
import pandas as pd

from train_a3_model import DEFAULT_MODEL, FEATURE_COLUMNS


def load_a3_model(model_path: Path = DEFAULT_MODEL) -> dict:
    if not model_path.exists():
        raise FileNotFoundError(f"A3 model artifact not found: {model_path}. Run train_a3_model.py first.")
    return joblib.load(model_path)


def classify_primary(hotspot_features: Mapping[str, object], model_path: Path = DEFAULT_MODEL) -> dict[str, object]:
    """Classify one A1/A2-featured hotspot without producing the A4 contract."""
    artifact = load_a3_model(model_path)
    feature_columns = artifact["feature_columns"]
    row = pd.DataFrame([{column: hotspot_features.get(column) for column in feature_columns}])
    primary_model = artifact["primary_model"]
    primary_class = str(primary_model.predict(row)[0])
    probabilities = primary_model.predict_proba(row)[0]
    class_index = list(primary_model.named_steps["classifier"].classes_).index(primary_class)
    confidence = float(probabilities[class_index])
    sub_class: str | None = None
    if primary_class == "natural":
        sub_class = str(artifact["natural_subclass_model"].predict(row)[0])
    return {
        "primary_class": primary_class,
        "sub_class": sub_class,
        "confidence_score": confidence,
        "model_version": artifact["model_version"],
    }
