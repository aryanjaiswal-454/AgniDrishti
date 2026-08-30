"""Phase A3: train and evaluate the standalone Track A Random Forest model.

The only labels currently available are the existing A2 rule-based outputs.
Consequently, this evaluation measures held-out agreement with that baseline,
not independently verified real-world fire-classification performance.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
DEFAULT_A2_INPUT = ROOT / "data/sample/processed/firms_sample_a2_rule_based.csv"
MODELS_DIR = ROOT / "data/sample/models"
EVALUATION_DIR = ROOT / "data/sample/evaluation"
DEFAULT_MODEL = MODELS_DIR / "track_a_ml_v1_0.joblib"
DEFAULT_METADATA = MODELS_DIR / "track_a_ml_v1_0_metadata.json"
DEFAULT_EVALUATION = EVALUATION_DIR / "track_a_ml_v1_0_evaluation.json"
DEFAULT_PRIMARY_CONFUSION = EVALUATION_DIR / "track_a_ml_v1_0_primary_confusion_matrix.csv"
DEFAULT_SUBCLASS_CONFUSION = EVALUATION_DIR / "track_a_ml_v1_0_natural_subclass_confusion_matrix.csv"

# Deliberately excludes latitude/longitude, labels, A2 rule ID, density level,
# and A2 confidence, so no target or rule-output field is used as a feature.
NUMERIC_FEATURES = [
    "a1_brightness_normalized",
    "a1_frp_normalized",
    "a2_neighborhood_detection_count",
    "a1_month",
]
CATEGORICAL_FEATURES = [
    "a1_land_cover_type",
    "a1_daynight",
    "a1_season",
    "a1_instrument_group",
]
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES
PRIMARY_LABEL = "primary_class"
SUBCLASS_LABEL = "sub_class"
MODEL_VERSION = "track_a_ml_v1.0"
RANDOM_STATE = 42


@dataclass(frozen=True)
class A3Config:
    test_size: float = 0.25
    random_state: int = RANDOM_STATE
    n_estimators: int = 300
    min_samples_leaf: int = 1
    model_version: str = MODEL_VERSION


def load_a2(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"A2 input not found: {path}. Run Track A A2 first.")
    frame = pd.read_csv(path, keep_default_na=False)
    required = set(FEATURE_COLUMNS + [PRIMARY_LABEL, SUBCLASS_LABEL])
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"A2 input is missing required A3 columns: {', '.join(missing)}")
    valid_primary = {"industrial", "natural"}
    actual_primary = set(frame[PRIMARY_LABEL])
    if not actual_primary.issubset(valid_primary):
        raise ValueError(f"A2 contains invalid primary labels: {sorted(actual_primary - valid_primary)}")
    return frame


def make_pipeline(config: A3Config) -> Pipeline:
    preprocessing = ColumnTransformer(
        transformers=[
            ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median"))]), NUMERIC_FEATURES),
            ("categorical", Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]), CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )
    classifier = RandomForestClassifier(
        n_estimators=config.n_estimators,
        min_samples_leaf=config.min_samples_leaf,
        class_weight="balanced",
        random_state=config.random_state,
        n_jobs=-1,
    )
    return Pipeline([("preprocess", preprocessing), ("classifier", classifier)])


def _report(y_true: pd.Series, y_pred: object, labels: list[str]) -> dict[str, object]:
    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "classification_report": classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0),
        "confusion_matrix_labels": labels,
        "confusion_matrix": matrix.tolist(),
    }


def _write_confusion_matrix(path: Path, report: dict[str, object]) -> None:
    labels = report["confusion_matrix_labels"]
    matrix = report["confusion_matrix"]
    pd.DataFrame(matrix, index=labels, columns=labels).rename_axis("actual").to_csv(path)


def train_a3_model(a2_input: Path = DEFAULT_A2_INPUT, model_path: Path = DEFAULT_MODEL,
                   metadata_path: Path = DEFAULT_METADATA, evaluation_path: Path = DEFAULT_EVALUATION,
                   primary_confusion_path: Path = DEFAULT_PRIMARY_CONFUSION,
                   subclass_confusion_path: Path = DEFAULT_SUBCLASS_CONFUSION,
                   config: A3Config = A3Config()) -> dict[str, object]:
    """Fit on train rows only, evaluate held-out rows, then serialize both models."""
    frame = load_a2(a2_input)
    y_primary = frame[PRIMARY_LABEL]
    if y_primary.value_counts().min() < 2:
        raise ValueError("At least two examples per primary class are required for stratified evaluation.")
    X_train, X_test, y_train, y_test = train_test_split(
        frame[FEATURE_COLUMNS], y_primary,
        test_size=config.test_size,
        random_state=config.random_state,
        stratify=y_primary,
    )

    primary_model = make_pipeline(config)
    primary_model.fit(X_train, y_train)
    primary_predictions = primary_model.predict(X_test)
    primary_labels = ["industrial", "natural"]
    primary_evaluation = _report(y_test, primary_predictions, primary_labels)

    # The natural-side model is fit only from natural training rows. Industrial
    # rows have no Track A sub-class and are correctly returned as null.
    train_natural = frame.loc[X_train.index][frame.loc[X_train.index, PRIMARY_LABEL] == "natural"]
    test_natural = frame.loc[X_test.index][frame.loc[X_test.index, PRIMARY_LABEL] == "natural"]
    subclass_model = make_pipeline(config)
    subclass_model.fit(train_natural[FEATURE_COLUMNS], train_natural[SUBCLASS_LABEL])
    subclass_labels = ["agricultural_burning", "forest_fire", "other_natural"]
    subclass_predictions = subclass_model.predict(test_natural[FEATURE_COLUMNS])
    subclass_evaluation = _report(test_natural[SUBCLASS_LABEL], subclass_predictions, subclass_labels)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    evaluation_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model_version": config.model_version,
        "feature_columns": FEATURE_COLUMNS,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "primary_model": primary_model,
        "natural_subclass_model": subclass_model,
    }
    joblib.dump(artifact, model_path)

    evaluation = {
        "phase": "A3_ml_model_refinement",
        "model_type": "RandomForestClassifier",
        "model_version": config.model_version,
        "label_source": "A2 rule-based baseline/self-generated labels; no independently verified ground truth is present in the repository",
        "training_data_path": str(a2_input),
        "target_column": PRIMARY_LABEL,
        "natural_subclass_target_column": SUBCLASS_LABEL,
        "feature_columns": FEATURE_COLUMNS,
        "excluded_leakage_columns": ["latitude", "longitude", "primary_class", "sub_class", "confidence_score", "a2_rule_id", "a2_density_level", "model_version"],
        "config": asdict(config),
        "total_rows": int(len(frame)),
        "primary_class_distribution": dict(sorted(Counter(y_primary).items())),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "train_primary_class_distribution": dict(sorted(Counter(y_train).items())),
        "test_primary_class_distribution": dict(sorted(Counter(y_test).items())),
        "primary_held_out": primary_evaluation,
        "natural_subclass_held_out": {
            "test_rows": int(len(test_natural)),
            "class_distribution": dict(sorted(Counter(test_natural[SUBCLASS_LABEL]).items())),
            **subclass_evaluation,
        },
        "model_artifact_path": str(model_path),
        "primary_confusion_matrix_path": str(primary_confusion_path),
        "natural_subclass_confusion_matrix_path": str(subclass_confusion_path),
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    metadata = {
        "model_type": evaluation["model_type"],
        "model_version": config.model_version,
        "training_data_path": str(a2_input),
        "feature_columns": FEATURE_COLUMNS,
        "target_column": PRIMARY_LABEL,
        "natural_subclass_target_column": SUBCLASS_LABEL,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "random_state": config.random_state,
        "trained_at_utc": evaluation["trained_at_utc"],
    }
    evaluation_path.write_text(json.dumps(evaluation, indent=2) + "\n", encoding="utf-8")
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    _write_confusion_matrix(primary_confusion_path, primary_evaluation)
    _write_confusion_matrix(subclass_confusion_path, subclass_evaluation)
    return evaluation


if __name__ == "__main__":
    print(json.dumps(train_a3_model(), indent=2))
