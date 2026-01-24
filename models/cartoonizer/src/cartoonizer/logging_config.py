from __future__ import annotations

import logging
from logging.config import dictConfig


def setup_logging(level: str | None = None) -> None:
    """Configure JSON-like structured logging for the cartoonizer CLI."""
    log_level = (level or "INFO").upper()

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