import os
import logging
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)

EMBEDDING_MODELS = {
    "all-mpnet-base-v2": "sentence-transformers/all-mpnet-base-v2",
    "sentence-transformers/all-mpnet-base-v2": "sentence-transformers/all-mpnet-base-v2",
    "all-MiniLM-L6-v2": "sentence-transformers/all-MiniLM-L6-v2",
    "sentence-transformers/all-MiniLM-L6-v2": "sentence-transformers/all-MiniLM-L6-v2",
    "all-MiniLM-L12-v2": "sentence-transformers/all-MiniLM-L12-v2",
    "sentence-transformers/all-MiniLM-L12-v2": "sentence-transformers/all-MiniLM-L12-v2",
    "bge-large-en-v1.5": "BAAI/bge-large-en-v1.5",
    "BAAI/bge-large-en-v1.5": "BAAI/bge-large-en-v1.5",
    "gte-large": "thenlper/gte-large",
    "thenlper/gte-large": "thenlper/gte-large",
    "text-embedding-3-small": "sentence-transformers/all-MiniLM-L6-v2",
    "text-embedding-3-large": "sentence-transformers/all-mpnet-base-v2",
}

DEFAULT_MODEL_KEY = "all-mpnet-base-v2"
_loaded_models = {}
_loaded_tokenizers = {}


def resolve_model_name(model_key: str | None) -> str:
    if not model_key:
        return EMBEDDING_MODELS[DEFAULT_MODEL_KEY]
    return EMBEDDING_MODELS.get(model_key, EMBEDDING_MODELS.get(model_key.lower(), model_key))


def get_embedding_model(model_name: str | None = None):
    resolved = resolve_model_name(model_name)
    if resolved not in _loaded_models:
        logger.info("Loading embedding model: %s", resolved)
        _loaded_models[resolved] = SentenceTransformer(resolved)
    return _loaded_models[resolved]


def get_embedding_tokenizer(model_name: str | None = None):
    resolved = resolve_model_name(model_name)
    if resolved not in _loaded_tokenizers:
        try:
            _loaded_tokenizers[resolved] = AutoTokenizer.from_pretrained(resolved)
        except Exception:
            _loaded_tokenizers[resolved] = AutoTokenizer.from_pretrained(EMBEDDING_MODELS[DEFAULT_MODEL_KEY])
    return _loaded_tokenizers[resolved]


def get_embedding(text: str, model_name: str | None = None):
    model = get_embedding_model(model_name)
    return model.encode(
        text,
        normalize_embeddings=True,
    ).tolist()


def get_embeddings_batch(texts: list[str], model_name: str | None = None) -> list[list[float]]:
    if not texts:
        return []
    model = get_embedding_model(model_name)
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=False,
    )
    return embeddings.tolist()

