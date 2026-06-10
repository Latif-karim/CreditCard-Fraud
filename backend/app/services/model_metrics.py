"""Load deep learning model evaluation metrics from ml/artifacts/metrics.json."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path


def _artifacts_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "ml" / "artifacts"


def load_model_metrics_payload() -> dict:
    metrics_path = _artifacts_dir() / "metrics.json"
    manifest_path = _artifacts_dir() / "model_manifest.json"
    cnn_path = _artifacts_dir() / "fraud_cnn.keras"

    if not metrics_path.exists():
        return {
            "pr_auc": None,
            "roc_auc": None,
            "recall_fraud": None,
            "precision_at_alert": None,
            "f1_score": None,
            "selected_model": None,
            "model_type": "deep_learning",
            "model_family": None,
            "last_trained": None,
            "artifact_present": cnn_path.exists(),
            "notes": "No metrics.json found. Run: python ml/bootstrap_model.py",
        }

    try:
        payload = json.loads(metrics_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {
            "pr_auc": None,
            "roc_auc": None,
            "recall_fraud": None,
            "precision_at_alert": None,
            "selected_model": None,
            "model_type": "deep_learning",
            "last_trained": None,
            "artifact_present": cnn_path.exists(),
            "notes": "Could not parse metrics.json",
        }

    selected_name = payload.get("selected_model")
    results = payload.get("results") or []
    selected = next((r for r in results if r.get("name") == selected_name), results[0] if results else {})

    manifest = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            manifest = payload.get("manifest") or {}

    last_trained = manifest.get("trained_at")
    if not last_trained and cnn_path.exists():
        mtime = datetime.utcfromtimestamp(cnn_path.stat().st_mtime)
        last_trained = mtime.strftime("%Y-%m-%d")

    return {
        "pr_auc": selected.get("average_precision"),
        "roc_auc": selected.get("roc_auc"),
        "recall_fraud": selected.get("recall"),
        "precision_at_alert": selected.get("precision"),
        "f1_score": selected.get("f1"),
        "selected_model": selected_name,
        "model_type": payload.get("model_type", "deep_learning"),
        "model_family": manifest.get("model_family"),
        "architecture": manifest.get("architecture"),
        "selection_strategy": payload.get("selection_strategy"),
        "last_trained": last_trained,
        "artifact_present": cnn_path.exists(),
        "all_models": results,
        "notes": (
            "Metrics from offline evaluation on held-out test split. "
            "Live scoring uses rules + behavioral analytics + CNN/autoencoder hybrid fusion."
        ),
    }
