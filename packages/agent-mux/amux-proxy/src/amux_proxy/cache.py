from __future__ import annotations
import hashlib
import json
from typing import Any


class ResponseCache:
    def __init__(self, max_size: int = 1000) -> None:
        self._cache: dict[str, Any] = {}
        self._max_size = max_size

    def _key(self, model: str, messages: list[dict]) -> str:
        raw = json.dumps({"model": model, "messages": messages}, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, model: str, messages: list[dict]) -> Any | None:
        return self._cache.get(self._key(model, messages))

    def set(self, model: str, messages: list[dict], response: Any) -> None:
        if len(self._cache) >= self._max_size:
            oldest = next(iter(self._cache))
            del self._cache[oldest]
        self._cache[self._key(model, messages)] = response

    @property
    def size(self) -> int:
        return len(self._cache)
