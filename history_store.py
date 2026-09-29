import threading
import time


class HistoryStore:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.sessions: dict[str, dict[str, object]] = {}

    def get_history(self, session_id: str) -> list[dict]:
        with self.lock:
            if session_id not in self.sessions:
                return []
            self.sessions[session_id]["updated_at"] = time.monotonic()
            return self.sessions[session_id]["history"]

    def save_history(self, session_id: str, history: list[dict]) -> None:
        with self.lock:
            self.sessions[session_id] = {"history": history, "updated_at": time.monotonic()}

    def cleanup(self) -> None:
        with self.lock:
            now = time.monotonic()
            expired = [
                sid for sid, data in self.sessions.items() if now - data["updated_at"] > 3600
            ]
            for sid in expired:
                del self.sessions[sid]


history_store = HistoryStore()
