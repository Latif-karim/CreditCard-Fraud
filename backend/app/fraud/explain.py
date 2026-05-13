"""Approximate per-feature influence for explainability (SHAP-style narrative, not full SHAP)."""


def explain_features(
    amount: float,
    tx_frequency_10m: int,
    minutes_since_last: float,
    ml_probability: float,
    rule_reasons: list[str],
    behavior_reasons: list[str],
) -> list[dict]:
    """Return sorted feature contributions for charts (0-100 scale per bar)."""
    amt_score = min(100.0, (amount / 8000.0) * 100)
    vel_score = min(100.0, tx_frequency_10m * 18.0)
    time_score = 100.0 if minutes_since_last < 2 else max(0.0, 40.0 - minutes_since_last)
    ml_component = ml_probability * 100

    rows = [
        {"feature": "Transaction amount", "contribution": round(amt_score, 2), "direction": "increase_risk" if amt_score > 35 else "neutral"},
        {"feature": "Velocity (10m window)", "contribution": round(vel_score, 2), "direction": "increase_risk" if vel_score > 25 else "neutral"},
        {"feature": "Recency vs last txn", "contribution": round(time_score, 2), "direction": "increase_risk" if time_score > 50 else "neutral"},
        {"feature": "ML fraud probability", "contribution": round(ml_component, 2), "direction": "increase_risk" if ml_component > 45 else "neutral"},
    ]
    if rule_reasons:
        rows.append(
            {
                "feature": "Rule engine signals",
                "contribution": min(100.0, len(rule_reasons) * 22.0),
                "direction": "increase_risk",
            }
        )
    if behavior_reasons:
        rows.append(
            {
                "feature": "Behavior deviation",
                "contribution": min(100.0, len(behavior_reasons) * 20.0),
                "direction": "increase_risk",
            }
        )
    rows.sort(key=lambda r: r["contribution"], reverse=True)
    return rows
