from src.app import create_app
from src.config.settings import settings
from src.lib.logger import logger

app = create_app()

if __name__ == "__main__":
    logger.info(f"🚀 {settings.APP_NAME} running on http://{settings.HOST}:{settings.PORT}")
    app.run(
        host=settings.HOST,
        port=settings.PORT,
        debug=settings.FLASK_DEBUG,
    )
