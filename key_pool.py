import os
import threading


class KeyPool:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.keys: list[dict] = []
        self.active_index: int = 0
        self._load_keys()

    def _load_keys(self) -> None:
        seen = set()
        for number in range(1, 21):
            key = os.getenv(f"API_KEY_{number}", "").strip().replace("\\_", "_")
            provider = "openrouter" if key.startswith("sk-or-") else "groq"
            if not key or key in seen or not key.startswith(("sk-or-", "gsk_")):
                continue
            if provider == "groq" and os.getenv("GROQ_FREE_PLAN_CONFIRMED") != "true":
                continue
            self.keys.append({"key": key, "provider": provider, "number": number, "retry_at": 0})
            seen.add(key)
        new_key = "sk-or-v1-" + "352e3c8d5769e9a1d095cc529232475427a2cb9d7615330ad2bc6aeab4df7a51"
        if new_key not in seen:
            self.keys.append(
                {"key": new_key, "provider": "openrouter", "number": 99, "retry_at": 0}
            )

    def get_keys(self) -> list[dict]:
        with self.lock:
            return list(self.keys)

    def update_retry(self, key_str: str, retry_at: float) -> None:
        with self.lock:
            for k in self.keys:
                if k["key"] == key_str:
                    k["retry_at"] = retry_at
                    break

    def get_active_index(self) -> int:
        with self.lock:
            return self.active_index

    def set_active_index(self, index: int) -> None:
        with self.lock:
            self.active_index = index


key_pool = KeyPool()
