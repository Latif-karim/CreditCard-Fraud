"""
Bootstrap a fraud model when Kaggle creditcard.csv is not available.

Generates synthetic transaction-like data with class imbalance, trains the same
pipelines as train_model.py, and writes ml/artifacts/fraud_model.joblib + metrics.json.

For production/research use, replace with real data:
  python ml/train_model.py --dataset path/to/creditcard.csv
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

ML_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ML_DIR))

from train_model import train  # noqa: E402


def build_synthetic_dataset(n_rows: int = 12000, fraud_rate: float = 0.005, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n_fraud = max(1, int(n_rows * fraud_rate))
    n_legit = n_rows - n_fraud

    time_legit = np.sort(rng.uniform(0, 48 * 3600, n_legit))
    amount_legit = rng.lognormal(mean=3.2, sigma=0.9, size=n_legit).clip(1, 8000)

    time_fraud = np.sort(rng.uniform(0, 48 * 3600, n_fraud))
    amount_fraud = rng.lognormal(mean=5.0, sigma=1.1, size=n_fraud).clip(50, 25000)

    time = np.concatenate([time_legit, time_fraud])
    amount = np.concatenate([amount_legit, amount_fraud])
    labels = np.concatenate([np.zeros(n_legit), np.ones(n_fraud)])

    order = rng.permutation(n_rows)
    return pd.DataFrame({"Time": time[order], "Amount": amount[order], "Class": labels[order].astype(int)})


def main() -> None:
    output_dir = ML_DIR / "artifacts"
    csv_path = output_dir / "synthetic_creditcard.csv"
    df = build_synthetic_dataset()
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(csv_path, index=False)

    artifact_path, metrics_path, payload = train(csv_path, output_dir)
    print(f"Synthetic rows: {len(df)} (fraud rate ~{(df['Class'].mean() * 100):.2f}%)")
    print(f"Saved model artifact: {artifact_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Selected model: {payload['selected_model']}")


if __name__ == "__main__":
    main()
