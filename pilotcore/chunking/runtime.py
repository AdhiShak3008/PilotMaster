from pilotcore.chunking.registry import get_chunker


class ChunkingRuntime:
    """
    Entry point for all chunking operations.

    The runtime selects the configured chunking strategy
    and delegates chunk generation to the corresponding
    chunker implementation.
    """

    @staticmethod
    def chunk(
        text: str,
        strategy: str = "fixed",
        **kwargs,
    ) -> list[str]:
        """
        Generate chunks using the requested strategy.

        Args:
            text: Text to split.
            strategy: Chunking strategy name.
            **kwargs: Strategy-specific arguments.

        Returns:
            List of text chunks.
        """

        chunker_class = get_chunker(strategy)

        chunker = chunker_class()

        return chunker.chunk(
            text=text,
            **kwargs,
        )
