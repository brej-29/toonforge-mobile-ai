from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    """Application settings loaded from environment variables.

    This intentionally avoids external dependencies to keep the scaffold light.
    """

    app_name: str = os.getenv("APP_NAME", "Mobile AI Cartoon Generation API")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    environment: str = os.getenv("ENVIRONMENT", "local")
    version: str = os.getenv("APP_VERSION", "0.0.0")


settings = Settings()