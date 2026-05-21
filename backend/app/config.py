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


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///fraud_detection.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
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
