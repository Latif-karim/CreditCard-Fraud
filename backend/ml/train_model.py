from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.under_sampling import RandomUnderSampler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    working = df.copy()
    if "Time" not in working.columns or "Amount" not in working.columns or "Class" not in working.columns:
        raise ValueError("Dataset must contain Time, Amount, and Class columns.")

    working = working.sort_values("Time").reset_index(drop=True)
    working["minutes_since_last"] = working["Time"].diff().fillna(9999) / 60.0
    working["tx_frequency_10m"] = (
        working["Time"].rolling(window=30, min_periods=1).count().clip(upper=30) / 3
    )
    return working[["Amount", "tx_frequency_10m", "minutes_since_last", "Class"]]


def build_pipelines(random_state: int):
    base_model = LogisticRegression(max_iter=400, class_weight="balanced", random_state=random_state)
    rf_model = RandomForestClassifier(
        n_estimators=240,
        max_depth=12,
        class_weight="balanced_subsample",
        random_state=random_state,
    )
    return {
        "logreg_baseline": ImbPipeline([("scale", StandardScaler()), ("model", base_model)]),
        "logreg_smote": ImbPipeline(
            [("smote", SMOTE(random_state=random_state)), ("scale", StandardScaler()), ("model", base_model)]
        ),
        "logreg_undersample": ImbPipeline(
            [("undersample", RandomUnderSampler(random_state=random_state)), ("scale", StandardScaler()), ("model", base_model)]
        ),
        "rf_smote": ImbPipeline([("smote", SMOTE(random_state=random_state)), ("model", rf_model)]),
    }


def evaluate_pipeline(name, pipeline, x_train, y_train, x_test, y_test):
    pipeline.fit(x_train, y_train)
    probs = pipeline.predict_proba(x_test)[:, 1]
    preds = (probs >= 0.5).astype(int)
    return {
        "name": name,
        "average_precision": float(average_precision_score(y_test, probs)),
        "recall": float(recall_score(y_test, preds, zero_division=0)),
        "precision": float(precision_score(y_test, preds, zero_division=0)),
        "f1": float(f1_score(y_test, preds, zero_division=0)),
        "pipeline": pipeline,
    }


def train(dataset_path: Path, output_dir: Path, random_state: int = 42):
    raw = pd.read_csv(dataset_path)
    features_df = build_features(raw)
    x = features_df[["Amount", "tx_frequency_10m", "minutes_since_last"]]
    y = features_df["Class"]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, random_state=random_state, stratify=y
    )

    results = []
    for name, pipeline in build_pipelines(random_state).items():
        results.append(evaluate_pipeline(name, pipeline, x_train, y_train, x_test, y_test))

    # Prioritize fraud recall, then PR-AUC.
    best = sorted(results, key=lambda r: (r["recall"], r["average_precision"]), reverse=True)[0]

    output_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = output_dir / "fraud_model.joblib"
    metrics_path = output_dir / "metrics.json"

    joblib.dump(
        {"model": best["pipeline"], "feature_order": ["Amount", "tx_frequency_10m", "minutes_since_last"]},
        artifact_path,
    )

    serializable_results = [
        {k: v for k, v in result.items() if k != "pipeline"}
        for result in sorted(results, key=lambda r: r["average_precision"], reverse=True)
    ]
    payload = {
        "selected_model": best["name"],
        "selection_strategy": "highest recall, tie-break by average_precision",
        "results": serializable_results,
    }
    metrics_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return artifact_path, metrics_path, payload


def main():
    parser = argparse.ArgumentParser(description="Train fraud model with imbalance experiments.")
    parser.add_argument("--dataset", required=True, help="Path to Kaggle creditcard.csv")
    parser.add_argument(
        "--output-dir", default=str(Path(__file__).resolve().parent / "artifacts"), help="Output directory"
    )
    args = parser.parse_args()

    artifact_path, metrics_path, payload = train(Path(args.dataset), Path(args.output_dir))
    print(f"Saved model artifact: {artifact_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Selected model: {payload['selected_model']}")


if __name__ == "__main__":
    main()
