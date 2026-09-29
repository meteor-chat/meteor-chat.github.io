import math
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime


def calculate_retry_delay(headers: dict, status: int) -> float:
    value = headers.get("Retry-After", "")
    fallback = 3600 if status in (401, 402, 403) else 60
    try:
        delay = float(value)
    except (ValueError, TypeError):
        try:
            delay = (parsedate_to_datetime(value) - datetime.now(timezone.utc)).total_seconds()
        except (ValueError, TypeError, OverflowError):
            delay = fallback
    return min(86400, max(1, delay)) if math.isfinite(delay) else fallback
