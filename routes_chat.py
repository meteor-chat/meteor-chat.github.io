import json
import secrets

from flask import Blueprint, Response, request, session, stream_with_context

from chat_service import ask_ai_stream
from errors import ChatError
from history_store import history_store
from history_trim import trim_history
from message_validation import validate_messages
from validation import valid_client_time

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/chat", methods=["POST"])
def chat_api():
    if "session_id" not in session:
        session["session_id"] = secrets.token_urlsafe(16)

    session_id = session["session_id"]
    data = request.get_json(silent=True) or {}

    messages = data.get("messages", [])
    if not validate_messages(messages):
        return {"error": "Pesan tidak valid. Pesan maksimal 4.000 karakter.", "retry_after": 0}, 400

    client_time = data.get("client_time", "")
    if not valid_client_time(client_time):
        client_time = ""

    messages = trim_history(messages)

    def generate():
        full_response = ""
        try:
            for chunk in ask_ai_stream(session_id, messages, client_time):
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            history_store.save_history(
                session_id, messages + [{"role": "assistant", "content": full_response}]
            )
            yield "data: [DONE]\n\n"
        except ChatError as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': 'Meteor mengalami kesalahan internal. Pesan belum terkirim; coba lagi.'})}\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")
