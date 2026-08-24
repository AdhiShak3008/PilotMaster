import re
import numpy as np
from pilotcore.chunking.base import BaseChunker


class SemanticTextChunker(BaseChunker):
    """
    Semantic chunker that groups semantically coherent sentences
    together based on embedding cosine similarity transitions.
    """

    def chunk(
        self,
        text: str,
        breakpoint_threshold_type: str = "percentile",
        percentile_threshold: float = 85.0,
        **kwargs,
    ) -> list[dict]:
        if not text or not text.strip():
            return []

        # Attempt langchain_experimental if available
        try:
            from langchain_experimental.text_splitter import SemanticChunker
            from pilotcore.retrieval.langchain_embeddings import PilotCoreEmbeddings

            chunker = SemanticChunker(
                embeddings=PilotCoreEmbeddings(),
                breakpoint_threshold_type=breakpoint_threshold_type,
            )
            chunks = chunker.split_text(text)
            return [
                {"text": c.strip(), "metadata": {}}
                for c in chunks
                if c.strip()
            ]
        except Exception:
            pass

        # Native semantic similarity splitter using sentence embeddings
        from pilotcore.retrieval.embeddings import get_embeddings_batch

        # Split into sentences
        sentence_regex = r"(?<=[.?!])\s+(?=[A-Z0-9])|\n\n+"
        raw_sentences = [s.strip() for s in re.split(sentence_regex, text) if s.strip()]

        if len(raw_sentences) <= 1:
            return [{"text": text.strip(), "metadata": {}}]

        # Embed sentences
        embeddings = get_embeddings_batch(raw_sentences)
        if not embeddings or len(embeddings) < 2:
            return [{"text": text.strip(), "metadata": {}}]

        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        normed_embeddings = embeddings / norms

        # Compute cosine distances between adjacent sentences
        distances = []
        for i in range(len(normed_embeddings) - 1):
            sim = np.dot(normed_embeddings[i], normed_embeddings[i + 1])
            distances.append(1.0 - float(sim))

        # Determine breakpoint threshold
        if distances:
            threshold = float(np.percentile(distances, percentile_threshold))
        else:
            threshold = 0.5

        chunks = []
        current_chunk = [raw_sentences[0]]

        for i, dist in enumerate(distances):
            if dist > threshold:
                chunk_str = " ".join(current_chunk).strip()
                if chunk_str:
                    chunks.append({"text": chunk_str, "metadata": {}})
                current_chunk = [raw_sentences[i + 1]]
            else:
                current_chunk.append(raw_sentences[i + 1])

        if current_chunk:
            chunk_str = " ".join(current_chunk).strip()
            if chunk_str:
                chunks.append({"text": chunk_str, "metadata": {}})

        return chunks if chunks else [{"text": text.strip(), "metadata": {}}]