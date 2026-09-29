import re


def valid_text(value: str, limit: int) -> bool:
    if not isinstance(value, str) or len(value) == 0 or len(value) > limit:
        return False
    if not value.strip():
        return False
    return not any(0xD800 <= ord(char) <= 0xDFFF for char in value)


def valid_client_time(value: str) -> bool:
    if not isinstance(value, str) or len(value) > 64:
        return False
    return bool(re.match(r"^[\w\s,.:\-]+$", value))
