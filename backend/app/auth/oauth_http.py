"""HTTP helpers for OAuth (SSL / certifi on Windows)."""

from __future__ import annotations

import os

import certifi
from flask import Flask


def apply_oauth_ssl_env() -> None:
    bundle = certifi.where()
    os.environ.setdefault("SSL_CERT_FILE", bundle)
    os.environ.setdefault("REQUESTS_CA_BUNDLE", bundle)


def ssl_verify_enabled(app: Flask | None = None) -> bool:
    if app is not None:
        val = app.config.get("OAUTH_SSL_VERIFY", True)
        if isinstance(val, str):
            return val.lower() not in ("0", "false", "no")
        return bool(val)
    return os.getenv("OAUTH_SSL_VERIFY", "true").lower() not in ("0", "false", "no")


def requests_verify(app: Flask | None = None) -> bool | str:
    apply_oauth_ssl_env()
    return certifi.where() if ssl_verify_enabled(app) else False
