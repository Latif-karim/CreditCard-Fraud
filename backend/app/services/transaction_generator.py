"""Synthetic transaction payloads for demo / simulator."""

import random
import secrets

LOCATIONS = [
    ("London", "UK"),
    ("New York", "US"),
    ("Lagos", "NG"),
    ("Berlin", "DE"),
    ("Accra", "GH"),
    ("Toronto", "CA"),
    ("Singapore", "SG"),
    ("Paris", "FR"),
    ("Dubai", "AE"),
    ("Sydney", "AU"),
]

MERCHANTS = [
    ("Amazon", "ecommerce"),
    ("Uber", "transport"),
    ("Netflix", "subscription"),
    ("Shell", "fuel"),
    ("Apple Store", "electronics"),
    ("Booking.com", "travel"),
    ("Starbucks", "food"),
    ("Binance", "crypto"),
    ("British Airways", "travel"),
    ("Steam", "gaming"),
]

NORMAL_MERCHANTS = [m for m in MERCHANTS if m[1] != "crypto"]

CARD_TYPES = ["visa", "mastercard", "amex", "discover"]

# Typical card-not-present fraud rate for demo dashboards (~2–5%).
REALISTIC_FLAGGED_RATE = 0.04


def home_for_user(user_id: int) -> tuple[str, str]:
    """Stable home city per user so behavior rules see consistent patterns."""
    return LOCATIONS[user_id % len(LOCATIONS)]


def _base_payload(user_id: int, location: str, country: str, merchant: str, category: str, amount: float) -> dict:
    return {
        "user_id": user_id,
        "amount": amount,
        "location": location,
        "country": country,
        "merchant": merchant,
        "merchant_category": category,
        "card_last4": f"{4240 + (user_id % 10)}{random.randint(10, 99)}"[-4:],
        "card_type": random.choice(CARD_TYPES),
        "ip_address": f"203.0.{random.randint(1, 254)}.{random.randint(1, 254)}",
        "device_id": f"dev-{secrets.token_hex(4)}",
    }


def normal_transaction_payload(user_id: int) -> dict:
    home, country = home_for_user(user_id)
    merchant, category = random.choice(NORMAL_MERCHANTS)
    amount = round(random.uniform(8.0, 185.0), 2)
    return _base_payload(user_id, home, country, merchant, category, amount)


def suspicious_transaction_payload(user_id: int) -> dict:
    """Deliberately risky pattern: foreign location and/or high amount."""
    home, home_country = home_for_user(user_id)
    pattern = random.choice(("foreign_high", "foreign_crypto", "home_spike"))
    if pattern == "foreign_high":
        foreign = random.choice([loc for loc in LOCATIONS if loc[0] != home])
        loc, country = foreign
        merchant, category = random.choice(MERCHANTS)
        amount = round(random.uniform(1200.0, 3800.0), 2)
    elif pattern == "foreign_crypto":
        foreign = random.choice([loc for loc in LOCATIONS if loc[0] != home])
        loc, country = foreign
        merchant, category = ("Binance", "crypto")
        amount = round(random.uniform(450.0, 2200.0), 2)
    else:
        loc, country = home, home_country
        merchant, category = random.choice(MERCHANTS)
        amount = round(random.uniform(900.0, 3200.0), 2)
    return _base_payload(user_id, loc, country, merchant, category, amount)


def random_transaction_payload(user_id: int) -> dict:
    """Live simulator: mostly normal day-to-day spend at the user's home city."""
    if random.random() < REALISTIC_FLAGGED_RATE:
        return suspicious_transaction_payload(user_id)
    return normal_transaction_payload(user_id)
