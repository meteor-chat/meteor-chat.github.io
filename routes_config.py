from flask import Blueprint

from limits import MAX_HISTORY, MAX_MESSAGE
from prompts import IDENTITY_REPLY

config_bp = Blueprint("config", __name__)


@config_bp.route("/api/config", methods=["GET"])
def get_config():
    return {
        "max_message": MAX_MESSAGE,
        "max_history": MAX_HISTORY,
        "identity_reply": IDENTITY_REPLY,
    }
