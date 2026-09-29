import logging
import os

from flask import Flask

from app_state import init_app_state
from config import SECRET_KEY
from limits import MAX_FORM_MEMORY, MAX_FORM_PARTS
from routes_chat import chat_bp
from routes_config import config_bp
from routes_page import page_bp
from routes_static import static_bp
from security_headers import apply_security_headers

app = Flask(__name__, static_folder=None, template_folder=".")
app.config.update(
    SECRET_KEY=SECRET_KEY,
    MAX_CONTENT_LENGTH=8 * 1024 * 1024,
    MAX_FORM_MEMORY_SIZE=MAX_FORM_MEMORY,
    MAX_FORM_PARTS=MAX_FORM_PARTS,
    TRUSTED_HOSTS=["localhost", "127.0.0.1", "[::1]"],
    SESSION_COOKIE_NAME="meteor_session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Strict",
)

init_app_state(app)

app.register_blueprint(page_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(config_bp)
app.register_blueprint(static_bp)
app.after_request(apply_security_headers)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "8000")), debug=False, threaded=True)
