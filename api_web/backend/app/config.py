from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Settings:
    """Application settings loaded from environment variables.

    This intentionally avoids external dependencies to keep the scaffold light.
    """

    app_name: str = os.getenv("APP_NAME", "Mobile AI Cartoon Generation API")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    environment: str = os.getenv("ENVIRONMENT", "local")
    # Application version (semantic or date-based)
    version: str = os.getenv("APP_VERSION", "0.0.0")
    # Public API version (used in `/version` and docs)
    api_version: str = os.getenv("API_VERSION", "v1")
    # Optional git SHA for traceability in `/version`
    git_sha: str | None = os.getenv("GIT_SHA") or None

    # Gradio Space configuration for cloud mode
    gradio_space_id: str | None = os.getenv("GRADIO_SPACE_ID") or None
    gradio_api_name: str = os.getenv("GRADIO_API_NAME", "/predict")

    # Local model caching (defaults to shared artifacts layout used by the cartoonizer package)
    model_cache_dir: Path = Path(
        os.getenv("MODEL_CACHE_DIR", "./models/artifacts/downloaded")
    ).resolve()

    # Upload constraints
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "10"))


settings = Settings()