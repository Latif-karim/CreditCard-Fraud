"""Background transaction stream (one synthetic tx every N seconds)."""

from __future__ import annotations

import random
import threading
import time
from datetime import datetime
from typing import TYPE_CHECKING

from .seed_data import ensure_demo_users, seed_all
from .transaction_generator import random_transaction_payload
from .transaction_ingest import ingest_transaction_data

if TYPE_CHECKING:
    from flask import Flask

_lock = threading.Lock()
_running = False
_thread: threading.Thread | None = None
_interval_sec = 30
_last_tick_at: str | None = None
_last_error: str | None = None
_ticks = 0


def simulator_status() -> dict:
    with _lock:
        return {
            "running": _running,
            "interval_seconds": _interval_sec,
            "ticks": _ticks,
            "last_tick_at": _last_tick_at,
            "last_error": _last_error,
        }


def _run_one_tick(app: Flask) -> None:
    """Generate one transaction inside app context; updates status globals."""
    global _last_tick_at, _last_error, _ticks
    with app.app_context():
        user_ids = ensure_demo_users()
        if not user_ids:
            seed_all(min_transactions=20)
            user_ids = ensure_demo_users()
        if not user_ids:
            raise RuntimeError("No users available for synthetic transactions")
        uid = random.choice(user_ids)
        payload = random_transaction_payload(uid)
        ingest_transaction_data(payload, actor_user_id=None)
        with _lock:
            _last_tick_at = datetime.utcnow().isoformat() + "Z"
            _last_error = None
            _ticks += 1


def _loop(app: Flask) -> None:
    global _running
    while True:
        with _lock:
            if not _running:
                break
            interval = _interval_sec
        try:
            _run_one_tick(app)
        except Exception as exc:
            with _lock:
                _last_error = str(exc)
        time.sleep(interval)
        with _lock:
            if not _running:
                break


def start_simulator(app: Flask, interval_seconds: int = 30) -> dict:
    global _running, _thread, _interval_sec
    with _lock:
        _interval_sec = max(5, min(120, int(interval_seconds)))
        if _running:
            return simulator_status()
        _running = True
        _thread = threading.Thread(target=_loop, args=(app,), daemon=True, name="tx-simulator")
        _thread.start()
    # First event immediately (do not wait 30s)
    try:
        _run_one_tick(app)
    except Exception as exc:
        with _lock:
            _last_error = str(exc)
    return simulator_status()


def stop_simulator() -> dict:
    global _running
    with _lock:
        _running = False
    return simulator_status()


def tick_once(app: Flask) -> dict:
    """Generate a single synthetic transaction immediately."""
    try:
        _run_one_tick(app)
        result = {"ok": True, "simulator": simulator_status()}
        return result
    except Exception as exc:
        with _lock:
            _last_error = str(exc)
        raise
