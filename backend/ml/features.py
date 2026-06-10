"""Feature engineering for deep learning fraud models (Kaggle + live scoring)."""

from __future__ import annotations

import hashlib
import math
from typing import Iterable

import numpy as np
import pandas as pd

PCA_COLUMNS = [f"V{i}" for i in range(1, 29)]
DERIVED_COLUMNS = [
    "Amount_log",
    "tx_frequency_10m",
    "minutes_since_last",
]
FEATURE_COLUMNS = PCA_COLUMNS + DERIVED_COLUMNS

# High-risk merchant categories (Visa/Mastercard MCC-inspired risk tiers).
MCC_RISK = {
    "gambling": 0.92,
    "crypto": 0.88,
    "money_transfer": 0.85,
    "electronics": 0.55,
    "travel": 0.48,
    "grocery": 0.12,
    "fuel": 0.35,
    "restaurant": 0.28,
    "retail": 0.22,
    "online": 0.42,
    "default": 0.38,
}

HIGH_RISK_COUNTRIES = {
    "nigeria",
    "romania",
    "russia",
    "ukraine",
    "indonesia",
    "pakistan",
    "brazil",
    "china",
}


def _mcc_risk(category: str | None) -> float:
    if not category:
        return MCC_RISK["default"]
    key = category.strip().lower().replace(" ", "_")
    return MCC_RISK.get(key, MCC_RISK["default"])


def _geo_risk(country: str | None, location: str | None) -> float:
    blob = f"{country or ''} {location or ''}".lower()
    if any(c in blob for c in HIGH_RISK_COUNTRIES):
        return 0.82
    if "foreign" in blob or "intl" in blob:
        return 0.65
    return 0.18


def _hash_signal(*parts: str) -> float:
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).digest()
    return (int.from_bytes(digest[:4], "big") / 2**32) * 2 - 1


def amount_log(amount: float) -> float:
    return float(math.log1p(max(0.0, amount)))


def build_training_frame(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series | None]:
    """Prepare Kaggle creditcard.csv (or synthetic equivalent) for DL training."""
    working = df.copy()
    missing_pca = [c for c in PCA_COLUMNS if c not in working.columns]
    if missing_pca:
        raise ValueError(f"Dataset missing PCA columns: {missing_pca[:3]}...")

    if "Time" in working.columns:
        working = working.sort_values("Time").reset_index(drop=True)
        working["minutes_since_last"] = working["Time"].diff().fillna(9999) / 60.0
        working["tx_frequency_10m"] = (
            working["Time"].rolling(window=30, min_periods=1).count().clip(upper=30) / 3.0
        )
    else:
        working["minutes_since_last"] = 9999.0
        working["tx_frequency_10m"] = 0.0

    working["Amount_log"] = working["Amount"].map(amount_log)
    labels = working["Class"] if "Class" in working.columns else None
    return working[FEATURE_COLUMNS], labels


def build_live_vector(
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
) -> np.ndarray:
    """Map real-time transaction metadata to a 31-dim vector aligned with offline PCA features."""
    amt_log = amount_log(amount)
    mcc = _mcc_risk(merchant_category)
    geo = _geo_risk(country, location)
    device_novel = 1.0 if device_id and len(device_id) > 4 else 0.35
    ip_risk = 0.7 if ip_address and ip_address.startswith("10.") is False else 0.2

    seeds = [
        amt_log,
        float(tx_frequency_10m),
        float(minutes_since_last),
        mcc,
        geo,
        float(amount_vs_avg),
        float(location_novel),
        device_novel,
        ip_risk,
        _hash_signal(merchant or "unknown", merchant_category or "default"),
        _hash_signal(location or "unknown", country or "unknown"),
    ]

    pca_proxy: list[float] = []
    for i in range(28):
        base = seeds[i % len(seeds)]
        wave = math.sin((i + 1) * 0.41 + amt_log * 0.17)
        interaction = (mcc - 0.5) * geo * (1.0 + min(tx_frequency_10m, 8) * 0.08)
        pca_proxy.append(float(np.clip(base * 0.55 + wave * 0.25 + interaction * 0.35, -5, 5)))

    row = pca_proxy + [amt_log, float(tx_frequency_10m), float(minutes_since_last)]
    return np.asarray(row, dtype=np.float32)


def build_synthetic_kaggle_dataset(n_rows: int = 50000, fraud_rate: float = 0.00172, seed: int = 42) -> pd.DataFrame:
    """Synthetic European-style dataset with PCA features for bootstrap training."""
    rng = np.random.default_rng(seed)
    n_fraud = max(20, int(n_rows * fraud_rate))
    n_legit = n_rows - n_fraud

    def _block(n: int, fraud: bool) -> pd.DataFrame:
        rows = {}
        for i in range(1, 29):
            mean = rng.normal(0.15 if fraud else 0.0, 0.35 if fraud else 1.0)
            std = rng.uniform(0.6, 1.4) if fraud else 1.0
            rows[f"V{i}"] = rng.normal(mean, std, n)
        time = np.sort(rng.uniform(0, 48 * 3600, n))
        amount = (
            rng.lognormal(mean=5.2, sigma=1.0, size=n).clip(50, 25000)
            if fraud
            else rng.lognormal(mean=3.2, sigma=0.9, size=n).clip(1, 8000)
        )
        rows["Time"] = time
        rows["Amount"] = amount
        rows["Class"] = np.ones(n, dtype=int) if fraud else np.zeros(n, dtype=int)
        return pd.DataFrame(rows)

    legit = _block(n_legit, fraud=False)
    fraud = _block(n_fraud, fraud=True)
    combined = pd.concat([legit, fraud], ignore_index=True)
    return combined.sample(frac=1.0, random_state=seed).reset_index(drop=True)


def feature_labels() -> list[str]:
    return list(FEATURE_COLUMNS)
