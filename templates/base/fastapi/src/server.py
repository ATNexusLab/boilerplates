import uvicorn

from src.config.settings import settings
from src.lib.logger import logger

if __name__ == "__main__":
    logger.info(f"🚀 {settings.APP_NAME} running on http://{settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "src.app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL,
    )
