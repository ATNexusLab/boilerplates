from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from src.config.settings import settings
from src.routes import register_routes
from src.lib.logger import logger


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = settings.SECRET_KEY

    CORS(app, origins=settings.CORS_ORIGINS)

    Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["100 per 15 minutes"],
        storage_uri="memory://",
    )

    register_routes(app)

    @app.errorhandler(404)
    def not_found(error):
        return {"error": {"message": "Not found", "status": 404}}, 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error("Internal error", exc_info=error)
        return {"error": {"message": "Internal server error", "status": 500}}, 500

    return app
