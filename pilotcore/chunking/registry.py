from pilotcore.chunking.fixed import FixedCharacterChunker
from pilotcore.chunking.recursive import RecursiveCharacterChunker
from pilotcore.chunking.semantic import SemanticTextChunker
from pilotcore.chunking.token import TokenChunker
from pilotcore.chunking.parent_child import ParentChildChunker
from pilotcore.chunking.contextual import ContextualChunker
from pilotcore.chunking.structure_aware import StructureAwareChunker

CHUNKERS = {
    "fixed": FixedCharacterChunker,
    "recursive": RecursiveCharacterChunker,
    "token": TokenChunker,
    "semantic": SemanticTextChunker,
    "parent_child": ParentChildChunker,
    "contextual": ContextualChunker,
    "structure_aware": StructureAwareChunker,
    "structure": StructureAwareChunker,
}


def get_chunker(strategy: str):
    try:
        return CHUNKERS[strategy]
    except KeyError:
        raise ValueError(f"Unknown chunking strategy: {strategy}")


def get_runtime():
    from pilotcore.chunking.runtime import ChunkingRuntime
    return ChunkingRuntime


try:
    from pilotcore.chunking.runtime import ChunkingRuntime
except ImportError:
    pass


