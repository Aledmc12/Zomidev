"""
ZomiDev Backend — Cliente Redis
"""
import logging
import time
from collections import defaultdict
from typing import Optional, Tuple

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

_redis: Optional[redis.Redis] = None
_memory_buckets: dict[str, tuple[int, float]] = defaultdict(lambda: (0, 0.0))


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


def _memory_rate_limit(key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
    now = time.time()
    count, expires = _memory_buckets[key]
    if expires <= now:
        count = 0
        expires = now + window_seconds
    count += 1
    _memory_buckets[key] = (count, expires)
    remaining = max(0, limit - count)
    return count <= limit, remaining


async def check_rate_limit(
    key: str,
    limit: int = 10,
    window_seconds: int = 900,
    prefix: str = "rl",
    *,
    fail_closed: bool = False,
) -> Tuple[bool, int]:
    redis_key = f"{prefix}:{key}"
    try:
        client = await get_redis()
        current = await client.incr(redis_key)
        if current == 1:
            await client.expire(redis_key, window_seconds)
        remaining = max(0, limit - current)
        return current <= limit, remaining
    except Exception as e:
        logger.warning(f"Rate limit Redis no disponible: {e}")
        if fail_closed:
            allowed, remaining = _memory_rate_limit(redis_key, limit, window_seconds)
            return allowed, remaining
        return True, limit


async def store_refresh_token(jti: str, user_id: str, ttl_seconds: int) -> None:
    try:
        client = await get_redis()
        await client.setex(f"refresh:{jti}", ttl_seconds, user_id)
    except Exception as e:
        logger.warning(f"No se pudo almacenar refresh token: {e}")


async def is_refresh_token_valid(jti: str) -> bool:
    try:
        client = await get_redis()
        return await client.exists(f"refresh:{jti}") == 1
    except Exception as e:
        logger.warning(f"No se pudo validar refresh token: {e}")
        return False


async def revoke_refresh_token(jti: str) -> None:
    try:
        client = await get_redis()
        await client.delete(f"refresh:{jti}")
    except Exception as e:
        logger.warning(f"No se pudo revocar refresh token: {e}")


async def revoke_all_user_tokens(user_id: str) -> None:
    try:
        client = await get_redis()
        pattern = f"refresh:*"
        async for key in client.scan_iter(match=pattern):
            val = await client.get(key)
            if val == user_id:
                await client.delete(key)
    except Exception as e:
        logger.warning(f"No se pudo revocar tokens del usuario: {e}")


async def store_password_reset_token(token: str, user_id: str, ttl_seconds: int) -> None:
    try:
        client = await get_redis()
        await client.setex(f"reset:{token}", ttl_seconds, user_id)
    except Exception as e:
        logger.warning(f"No se pudo almacenar token de reset: {e}")


async def consume_password_reset_token(token: str) -> Optional[str]:
    try:
        client = await get_redis()
        key = f"reset:{token}"
        user_id = await client.get(key)
        if user_id:
            await client.delete(key)
            return user_id
    except Exception as e:
        logger.warning(f"No se pudo consumir token de reset: {e}")
    return None
