# API and Web

This directory groups the **backend API** and **web UI** components for the Mobile AI Cartoon Generation project.

## Structure

- `backend/` – FastAPI application providing a stable REST API.
- `web_streamlit/` – Streamlit web UI that consumes the FastAPI API.

## Backend (FastAPI)

See `backend/README.md` for details, including:

- App structure (`app/`, `tests/`).
- How to run the API locally.
- Testing and linting instructions.
- Configuration of cloud/local cartoonization modes.

## Web UI (Streamlit)

See `web_streamlit/README.md` for details, including:

- Local development commands.
- How the UI is structured.
- How it interacts with the FastAPI backend via `/v1/cartoonize`.