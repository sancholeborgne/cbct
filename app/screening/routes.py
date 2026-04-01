from flask import Blueprint, render_template


screening_bp = Blueprint("screening", __name__, template_folder="templates")


@screening_bp.get("/")
def index() -> str:
    return render_template("screening/index.html")
