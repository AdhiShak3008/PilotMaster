from langchain_experimental.text_splitter import SemanticChunker

from pilotcore.chunking.base import BaseChunker
from pilotcore.retrieval.langchain_embeddings import PilotCoreEmbeddings


class SemanticTextChunker(BaseChunker):
    """
    Semantic chunker powered by LangChain.

    Groups semantically related sentences together
    using the PilotCore embedding model.
    """

    def chunk(
        self,
        text: str,
        breakpoint_threshold_type: str = "percentile",
        **kwargs,
    ) -> list[dict]:

        chunker = SemanticChunker(
            embeddings=PilotCoreEmbeddings(),
            breakpoint_threshold_type=breakpoint_threshold_type,
        )

        chunks = chunker.split_text(text)

        return [
            {
                "text": chunk.strip(),
                "metadata": {},
            }
            for chunk in chunks
            if chunk.strip()
        ]