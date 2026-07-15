from pilotcore.chunking.fixed import FixedCharacterChunker

CHUNKERS = {
    "fixed": FixedCharacterChunker,
}


def get_chunker(strategy: str):
    try:
        return CHUNKERS[strategy]
    except KeyError:
        raise ValueError(f"Unknown chunking strategy: {strategy}")
