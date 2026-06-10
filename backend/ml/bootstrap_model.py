"""
Bootstrap deep learning fraud models when Kaggle creditcard.csv is unavailable.

Generates a synthetic European-style dataset (V1–V28 + Amount + Class), trains
CNN + autoencoder hybrid models, and writes artifacts to ml/artifacts/.

For research/production, replace with real data:
  python ml/train_model.py --dataset path/to/creditcard.csv
"""

from __future__ import annotations

import sys
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ML_DIR))

from train_model import train  # noqa: E402


def main() -> None:
    output_dir = ML_DIR / "artifacts"
    cnn_path, metrics_path, payload = train(dataset_path=None, output_dir=output_dir, epochs=10)
    print(f"Saved CNN classifier: {cnn_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Selected model: {payload['selected_model']}")
    best = next(r for r in payload["results"] if r["name"] == payload["selected_model"])
    print(f"PR-AUC={best['average_precision']:.4f} ROC-AUC={best['roc_auc']:.4f}")


if __name__ == "__main__":
    main()
