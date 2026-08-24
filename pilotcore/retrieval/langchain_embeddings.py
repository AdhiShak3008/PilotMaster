try:
    from langchain_core.embeddings import Embeddings
except ImportError:
    class Embeddings:
        pass


from pilotcore.retrieval.embeddings import get_embedding_model


class PilotCoreEmbeddings(Embeddings):
    """
    LangChain adapter around PilotCore's embedding model.

    This reuses the singleton embedding model already
    managed by PilotCore instead of creating another
    SentenceTransformer instance.
    """

    def __init__(self):
        self.model = get_embedding_model()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(
            texts,
            normalize_embeddings=True,
        ).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self.model.encode(
            text,
            normalize_embeddings=True,
        ).tolist()
