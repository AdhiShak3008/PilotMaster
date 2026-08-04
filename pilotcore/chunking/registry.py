from pilotcore.chunking.fixed import FixedCharacterChunker
from pilotcore.chunking.recursive import RecursiveCharacterChunker
from pilotcore.chunking.semantic import SemanticTextChunker
from pilotcore.chunking.token import TokenChunker
from pilotcore.chunking.parent_child import ParentChildChunker

CHUNKERS = {
    "fixed": FixedCharacterChunker,
    "recursive": RecursiveCharacterChunker,
    "token": TokenChunker,
    "semantic": SemanticTextChunker,
    "parent_child": ParentChildChunker(),
}


def get_chunker(strategy: str):
    try:
        return CHUNKERS[strategy]
    except KeyError:
        raise ValueError(f"Unknown chunking strategy: {strategy}")
