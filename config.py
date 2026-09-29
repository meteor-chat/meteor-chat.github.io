import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

CONFIGURED_SECRET = os.getenv("METEOR_SECRET_KEY", "")
if CONFIGURED_SECRET and len(CONFIGURED_SECRET.encode("utf-8")) < 32:
    raise ValueError("Too short")
SECRET_KEY = CONFIGURED_SECRET or secrets.token_hex(32)

PROVIDERS = {
    "openrouter": ("https://openrouter.ai/api/v1/chat/completions", "google/gemma-4-31b-it:free"),
    "groq": ("https://api.groq.com/openai/v1/chat/completions", "qwen/qwen3.8-27b"),
}
