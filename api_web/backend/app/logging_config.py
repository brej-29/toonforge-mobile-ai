from __future__ import annotations

from logging.config import dictConfig

from .config import settings


def setup_logging(level: str | None = None) -> None:
    """Configure structured (JSON-like) logging for the application.

    The format is intentionally simple and uses standard logging facilities.
    """
    log_level = (level or settings.log_level).upper()

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "format": (
                    '{"timestamp": "%(asctime)s", '
                    '"level": "%(levelname)s", '
                    '"logger": "%(name)s", '
                    '"message": "%(message)s"}'
                )
            }
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "json",
            }
        },
        "root": {
            "handlers": ["default"],
            "level": log_level,
        },
    }

    dictConfig(logging_config)