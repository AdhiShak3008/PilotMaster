from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")


def get_embedding(text: str):
    return _model.encode(text, normalize_embeddings=True).tolist()
