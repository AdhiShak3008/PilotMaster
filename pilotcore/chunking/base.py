from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseChunker(ABC):
    """
    Base interface for all chunking strategies.

    Every chunker must return a list of chunk strings.
    """

    @abstractmethod
    def chunk(
        self,
        text: str,
        **kwargs: Any,
    ) -> List[str]:
        """
        Split text into chunks.

        Args:
            text: Input text to split.
            **kwargs: Optional strategy-specific configuration.

        Returns:
            List[str]: Ordered list of text chunks.
        """
        pass
