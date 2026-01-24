from __future__ import annotations

import logging

from fastapi import FastAPI

from .config import settings
from .logging_config import setup_logging
from .routes.health import router as health_router
from .utils.errors import register_exception_handlers

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Application factory for the FastAPI backend."""
    setup_logging()

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
    )

    # Routers
    app.include_router(health_router)

    # Exception handlers
    register_exception_handlers(app)

    logger.info("Application initialized", extra={"environment": settings.environment})

    return app


app = create_app()