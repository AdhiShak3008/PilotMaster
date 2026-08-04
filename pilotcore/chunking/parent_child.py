from langchain_text_splitters import RecursiveCharacterTextSplitter

from pilotcore.chunking.base import BaseChunker


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

        parent_splitter = RecursiveCharacterTextSplitter(
            chunk_size=parent_chunk_size,
            chunk_overlap=parent_overlap,
        )

        child_splitter = RecursiveCharacterTextSplitter(
            chunk_size=child_chunk_size,
            chunk_overlap=child_overlap,
        )

        parents = parent_splitter.split_text(text)

        results = []

        for parent_id, parent in enumerate(parents):

            children = child_splitter.split_text(parent)

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