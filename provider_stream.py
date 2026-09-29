import json
import time


def stream_response(response, deadline):
    for line in response.iter_lines():
        if time.monotonic() >= deadline:
            break
        if line:
            decoded = line.decode("utf-8").strip()
            if decoded.startswith("data: "):
                data = decoded[6:]
                if data == "[DONE]":
                    break
                try:
                    parsed = json.loads(data)
                    delta = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if delta:
                        yield delta
                except json.JSONDecodeError:
                    pass
