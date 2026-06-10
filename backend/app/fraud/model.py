"""Deep learning inference: 1D-CNN classifier + autoencoder anomaly fusion."""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np

ML_DIR = Path(__file__).resolve().parents[2] / "ml"
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from features import FEATURE_COLUMNS, build_live_vector  # noqa: E402


@dataclass
class ModelResult:
    probability: float
    score: float
    reasons: list[str]
    cnn_probability: float
    autoencoder_score: float
    model_family: str


_artifacts: dict | None = None
_tf = None


def _artifacts_dir() -> Path:
    return ML_DIR / "artifacts"


def _load_tensorflow():
    global _tf
    if _tf is None:
        import tensorflow as tf

        _tf = tf
    return _tf


def _load_artifacts() -> dict:
    global _artifacts
    if _artifacts is not None:
        return _artifacts

    artifact_dir = _artifacts_dir()
    bundle: dict = {
        "cnn": None,
        "autoencoder": None,
        "scaler": None,
        "feature_order": FEATURE_COLUMNS,
        "manifest": {},
        "ae_threshold": 1.0,
    }

    manifest_path = artifact_dir / "model_manifest.json"
    if manifest_path.exists():
        bundle["manifest"] = json.loads(manifest_path.read_text(encoding="utf-8"))
        bundle["ae_threshold"] = float(bundle["manifest"].get("ae_reconstruction_threshold", 1.0))

    scaler_path = artifact_dir / "feature_scaler.joblib"
    if scaler_path.exists():
        scaler_bundle = joblib.load(scaler_path)
        bundle["scaler"] = scaler_bundle.get("scaler")
        bundle["feature_order"] = scaler_bundle.get("feature_order", FEATURE_COLUMNS)

    cnn_path = artifact_dir / "fraud_cnn.keras"
    ae_path = artifact_dir / "fraud_autoencoder.keras"
    if cnn_path.exists() and ae_path.exists():
        tf = _load_tensorflow()
        bundle["cnn"] = tf.keras.models.load_model(cnn_path)
        bundle["autoencoder"] = tf.keras.models.load_model(ae_path)

    _artifacts = bundle
    return bundle


def reload_models() -> None:
    """Clear cached models (after retrain)."""
    global _artifacts
    _artifacts = None


def _scale_vector(vector: np.ndarray, bundle: dict) -> np.ndarray:
    scaler = bundle.get("scaler")
    if scaler is None:
        return vector.reshape(1, -1)
    return scaler.transform(vector.reshape(1, -1))


def _fallback_probability(
    amount: float,
    tx_frequency_10m: float,
    minutes_since_last: float,
    *,
    merchant_category: str = "",
    country: str = "",
) -> ModelResult:
    vector = build_live_vector(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        merchant_category=merchant_category,
        country=country,
    )
    amt_signal = min(0.45, amount / 20000)
    vel_signal = min(0.35, tx_frequency_10m * 0.06)
    time_signal = 0.2 if minutes_since_last < 1 else 0.0
    proxy = min(0.99, 0.08 + amt_signal + vel_signal + time_signal + float(np.mean(np.abs(vector[:8])) * 0.04))
    return ModelResult(
        probability=proxy,
        score=proxy * 40,
        reasons=["Using heuristic fallback (deep learning artifacts missing)"],
        cnn_probability=proxy,
        autoencoder_score=proxy * 0.8,
        model_family="heuristic_fallback",
    )


def predict_fraud_probability(
    *,
    amount: float,
    tx_frequency_10m: float,
    minutes_since_last: float,
    location: str = "",
    country: str = "",
    merchant: str = "",
    merchant_category: str = "",
    device_id: str = "",
    ip_address: str = "",
    amount_vs_avg: float = 1.0,
    location_novel: bool = False,
) -> ModelResult:
    bundle = _load_artifacts()
    cnn = bundle.get("cnn")
    autoencoder = bundle.get("autoencoder")

    vector = build_live_vector(
        amount=amount,
        tx_frequency_10m=tx_frequency_10m,
        minutes_since_last=minutes_since_last,
        location=location,
        country=country,
        merchant=merchant,
        merchant_category=merchant_category,
        device_id=device_id,
        ip_address=ip_address,
        amount_vs_avg=amount_vs_avg,
        location_novel=location_novel,
    )

    if cnn is None or autoencoder is None:
        return _fallback_probability(
            amount,
            tx_frequency_10m,
            minutes_since_last,
            merchant_category=merchant_category,
            country=country,
        )

    scaled = _scale_vector(vector, bundle).astype(np.float32)
    cnn_input = scaled.reshape((1, scaled.shape[1], 1))
    cnn_prob = float(cnn.predict(cnn_input, verbose=0)[0][0])

    recon = autoencoder.predict(scaled, verbose=0)
    mse = float(np.mean(np.square(scaled - recon)))
    ae_threshold = max(float(bundle.get("ae_threshold", 1.0)), 1e-6)
    ae_score = float(np.clip(mse / ae_threshold, 0.0, 1.0))

    probability = float(np.clip(0.75 * cnn_prob + 0.25 * ae_score, 0.0, 0.999))
    score = probability * 40.0

    reasons: list[str] = []
    if cnn_prob > 0.65:
        reasons.append("Deep CNN classifier flagged elevated fraud probability")
    if ae_score > 0.7:
        reasons.append("Autoencoder detected anomalous transaction pattern")
    if probability > 0.8:
        reasons.append("Hybrid deep learning ensemble crossed high-risk threshold")

    return ModelResult(
        probability=probability,
        score=score,
        reasons=reasons,
        cnn_probability=cnn_prob,
        autoencoder_score=ae_score,
        model_family=bundle.get("manifest", {}).get("model_family", "deep_learning_hybrid"),
    )
