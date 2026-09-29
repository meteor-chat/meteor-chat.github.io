from flask import Blueprint, render_template

page_bp = Blueprint("page", __name__)


@page_bp.route("/", methods=["GET"])
def index():
    return render_template("index.html")
