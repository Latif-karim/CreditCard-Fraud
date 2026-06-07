"""Load real model evaluation metrics from ml/artifacts/metrics.json."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path


def _artifacts_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "ml" / "artifacts"


def load_model_metrics_payload() -> dict:
    metrics_path = _artifacts_dir() / "metrics.json"
    artifact_path = _artifacts_dir() / "fraud_model.joblib"

    if not metrics_path.exists():
        return {
            "pr_auc": None,
            "recall_fraud": None,
            "precision_at_alert": None,
            "selected_model": None,
            "last_trained": None,
            "artifact_present": artifact_path.exists(),
            "notes": "No metrics.json found. Run: python ml/train_model.py --dataset path/to/creditcard.csv",
        }

    try:
        payload = json.loads(metrics_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {
            "pr_auc": None,
            "recall_fraud": None,
            "precision_at_alert": None,
            "selected_model": None,
            "last_trained": None,
            "artifact_present": artifact_path.exists(),
            "notes": "Could not parse metrics.json",
        }

    selected_name = payload.get("selected_model")
    results = payload.get("results") or []
    selected = next((r for r in results if r.get("name") == selected_name), results[0] if results else {})

    last_trained = None
    if artifact_path.exists():
        mtime = datetime.utcfromtimestamp(artifact_path.stat().st_mtime)
        last_trained = mtime.strftime("%Y-%m-%d")

    return {
        "pr_auc": selected.get("average_precision"),
        "recall_fraud": selected.get("recall"),
        "precision_at_alert": selected.get("precision"),
        "f1_score": selected.get("f1"),
        "selected_model": selected_name,
        "selection_strategy": payload.get("selection_strategy"),
        "last_trained": last_trained,
        "artifact_present": artifact_path.exists(),
        "all_models": results,
        "notes": (
            "Metrics from offline evaluation on held-out test split (Kaggle ULB-derived features). "
            "Live scoring uses the hybrid rules + behavior + ML fusion pipeline."
        ),
    }
