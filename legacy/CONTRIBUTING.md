# Contributing

Thank you for your interest in contributing to the **Mobile AI Cartoon Generation** monorepo. This project is designed to be free-first, transparent, and production-style from day one.

## Ways to contribute

- Improve documentation in `docs/` and `context/`.
- Extend the FastAPI backend, Streamlit UI, or Gradio app.
- Help bootstrap the Flutter mobile client.
- Add tests, observability, and deployment automation.
- Propose and document architectural decisions.

## Development workflow

1. **Fork and clone**

   ```bash
   git clone <your-fork-url>
   cd mobile-ai-cartoon-generation
   ```

2. **Create a virtual environment**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**

   For the FastAPI backend:

   ```bash
   cd api_web/backend
   pip install -r requirements.txt
   ```

   For the Streamlit web UI:

   ```bash
   cd ../web_streamlit
   pip install -r requirements.txt
   ```

   For the Gradio cloud stub:

   ```bash
   cd ../../cloud_infer_gradio
   pip install -r requirements.txt
   ```

4. **Install tooling (recommended)**

   From the repo root:

   ```bash
   pip install pre-commit black ruff
   pre-commit install
   ```

## Coding standards

- **Python**
  - Use type hints everywhere possible.
  - Keep code compatible with Python 3.10+.
  - Follow [Black](https://github.com/psf/black) formatting and [Ruff](https://github.com/astral-sh/ruff) linting rules.
  - Prefer simple, explicit error handling and avoid hiding exceptions.
  - Use the existing logging helpers (`logging_config.py`, `utils/errors.py`) when adding new endpoints.

- **Logging**
  - Use structured logging (JSON-like) via the shared logging configuration in the FastAPI backend.
  - Log at appropriate levels: `INFO` for normal flow, `WARNING` for unusual but handled cases, `ERROR` for failures.

- **Architecture**
  - Respect the separation of concerns:
    - Gradio Space: GPU-heavy inference with ZeroGPU.
    - FastAPI: Stable API layer and orchestration.
    - Streamlit: Web UI that talks to FastAPI (not directly to Gradio).
    - Flutter: Mobile client, offline-first via TFLite with optional cloud fallback.
  - Do not commit model weights; instead, update `models/MODEL_REGISTRY.md`.

## Tests and CI

Before opening a pull request:

```bash
# From repo root
make test     # Runs pytest for the FastAPI backend
make lint     # Runs ruff and black --check
```

GitHub Actions will run:

- `python-ci.yml`: lint + tests for `api_web/backend`.
- `repo-lint.yml`: repository-level formatting / structure checks.

## Documentation and context

This repo tracks its thinking process explicitly:

- `context/` – project goals, architecture, decisions log, change log, test and deploy plans.
- `docs/` – higher-level documentation and diagrams.

When you make a significant change:

- Update `context/03_decisions_log.md` for new architectural decisions.
- Update `context/04_change_log.md` with a new entry.
- Consider updating `docs/architecture.md` if the architecture shifts.

## Pull requests

- Keep pull requests small and focused where possible.
- Include a clear description of **what** changed and **why**.
- Reference any related entries in the decisions or change logs.
- Ensure CI is green before requesting review.

By contributing, you agree that your contributions will be licensed under the same license as the rest of this repository (see `LICENSE`).