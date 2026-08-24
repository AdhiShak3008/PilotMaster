from pilotcore.chunking.base import BaseChunker


class RecursiveCharacterChunker(BaseChunker):
    """
    Recursive character-based chunker.

    Splits text by progressively smaller separators
    (paragraphs, lines, sentences, words, then characters)
    while respecting the target chunk size and overlap.
    """

    def chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 80,
    ) -> list[dict]:
        if not text or not text.strip():
            return []

        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap,
                separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
            )
            chunks = splitter.split_text(text)
            return [{"text": c.strip(), "metadata": {}} for c in chunks if c.strip()]
        except Exception:
            pass

        # Native recursive splitter fallback
        separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]
        raw_chunks = self._split_text_recursive(text, separators, chunk_size, overlap)
        return [{"text": c.strip(), "metadata": {}} for c in raw_chunks if c.strip()]

    def _split_text_recursive(
        self, text: str, separators: list[str], chunk_size: int, overlap: int
    ) -> list[str]:
        if len(text) <= chunk_size:
            return [text] if text.strip() else []

        sep = separators[0] if separators else ""
        rest_seps = separators[1:] if len(separators) > 1 else []

        if sep:
            splits = text.split(sep)
        else:
            splits = list(text)

        chunks = []
        current = ""

        for part in splits:
            piece = (current + sep + part) if current else part
            if len(piece) <= chunk_size:
                current = piece
            else:
                if current:
                    chunks.append(current)
                if len(part) > chunk_size and rest_seps:
                    sub_chunks = self._split_text_recursive(part, rest_seps, chunk_size, overlap)
                    chunks.extend(sub_chunks)
                    current = ""
                else:
                    current = part

        if current:
            chunks.append(current)

        return chunks