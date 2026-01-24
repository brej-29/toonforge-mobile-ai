PYTHON ?= python
API_DIR := api_web/backend
WEB_DIR := api_web/web_streamlit
GRADIO_DIR := cloud_infer_gradio

.PHONY: setup api web gradio test lint

setup:
	@echo "Setup instructions:"
	@echo "1) Create a virtual environment (optional but recommended):"
	@echo "   $(PYTHON) -m venv .venv"
	@echo "   source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate"
	@echo ""
	@echo "2) Install dependencies:"
	@echo "   cd $(API_DIR) && pip install -r requirements.txt"
	@echo "   cd $(WEB_DIR) && pip install -r requirements.txt"
	@echo "   cd $(GRADIO_DIR) && pip install -r requirements.txt"
	@echo ""
	@echo "3) Install dev tools (optional):"
	@echo "   pip install pre-commit black ruff"
	@echo "   pre-commit install"

api:
	cd $(API_DIR) &amp;&amp; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:
	cd $(WEB_DIR) &amp;&amp; streamlit run app.py

gradio:
	cd $(GRADIO_DIR) &amp;&amp; $(PYTHON) app.py

test:
	cd $(API_DIR) &amp;&amp; pytest

lint:
	ruff .
	black --check .