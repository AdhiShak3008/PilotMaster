from pilotcore.chunking.base import BaseChunker


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
        )
        return splitter.split_text(text)
    except Exception:
        pass

    # Native recursive splitter fallback
    separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

    def _rec_split(txt: str, seps: list[str]) -> list[str]:
        if len(txt) <= chunk_size:
            return [txt] if txt.strip() else []
        sep = seps[0] if seps else ""
        rest = seps[1:] if len(seps) > 1 else []
        splits = txt.split(sep) if sep else list(txt)
        chunks = []
        cur = ""
        for part in splits:
            piece = (cur + sep + part) if cur else part
            if len(piece) <= chunk_size:
                cur = piece
            else:
                if cur:
                    chunks.append(cur)
                if len(part) > chunk_size and rest:
                    chunks.extend(_rec_split(part, rest))
                    cur = ""
                else:
                    cur = part
        if cur:
            chunks.append(cur)
        return chunks

    return _rec_split(text, separators)


class ParentChildChunker(BaseChunker):
    """
    Parent-Child chunking.

    Splits the document into large parent chunks and then
    smaller child chunks. Children are embedded while
    retaining metadata about their parent.
    """

    def chunk(
        self,
        text: str,
        parent_chunk_size: int = 1200,
        parent_overlap: int = 150,
        child_chunk_size: int = 300,
        child_overlap: int = 40,
    ) -> list[dict]:
        if not text or not text.strip():
            return []

        parents = _split_text(text, parent_chunk_size, parent_overlap)

        results = []
        for parent_id, parent in enumerate(parents):
            children = _split_text(parent, child_chunk_size, child_overlap)
            for child_id, child in enumerate(children):
                child = child.strip()
                if not child:
                    continue
                results.append(
                    {
                        "text": child,
                        "metadata": {
                            "parent_id": parent_id,
                            "child_id": child_id,
                            "parent_text": parent,
                        },
                    }
                )

        return results