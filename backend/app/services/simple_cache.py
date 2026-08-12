import time
from datetime import datetime

_CACHE: dict[str, tuple[float, object]] = {}


def get_cache(key: str):
    record = _CACHE.get(key)
    if not record:
        return None
    expires_at, value = record
    if expires_at and time.time() >= expires_at:
        _CACHE.pop(key, None)
        return None
    return value


def set_cache(key: str, value, ttl_seconds: float | None = None):
    expires_at = time.time() + ttl_seconds if ttl_seconds else 0.0
    _CACHE[key] = (expires_at, value)
    return value


def set_cache_until(key: str, value, expires_at: datetime | None):
    expires_ts = expires_at.timestamp() if expires_at else 0.0
    _CACHE[key] = (expires_ts, value)
    return value


def invalidate_cache(key: str):
    _CACHE.pop(key, None)
