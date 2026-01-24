PYTHON ?= python
API_DIR := api_web/backend
WEB_DIR := api_web/web_streamlit
GRADIO_DIR := cloud_infer_gradio
MODEL_DIR := models/cartoonizer

.PHONY: setup api web gradio test lint model-download model-infer model-benchmark model-convert

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
	@echo "   cd $(MODEL_DIR) && pip install -r requirements.txt"
	@echo ""
	@echo "3) Install dev tools (optional):"
	@echo "   pip install pre-commit black ruff"
	@echo "   pre-commit install"

api:
	cd $(API_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:
	cd $(WEB_DIR) && streamlit run app.py

gradio:
	cd $(GRADIO_DIR) && $(PYTHON) app.py

test:
	cd $(API_DIR) && pytest

lint:
	ruff .
	black --check .

model-download:
	@echo "Model download helper:"
	@echo "  cd $(MODEL_DIR)"
	@echo "  $(PYTHON) -m cartoonizer download --model-id cartoongan-fp16"
	cd $(MODEL_DIR) && $(PYTHON) -m cartoonizer download --help || true

model-infer:
	@echo "Model inference helper:"
	@echo "  cd $(MODEL_DIR)"
	@echo "  $(PYTHON) -m cartoonizer infer --help"
	cd $(MODEL_DIR) && $(PYTHON) -m cartoonizer infer --help || true

model-benchmark:
	@echo "Model benchmark helper:"
	@echo "  cd $(MODEL_DIR)"
	@echo "  $(PYTHON) -m cartoonizer benchmark --help"
	cd $(MODEL_DIR) && $(PYTHON) -m cartoonizer benchmark --help || true

model-convert:
	@echo "Model convert helper:"
	@echo "  cd $(MODEL_DIR)"
	@echo "  $(PYTHON) -m cartoonizer convert --help"
	cd $(MODEL_DIR) && $(PYTHON) -m cartoonizer convert --help || true