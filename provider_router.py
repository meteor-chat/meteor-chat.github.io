import json
import time

from config import PROVIDERS
from errors import ChatError
from key_pool import key_pool
from limits import REQUEST_BUDGET
from provider_client import http_session
from retry_policy import calculate_retry_delay
from provider_stream import stream_response


def call_providers_stream(messages: list[dict]):
    keys = key_pool.get_keys()
    if not keys:
        raise ChatError("Belum ada API key aktif. Periksa konfigurasi.")

    start = key_pool.get_active_index()
    deadline = time.monotonic() + REQUEST_BUDGET

    for offset in range(len(keys)):
        index = (start + offset) % len(keys)
        account = keys[index]
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        if account["retry_at"] > time.monotonic():
            continue

        url, model = PROVIDERS[account["provider"]]
        payload = {"model": model, "messages": messages, "stream": True}
        if account["provider"] == "openrouter":
            payload["max_tokens"] = 3072
            payload["provider"] = {"max_price": {"prompt": 0, "completion": 0, "request": 0}}
        else:
            payload.update(max_completion_tokens=4096, reasoning_effort="medium")

        response = None
        status = 503
        headers = {}
        try:
            http_session.cookies.clear()
            req_headers = {"Authorization": f"Bearer {account['key']}"}
            if account["provider"] == "openrouter":
                req_headers["HTTP-Referer"] = "https://meteor-chat.github.io/"
                req_headers["X-Title"] = "Meteor"
            response = http_session.post(
                url,
                headers=req_headers,
                json=payload,
                timeout=(min(5, remaining), min(20, remaining)),
                allow_redirects=False,
                stream=True,
            )
            status, headers = response.status_code, response.headers
            if status == 200:
                key_pool.set_active_index(index)
                yield from stream_response(response, deadline)
                return
        except Exception as _exc:
            status = 502
        finally:
            if response is not None:
                response.close()
            http_session.cookies.clear()

        delay = calculate_retry_delay(headers, status)
        key_pool.update_retry(account["key"], time.monotonic() + delay)
        key_pool.set_active_index((index + 1) % len(keys))

    raise ChatError(
        "Kapasitas server Meteor sedang mencapai batas maksimum. Silakan coba beberapa saat lagi."
    )
