"""Evaluate B3 against human labels with view-only same-event clustering."""

from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "data/sample/processed/track_b_b3_evaluation_queue.csv"
REPORT = ROOT / "data/sample/validation/track_b_b3_evaluation.json"
TARGET_LABELS = ["industrial_fire", "gas_flare", "mining_activity", "other_industrial", "natural_or_nonindustrial"]
EVENT_CLUSTER_RADIUS_M = 1_000.0
FRP_TOLERANCE = 1e-6


def haversine_m(left: pd.Series, right: pd.Series) -> float:
    """Return geodesic distance between two WGS84 points in metres."""
    latitude_1, longitude_1 = math.radians(float(left["latitude"])), math.radians(float(left["longitude"]))
    latitude_2, longitude_2 = math.radians(float(right["latitude"])), math.radians(float(right["longitude"]))
    delta_latitude = latitude_2 - latitude_1
    delta_longitude = longitude_2 - longitude_1
    value = (
        math.sin(delta_latitude / 2) ** 2
        + math.cos(latitude_1) * math.cos(latitude_2) * math.sin(delta_longitude / 2) ** 2
    )
    return 6_371_000 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def shares_event_signature(left: pd.Series, right: pd.Series) -> bool:
    """Compare non-spatial FIRMS attributes used to identify one thermal event."""
    signature_columns = ["acq_date", "acq_time", "instrument", "satellite"]
    if any(str(left[column]) != str(right[column]) for column in signature_columns):
        return False
    return abs(float(left["frp"]) - float(right["frp"])) <= FRP_TOLERANCE


def cluster_labelled_rows(labelled: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Collapse unambiguous adjacent-pixel rows for evaluation only.

    Components use identical FIRMS acquisition/source/FRP signatures and a
    1-km geodesic link.  Conflicting human labels are deliberately excluded
    rather than resolved by an automated rule.
    """
    if labelled.empty:
        return labelled.copy(), {
            "clusters_detected": 0,
            "rows_deduplicated_for_evaluation": 0,
            "cluster_label_conflicts": [],
            "cluster_prediction_conflicts": [],
            "labelled_event_samples_after_clustering": 0,
        }

    rows = labelled.reset_index(drop=True)
    adjacency = [set() for _ in range(len(rows))]
    for left_index in range(len(rows)):
        for right_index in range(left_index + 1, len(rows)):
            left, right = rows.iloc[left_index], rows.iloc[right_index]
            if shares_event_signature(left, right) and haversine_m(left, right) <= EVENT_CLUSTER_RADIUS_M:
                adjacency[left_index].add(right_index)
                adjacency[right_index].add(left_index)

    components: list[list[int]] = []
    visited: set[int] = set()
    for start in range(len(rows)):
        if start in visited:
            continue
        stack, component = [start], []
        visited.add(start)
        while stack:
            index = stack.pop()
            component.append(index)
            for neighbor in adjacency[index]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    stack.append(neighbor)
        components.append(sorted(component))

    representatives: list[pd.Series] = []
    label_conflicts, prediction_conflicts = [], []
    clusters_detected = rows_deduplicated = 0
    for component in components:
        members = rows.iloc[component].sort_values("hotspot_id")
        if len(component) == 1:
            representatives.append(members.iloc[0])
            continue

        clusters_detected += 1
        cluster_summary = {
            "hotspot_ids": members["hotspot_id"].astype(str).tolist(),
            "row_count": int(len(members)),
            "review_labels": sorted(members["review_label"].astype(str).unique().tolist()),
        }
        if len(cluster_summary["review_labels"]) != 1:
            cluster_summary["status"] = "cluster_label_conflict"
            label_conflicts.append(cluster_summary)
            continue

        predictions = sorted(members["sub_class"].fillna("unclassified").astype(str).unique().tolist())
        if len(predictions) != 1:
            cluster_summary["status"] = "cluster_prediction_conflict"
            cluster_summary["predicted_subclasses"] = predictions
            prediction_conflicts.append(cluster_summary)
            continue

        representatives.append(members.iloc[0])
        rows_deduplicated += len(members) - 1

    clustered = pd.DataFrame(representatives) if representatives else labelled.iloc[0:0].copy()
    if not clustered.empty:
        clustered = clustered.sort_values("hotspot_id").reset_index(drop=True)
    return clustered, {
        "clusters_detected": int(clusters_detected),
        "rows_deduplicated_for_evaluation": int(rows_deduplicated),
        "cluster_label_conflicts": label_conflicts,
        "cluster_prediction_conflicts": prediction_conflicts,
        "labelled_event_samples_after_clustering": int(len(clustered)),
    }


def subset_metrics(frame: pd.DataFrame) -> dict:
    if frame.empty:
        return {"reviewed_rows": 0, "metrics_available": False}
    truth = frame["review_label"].astype(str)
    predicted = frame["sub_class"].fillna("unclassified").astype(str)
    labels = TARGET_LABELS + ["unclassified"]
    precision, recall, f1, support = precision_recall_fscore_support(
        truth, predicted, labels=labels, zero_division=0
    )
    anomaly_truth = truth.eq("industrial_fire")
    anomaly_predicted = frame["is_anomalous"].astype(bool)
    anomaly_precision, anomaly_recall, anomaly_f1, _ = precision_recall_fscore_support(
        anomaly_truth, anomaly_predicted, average="binary", zero_division=0
    )
    return {
        "reviewed_rows": int(len(frame)),
        "metrics_available": True,
        "labels": labels,
        "confusion_matrix": confusion_matrix(truth, predicted, labels=labels).tolist(),
        "per_class": {
            label: {"precision": float(p), "recall": float(r), "f1": float(f), "support": int(s)}
            for label, p, r, f, s in zip(labels, precision, recall, f1, support)
        },
        "macro_f1": float(precision_recall_fscore_support(truth, predicted, average="macro", zero_division=0)[2]),
        "weighted_f1": float(precision_recall_fscore_support(truth, predicted, average="weighted", zero_division=0)[2]),
        "anomaly_industrial_fire": {
            "precision": float(anomaly_precision), "recall": float(anomaly_recall), "f1": float(anomaly_f1),
            "support": int(anomaly_truth.sum()),
        },
    }


def run() -> dict:
    queue = pd.read_csv(QUEUE)
    labelled = queue.loc[queue["review_label"].notna()].copy()
    clustered_labelled, clustering = cluster_labelled_rows(labelled)
    completed = clustered_labelled.loc[
        clustered_labelled["label_status"].eq("reviewed")
        & ~clustered_labelled["review_label"].eq("uncertain")
    ].copy()
    report = {
        "status": "ready_for_human_labels" if completed.empty else "evaluated",
        "queue_path": str(QUEUE.relative_to(ROOT)),
        "queue_rows": int(len(queue)),
        "rows_with_any_review_label": int(len(labelled)),
        "completed_review_rows_raw": int(
            (
                queue["label_status"].eq("reviewed")
                & queue["review_label"].notna()
                & ~queue["review_label"].eq("uncertain")
            ).sum()
        ),
        "completed_review_rows": int(len(completed)),
        "completed_review_event_samples": int(len(completed)),
        "event_clustering_policy": "Before eligibility and metrics, labelled rows with identical acq_date, acq_time, instrument, satellite, and FRP within tolerance are clustered when their centres are within the configured geodesic radius. Same-label/same-prediction clusters count as one evaluation event; label or prediction conflicts are excluded and reported.",
        "event_cluster_radius_m": EVENT_CLUSTER_RADIUS_M,
        "frp_tolerance": FRP_TOLERANCE,
        **clustering,
        "evaluation_policy": "Only label_status=reviewed rows with a non-null, non-uncertain review_label are evaluated after view-only event clustering. Accuracy is intentionally omitted as a primary metric.",
        "overall": subset_metrics(completed),
        "sufficient_history": subset_metrics(completed.loc[~completed["insufficient_history"].astype(bool)]),
        "insufficient_history": subset_metrics(completed.loc[completed["insufficient_history"].astype(bool)]),
        "model_training_decision": "Rule-based B3 remains the validated baseline; more reviewed labels are required before supervised model training." if completed.empty else "See tuning prerequisites before considering supervised model training.",
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
