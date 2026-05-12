from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np


@dataclass
class ModelResult:
    probability: float
    score: float
    reasons: list[str]


_model_bundle = None


def _artifact_path() -> Path:
    return Path(__file__).resolve().parents[2] / "ml" / "artifacts" / "fraud_model.joblib"


def _load_model_bundle():
    global _model_bundle
    if _model_bundle is not None:
        return _model_bundle
    artifact = _artifact_path()
    if artifact.exists():
        _model_bundle = joblib.load(artifact)
    else:
        _model_bundle = {}
    return _model_bundle


def _fallback_probability(amount: float, tx_frequency_10m: int, minutes_since_last: float) -> float:
    return min(
        0.99,
        0.1 + (amount / 20000) + (tx_frequency_10m * 0.07) + (0.2 if minutes_since_last < 1 else 0),
    )


def predict_fraud_probability(
    amount: float, tx_frequency_10m: int, minutes_since_last: float
) -> ModelResult:
    bundle = _load_model_bundle()
    features = np.array([[amount, tx_frequency_10m, minutes_since_last]], dtype=float)
    model = bundle.get("model")
    if model is not None:
        probability = float(model.predict_proba(features)[0][1])
    else:
        probability = _fallback_probability(amount, tx_frequency_10m, minutes_since_last)

    score = probability * 35
    reasons: list[str] = []
    if probability > 0.7:
        reasons.append("ML model detected high fraud probability")
    if model is None:
        reasons.append("Using fallback ML heuristic (trained artifact missing)")
    return ModelResult(probability=probability, score=score, reasons=reasons)
