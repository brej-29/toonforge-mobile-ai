v0.0.0 scaffold created

# 04 – Change log

This change log tracks notable changes to the repository. It is intentionally high-level and complements version control history.

The format loosely follows semantic versioning, starting at `v0.0.0` for the initial scaffold.

---

## v0.0.0 – Scaffold created

- Created initial monorepo structure:
  - `cloud_infer_gradio/` for Gradio-based cloud inference.
  - `api_web/backend/` for the FastAPI backend.
  - `api_web/web_streamlit/` for the Streamlit web UI.
  - `mobile_app/` for Flutter bootstrap guidance.
  - `models/` for the model registry.
  - `docs/` for documentation.
  - `context/` for project context and governance.
- Added initial CI workflows:
  - `python-ci.yml` for backend tests and linting.
  - `repo-lint.yml` for repository-level checks.
- Added base tooling:
  - `.pre-commit-config.yaml` with black, ruff, and basic checks.
  - `Makefile` with helper commands (`setup`, `api`, `web`, `gradio`, `test`, `lint`).
- Seeded context documents:
  - Project goal, architecture, components, decisions log, change log, test plan, deploy plan, Cosine task log.