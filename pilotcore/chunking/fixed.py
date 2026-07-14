from pilotcore.chunking.base import BaseChunker


class FixedCharacterChunker(BaseChunker):
    """
    Default fixed-size character chunker.

    This preserves the existing PilotMaster chunking behaviour.
    """

    def chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 80,
    ) -> list[str]:

        chunks = []

        start = 0

        while start < len(text):

            end = start + chunk_size

            if end < len(text):

                sentence_end = text.rfind(".", start, end)

                newline_end = text.rfind("\n", start, end)

                boundary = max(sentence_end, newline_end)

                if boundary != -1 and boundary > start:

                    end = boundary + 1

            chunk = text[start:end].strip()

            if chunk:

                chunks.append(chunk)

            next_start = end - overlap

            # Ensure forward progress to avoid infinite loops
            if next_start <= start:

                next_start = end

            start = next_start

        return chunks
