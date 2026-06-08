import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Always load backend/.env even when Flask is started from the repo root
_BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_DIR / ".env")
load_dotenv()  # optional override from cwd

# Windows/Python 3.13: use certifi CA bundle for outbound HTTPS (OAuth, etc.)
try:
    import certifi

    _ca = certifi.where()
    os.environ.setdefault("SSL_CERT_FILE", _ca)
    os.environ.setdefault("REQUESTS_CA_BUNDLE", _ca)
except Exception:
    pass


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return "sqlite:///fraud_detection.db"
    # Some managed Postgres providers still display the legacy postgres:// scheme.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ["headers", "query_string"]
    JWT_QUERY_STRING_NAME = "token"
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    AUTO_SEED_DEMO_DATA = os.getenv(
        "AUTO_SEED_DEMO_DATA",
        "true" if SQLALCHEMY_DATABASE_URI.startswith("sqlite") else "false",
    ).lower() in ("1", "true", "yes")
    CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() in ("1", "true", "yes")
    CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "30"))
    ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "alerts@example.com")

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://127.0.0.1:5000/auth")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")

    # Set to false only for local dev if SSL still fails after: pip install certifi
    OAUTH_SSL_VERIFY = os.getenv("OAUTH_SSL_VERIFY", "true").lower() not in (
        "0",
        "false",
        "no",
    )
