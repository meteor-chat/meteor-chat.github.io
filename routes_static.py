import os
from pathlib import Path

from flask import Blueprint, abort, send_from_directory

static_bp = Blueprint("static", __name__)
allowed_static = {"banner.png", "header.png", "icon.png"}


def init_static_allowlist():
    root = Path(__file__).parent
    for f in os.listdir(root):
        if f.endswith((".js", ".css", ".html", ".svg", ".json")) and f not in (
            "index.html",
            "jadwal-kuliah.json",
        ):
            allowed_static.add(f)


init_static_allowlist()


@static_bp.route("/<filename>", methods=["GET"])
def serve_static(filename):
    if filename not in allowed_static or "/" in filename or "\\" in filename:
        abort(404)
    return send_from_directory(Path(__file__).parent, filename)
