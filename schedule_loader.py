from pathlib import Path


def load_schedule() -> str:
    path = Path(__file__).parent / "jadwal-kuliah.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


schedule_data = load_schedule()
