import os
from dotenv import load_dotenv
from pathlib import Path

# Load from PilotMaster root .env
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

# =========================
# Core LLM Configuration
# =========================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# =========================
# Database
# =========================

DATABASE_URL = os.getenv("DATABASE_URL")

# =========================
# Authentication
# =========================

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# =========================
# Production Service URLs
# =========================

BASE_PROD_URL = "https://shak3008-pilotmaster-backend.hf.space"

TRACEPILOT_URL = os.getenv("TRACEPILOT_URL", BASE_PROD_URL)

DOCPILOT_URL = os.getenv("DOCPILOT_URL", BASE_PROD_URL)

# =========================
# Storage
# =========================

VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_store")

# =========================
# Execution Version Identity
# =========================

EVALUATOR_VERSION = "1.0"

PROMPT_VERSION = "1.0"

RETRIEVER_VERSION = "hybrid_rrf_v1"
