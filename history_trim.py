from limits import MAX_CONTEXT, MAX_HISTORY


def calculate_context_length(history: list[dict]) -> int:
    length = 0
    for item in history:
        content = item.get("content")
        if isinstance(content, str):
            length += len(content)
        elif isinstance(content, list):
            for part in content:
                if part.get("type") == "text":
                    length += len(part.get("text", ""))
                elif part.get("type") == "image_url":
                    length += 1000
    return length


def trim_history(history: list[dict], extra_length: int = 0) -> list[dict]:
    history = history[-MAX_HISTORY:]
    while history and calculate_context_length(history) + extra_length > MAX_CONTEXT:
        history = history[2:]
    return history
