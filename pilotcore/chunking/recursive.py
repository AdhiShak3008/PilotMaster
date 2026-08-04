from langchain_text_splitters import RecursiveCharacterTextSplitter

from pilotcore.chunking.base import BaseChunker


class RecursiveCharacterChunker(BaseChunker):
    """
    Recursive character-based chunker.

    Splits text by progressively smaller separators
    (paragraphs, lines, sentences, words, then characters)
    while respecting the target chunk size.
    """

    def chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 80,
    ) -> list[dict]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            separators=[
                "\n\n",  # Paragraphs
                "\n",  # Lines
                ". ",  # Sentences
                "? ",
                "! ",
                " ",  # Words
                "",  # Characters (last resort)
            ],
        )

        chunks = splitter.split_text(text)

        return [
            {
                "text": chunk.strip(),
                "metadata": {},
            }
            for chunk in chunks
            if chunk.strip()
        ]