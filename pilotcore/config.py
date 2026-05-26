import os
from dotenv import load_dotenv
from pathlib import Path

# Load from PilotMaster root .env
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

DATABASE_URL = os.getenv("DATABASE_URL")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

TRACEPILOT_URL = os.getenv("TRACEPILOT_URL", "http://localhost:8000")
DOCPILOT_URL = os.getenv("DOCPILOT_URL", "http://localhost:8000")

VECTOR_STORE_DIR = os.getenv("VECTOR_STORE_DIR", "vector_store")

# Execution version identity — bump these when the respective component changes
EVALUATOR_VERSION = "1.0"
PROMPT_VERSION = "1.0"
RETRIEVER_VERSION = "vector_v1"
