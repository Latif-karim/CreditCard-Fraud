"""In-process pub/sub for Server-Sent Events (live transaction stream)."""

from __future__ import annotations

import json
import queue
import threading
from dataclasses import dataclass
from typing import Any

_lock = threading.Lock()
_subscribers: list[Subscriber] = []


@dataclass
class Subscriber:
    queue: queue.Queue[str]
    user_id: int
    role: str


def subscribe(*, user_id: int, role: str) -> Subscriber:
    sub = Subscriber(queue=queue.Queue(maxsize=100), user_id=user_id, role=role)
    with _lock:
        _subscribers.append(sub)
    return sub


def unsubscribe(sub: Subscriber) -> None:
    with _lock:
        try:
            _subscribers.remove(sub)
        except ValueError:
            pass


def _can_receive(sub: Subscriber, owner_user_id: int) -> bool:
    if sub.role in ("admin", "analyst"):
        return True
    return sub.user_id == owner_user_id


def publish(event: dict[str, Any], *, owner_user_id: int) -> None:
    payload = json.dumps(event, default=str)
    dead: list[Subscriber] = []
    with _lock:
        for sub in _subscribers:
            if not _can_receive(sub, owner_user_id):
                continue
            try:
                sub.queue.put_nowait(payload)
            except queue.Full:
                dead.append(sub)
        for sub in dead:
            try:
                _subscribers.remove(sub)
            except ValueError:
                pass
