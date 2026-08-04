import re

from pilotcore.chunking.base import BaseChunker
from pilotcore.retrieval.embeddings import get_embedding_tokenizer


class TokenChunker(BaseChunker):
    """
    Token-based chunker using the embedding model tokenizer.

    Attempts to preserve natural sentence boundaries while
    respecting the desired token budget.
    """

    def chunk(
        self,
        text: str,
        chunk_size: int = 256,
        overlap: int = 40,
    ) -> list[dict]:

        tokenizer = get_embedding_tokenizer()

        token_ids = tokenizer.encode(
            text,
            add_special_tokens=False,
        )

        chunks = []

        start = 0

        while start < len(token_ids):

            end = min(start + chunk_size, len(token_ids))

            candidate_ids = token_ids[start:end]

            candidate = tokenizer.decode(
                candidate_ids,
                skip_special_tokens=True,
            ).strip()

            # Last chunk
            if end == len(token_ids):
                if candidate:
                    chunks.append(candidate)
                break

            # Try to end at a natural boundary
            boundary = self._find_boundary(candidate)

            if boundary != -1:

                candidate = candidate[: boundary + 1].strip()

                actual_ids = tokenizer.encode(
                    candidate,
                    add_special_tokens=False,
                )

                end = start + len(actual_ids)

            if candidate:
                chunks.append(candidate)

            next_start = end - overlap

            if next_start <= start:
                next_start = end

            start = next_start

        return [
            {
                "text": chunk,
                "metadata": {},
            }
            for chunk in chunks
        ]

    @staticmethod
    def _find_boundary(text: str) -> int:
        """
        Find the last 'good' split location.
        """

        boundaries = []

        for match in re.finditer(r"\n\n", text):
            boundaries.append(match.end() - 1)

        for match in re.finditer(r"[.!?]\s", text):
            boundaries.append(match.end() - 2)

        for match in re.finditer(r"\n", text):
            boundaries.append(match.end() - 1)

        if not boundaries:
            return -1

        return max(boundaries)
