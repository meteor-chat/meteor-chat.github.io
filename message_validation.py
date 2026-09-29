from image_validation import valid_image
from limits import MAX_MESSAGE
from validation import valid_text


def validate_messages(messages: list[dict]) -> bool:
    if not isinstance(messages, list):
        return False
    for msg in messages:
        if not isinstance(msg, dict) or msg.get("role") not in ("user", "assistant"):
            return False
        content = msg.get("content")
        if isinstance(content, str):
            if not valid_text(content, 12000):
                return False
        elif isinstance(content, list):
            for part in content:
                if not isinstance(part, dict):
                    return False
                t = part.get("type")
                if t == "text":
                    if not valid_text(part.get("text", ""), MAX_MESSAGE):
                        return False
                elif t == "image_url":
                    url_obj = part.get("image_url")
                    if not isinstance(url_obj, dict):
                        return False
                    if not valid_image(url_obj.get("url", "")):
                        return False
                else:
                    return False
        else:
            return False
    return True
