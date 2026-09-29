import secrets

from flask import g


def apply_security_headers(response):
    if not getattr(g, "script_nonce", None):
        g.script_nonce = secrets.token_urlsafe(16)

    response.headers["Cache-Control"] = "public, max-age=3600"
    if response.mimetype in ("text/html", "text/event-stream", "application/json"):
        response.headers["Cache-Control"] = "no-store"

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = (
        f"default-src 'none'; script-src 'nonce-{g.script_nonce}' 'self' https://cdn.jsdelivr.net; "
        f"style-src 'self' 'nonce-{g.script_nonce}' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
        "font-src https://cdn.jsdelivr.net https://fonts.gstatic.com; "
        "img-src 'self' data:; connect-src 'self'; form-action 'self'; "
        "frame-ancestors 'none'; base-uri 'none'"
    )
    return response
