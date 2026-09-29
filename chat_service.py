from errors import ChatError
from prompts import SYSTEM_MESSAGE
from provider_router import call_providers_stream
from rate_limit import chat_semaphore, rate_limiter
from schedule_loader import schedule_data


def ask_ai_stream(session_id: str, messages: list[dict], client_time: str):
    rate_limiter.check_limit(session_id)
    if not chat_semaphore.acquire(blocking=False):
        raise ChatError("Meteor sedang menjawab pesan lain. Coba lagi sebentar.", 429, 1)

    try:
        sys_msg = dict(SYSTEM_MESSAGE)
        if client_time:
            sys_msg["content"] += (
                f"\n\nInformasi Real-Time Perangkat User:\nWaktu saat ini: {client_time}"
            )
        if schedule_data:
            sys_msg["content"] += f"\n\nJadwal Kuliah User:\n{schedule_data}"

        full_messages = [sys_msg] + messages
        yield from call_providers_stream(full_messages)

        rate_limiter.record_success(session_id)
    finally:
        chat_semaphore.release()
