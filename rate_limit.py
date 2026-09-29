import math
import threading
import time
from collections import deque

from errors import ChatError
from limits import GLOBAL_CONCURRENCY, LOCAL_REQUEST_LIMIT

chat_semaphore = threading.Semaphore(GLOBAL_CONCURRENCY)


class RateLimiter:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.user_requests: dict[str, deque] = {}

    def check_limit(self, session_id: str) -> None:
        with self.lock:
            now = time.monotonic()
            if session_id not in self.user_requests:
                self.user_requests[session_id] = deque()
            reqs = self.user_requests[session_id]
            while reqs and now - reqs[0] >= 60:
                reqs.popleft()
            if len(reqs) >= LOCAL_REQUEST_LIMIT:
                retry_after = max(1, math.ceil(60 - (now - reqs[0])))
                raise ChatError(
                    "Batas 20 pesan per menit tercapai. Coba lagi sebentar.", 429, retry_after
                )

    def record_success(self, session_id: str) -> None:
        with self.lock:
            self.user_requests[session_id].append(time.monotonic())


rate_limiter = RateLimiter()
