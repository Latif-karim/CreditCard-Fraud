"""Explainability for hybrid deep learning fraud scoring."""


def explain_features(
    *,
    amount: float,
    tx_frequency_10m: float,
    minutes_since_last: float,
    ml_probability: float,
    cnn_probability: float,
    autoencoder_score: float,
    rule_reasons: list[str],
    behavior_reasons: list[str],
    merchant_category: str = "",
    location_novel: bool = False,
) -> list[dict]:
    """Return sorted feature contributions for analyst review (0–100 scale)."""
    amt_score = min(100.0, (amount / 8000.0) * 100)
    vel_score = min(100.0, tx_frequency_10m * 18.0)
    time_score = 100.0 if minutes_since_last < 2 else max(0.0, 40.0 - minutes_since_last)
    cnn_component = cnn_probability * 100
    ae_component = autoencoder_score * 100
    hybrid_component = ml_probability * 100
    mcc_score = 72.0 if merchant_category.lower() in {"gambling", "crypto", "money_transfer"} else 18.0
    geo_score = 68.0 if location_novel else 12.0

    rows = [
        {
            "feature": "CNN fraud probability",
            "contribution": round(cnn_component, 2),
            "direction": "increase_risk" if cnn_component > 45 else "neutral",
            "source": "deep_learning",
        },
        {
            "feature": "Autoencoder anomaly score",
            "contribution": round(ae_component, 2),
            "direction": "increase_risk" if ae_component > 45 else "neutral",
            "source": "deep_learning",
        },
        {
            "feature": "Hybrid DL ensemble",
            "contribution": round(hybrid_component, 2),
            "direction": "increase_risk" if hybrid_component > 45 else "neutral",
            "source": "deep_learning",
        },
        {
            "feature": "Transaction amount",
            "contribution": round(amt_score, 2),
            "direction": "increase_risk" if amt_score > 35 else "neutral",
            "source": "transaction",
        },
        {
            "feature": "Velocity (10m window)",
            "contribution": round(vel_score, 2),
            "direction": "increase_risk" if vel_score > 25 else "neutral",
            "source": "velocity",
        },
        {
            "feature": "Recency vs last txn",
            "contribution": round(time_score, 2),
            "direction": "increase_risk" if time_score > 50 else "neutral",
            "source": "velocity",
        },
        {
            "feature": "Merchant category risk",
            "contribution": round(mcc_score, 2),
            "direction": "increase_risk" if mcc_score > 40 else "neutral",
            "source": "merchant",
        },
        {
            "feature": "Geographic deviation",
            "contribution": round(geo_score, 2),
            "direction": "increase_risk" if geo_score > 40 else "neutral",
            "source": "geo",
        },
    ]
    if rule_reasons:
        rows.append(
            {
                "feature": "Rule engine signals",
                "contribution": min(100.0, len(rule_reasons) * 22.0),
                "direction": "increase_risk",
                "source": "rules",
            }
        )
    if behavior_reasons:
        rows.append(
            {
                "feature": "Behavior deviation",
                "contribution": min(100.0, len(behavior_reasons) * 20.0),
                "direction": "increase_risk",
                "source": "behavior",
            }
        )
    rows.sort(key=lambda r: r["contribution"], reverse=True)
    return rows
