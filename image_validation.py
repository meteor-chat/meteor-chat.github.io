import base64


def valid_image(value: str) -> bool:
    if not isinstance(value, str):
        return False
    if not value.startswith(
        ("data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,")
    ):
        return False
    try:
        _header, b64_data = value.split(",", 1)
        data = base64.b64decode(b64_data)
        if len(data) > 2 * 1024 * 1024:
            return False
    except Exception as _exc:
        return False
    return True
