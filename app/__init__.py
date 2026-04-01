from flask import Flask

from .screening.routes import screening_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "cbct-screening-local"
    app.register_blueprint(screening_bp)
    return app
