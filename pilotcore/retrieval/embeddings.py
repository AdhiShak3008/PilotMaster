from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer

MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"

_model = SentenceTransformer(MODEL_NAME)

_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)


def get_embedding_model():
    return _model


def get_embedding_tokenizer():
    return _tokenizer


def get_embedding(text: str):
    return _model.encode(
        text,
        normalize_embeddings=True,
    ).tolist()
