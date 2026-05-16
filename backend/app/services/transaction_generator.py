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

CARD_TYPES = ["visa", "mastercard", "amex", "discover"]


def random_transaction_payload(user_id: int) -> dict:
    loc, country = random.choice(LOCATIONS)
    merchant, category = random.choice(MERCHANTS)
    # Skew amounts: mostly normal, occasional spikes (fraud-like)
    if random.random() < 0.12:
        amount = round(random.uniform(800, 4500), 2)
    else:
        amount = round(random.uniform(4.5, 420), 2)

    return {
        "user_id": user_id,
        "amount": amount,
        "location": loc,
        "country": country,
        "merchant": merchant,
        "merchant_category": category,
        "card_last4": f"{random.randint(1000, 9999)}",
        "card_type": random.choice(CARD_TYPES),
        "ip_address": f"203.0.{random.randint(1, 254)}.{random.randint(1, 254)}",
        "device_id": f"dev-{secrets.token_hex(4)}",
    }
