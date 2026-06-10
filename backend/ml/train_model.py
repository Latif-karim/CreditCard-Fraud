"""Train hybrid deep learning fraud models: 1D-CNN classifier + autoencoder anomaly detector."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from features import FEATURE_COLUMNS, build_synthetic_kaggle_dataset, build_training_frame

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
except ImportError as exc:  # pragma: no cover
    raise SystemExit("TensorFlow is required. Install with: pip install tensorflow") from exc


def _set_seeds(seed: int) -> None:
    np.random.seed(seed)
    tf.random.set_seed(seed)


def build_cnn_classifier(input_dim: int) -> keras.Model:
    """1D-CNN architecture inspired by state-of-the-art tabular fraud detection research."""
    inputs = keras.Input(shape=(input_dim, 1), name="transaction_features")
    x = layers.Conv1D(32, 3, padding="same", activation="relu")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.25)(x)
    x = layers.Conv1D(64, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling1D(2)(x)
    x = layers.Dropout(0.35)(x)
    x = layers.Conv1D(64, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Flatten()(x)
    x = layers.Dense(100, activation="relu")(x)
    x = layers.Dropout(0.45)(x)
    x = layers.Dense(50, activation="relu")(x)
    x = layers.Dense(25, activation="relu")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="fraud_probability")(x)
    model = keras.Model(inputs=inputs, outputs=outputs, name="fraud_cnn")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=[
            keras.metrics.AUC(name="auc"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
        ],
    )
    return model


def build_autoencoder(input_dim: int) -> keras.Model:
    """Unsupervised autoencoder for anomaly scoring on legitimate traffic."""
    inputs = keras.Input(shape=(input_dim,), name="ae_input")
    encoded = layers.Dense(16, activation="tanh")(inputs)
    encoded = layers.Dense(8, activation="tanh")(encoded)
    encoded = layers.Dense(4, activation="tanh", name="bottleneck")(encoded)
    decoded = layers.Dense(8, activation="tanh")(encoded)
    decoded = layers.Dense(16, activation="tanh")(decoded)
    outputs = layers.Dense(input_dim, activation="tanh", name="reconstruction")(decoded)
    model = keras.Model(inputs=inputs, outputs=outputs, name="fraud_autoencoder")
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-3), loss="mse")
    return model


def _reshape_cnn(x: np.ndarray) -> np.ndarray:
    return x.reshape((x.shape[0], x.shape[1], 1))


def evaluate_probs(y_true: np.ndarray, probs: np.ndarray, threshold: float = 0.5) -> dict:
    preds = (probs >= threshold).astype(int)
    return {
        "average_precision": float(average_precision_score(y_true, probs)),
        "roc_auc": float(roc_auc_score(y_true, probs)),
        "recall": float(recall_score(y_true, preds, zero_division=0)),
        "precision": float(precision_score(y_true, preds, zero_division=0)),
        "f1": float(f1_score(y_true, preds, zero_division=0)),
    }


def train(dataset_path: Path | None, output_dir: Path, random_state: int = 42, epochs: int = 12) -> tuple[Path, Path, dict]:
    _set_seeds(random_state)
    if dataset_path and dataset_path.exists():
        raw = pd.read_csv(dataset_path)
    else:
        raw = build_synthetic_kaggle_dataset(seed=random_state)

    features_df, labels = build_training_frame(raw)
    if labels is None:
        raise ValueError("Training data must include Class labels.")

    x = features_df.values.astype(np.float32)
    y = labels.values.astype(np.float32)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    x_train_s = scaler.fit_transform(x_train)
    x_test_s = scaler.transform(x_test)

    neg, pos = np.bincount(y_train.astype(int))
    class_weight = {0: 1.0, 1: max(1.0, neg / max(pos, 1))}

    cnn = build_cnn_classifier(x_train_s.shape[1])
    callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=3, restore_best_weights=True),
    ]
    cnn.fit(
        _reshape_cnn(x_train_s),
        y_train,
        validation_split=0.15,
        epochs=epochs,
        batch_size=512,
        class_weight=class_weight,
        verbose=0,
        callbacks=callbacks,
    )

    cnn_probs = cnn.predict(_reshape_cnn(x_test_s), verbose=0).reshape(-1)
    cnn_metrics = evaluate_probs(y_test, cnn_probs)
    cnn_metrics["name"] = "cnn_classifier"

    legit_train = x_train_s[y_train == 0]
    ae = build_autoencoder(x_train_s.shape[1])
    ae.fit(
        legit_train,
        legit_train,
        validation_split=0.1,
        epochs=max(8, epochs - 2),
        batch_size=512,
        verbose=0,
        callbacks=[keras.callbacks.EarlyStopping(monitor="val_loss", patience=2, restore_best_weights=True)],
    )

    recon = ae.predict(x_test_s, verbose=0)
    mse = np.mean(np.square(x_test_s - recon), axis=1)
    legit_mse = mse[y_test == 0]
    threshold = float(np.percentile(legit_mse, 97) if len(legit_mse) else np.percentile(mse, 97))
    ae_probs = np.clip(mse / max(threshold, 1e-6), 0, 1)
    ae_metrics = evaluate_probs(y_test, ae_probs)
    ae_metrics["name"] = "autoencoder_anomaly"
    ae_metrics["reconstruction_threshold"] = threshold

    hybrid_probs = np.clip(0.75 * cnn_probs + 0.25 * ae_probs, 0, 1)
    hybrid_metrics = evaluate_probs(y_test, hybrid_probs)
    hybrid_metrics["name"] = "hybrid_cnn_ae"
    hybrid_metrics["fusion_weights"] = {"cnn": 0.75, "autoencoder": 0.25}

    output_dir.mkdir(parents=True, exist_ok=True)
    cnn_path = output_dir / "fraud_cnn.keras"
    ae_path = output_dir / "fraud_autoencoder.keras"
    scaler_path = output_dir / "feature_scaler.joblib"
    manifest_path = output_dir / "model_manifest.json"
    metrics_path = output_dir / "metrics.json"

    cnn.save(cnn_path)
    ae.save(ae_path)
    joblib.dump({"scaler": scaler, "feature_order": FEATURE_COLUMNS}, scaler_path)

    manifest = {
        "model_family": "deep_learning_hybrid",
        "architecture": {
            "classifier": "1d_cnn",
            "anomaly_detector": "dense_autoencoder",
            "fusion": "0.75*cnn + 0.25*ae_reconstruction",
        },
        "feature_count": len(FEATURE_COLUMNS),
        "feature_order": FEATURE_COLUMNS,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "framework": f"tensorflow-{tf.__version__}",
        "ae_reconstruction_threshold": threshold,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    payload = {
        "selected_model": hybrid_metrics["name"],
        "selection_strategy": "hybrid CNN + autoencoder fusion (production-style dual signal)",
        "model_type": "deep_learning",
        "results": sorted(
            [cnn_metrics, ae_metrics, hybrid_metrics],
            key=lambda r: r["average_precision"],
            reverse=True,
        ),
        "manifest": manifest,
    }
    metrics_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return cnn_path, metrics_path, payload


def main():
    parser = argparse.ArgumentParser(description="Train deep learning fraud detection models.")
    parser.add_argument("--dataset", help="Path to Kaggle creditcard.csv (optional; synthetic if omitted)")
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).resolve().parent / "artifacts"),
        help="Output directory for model artifacts",
    )
    parser.add_argument("--epochs", type=int, default=12, help="Training epochs for CNN")
    args = parser.parse_args()

    dataset = Path(args.dataset) if args.dataset else None
    cnn_path, metrics_path, payload = train(dataset, Path(args.output_dir), epochs=args.epochs)
    print(f"Saved CNN classifier: {cnn_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Selected model: {payload['selected_model']}")
    best = next(r for r in payload["results"] if r["name"] == payload["selected_model"])
    print(
        f"Hybrid PR-AUC={best['average_precision']:.4f} "
        f"ROC-AUC={best['roc_auc']:.4f} "
        f"Recall={best['recall']:.4f} "
        f"Precision={best['precision']:.4f}"
    )


if __name__ == "__main__":
    main()
