from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseChunker(ABC):
    """
    Base interface for all chunking strategies.

    Every chunker returns a list of chunk objects.
    """

    @abstractmethod
    def chunk(
        self,
        text: str,
        **kwargs: Any,
    ) -> List[Dict[str, Any]]:
        """
        Split text into chunks.

        Args:
            text: Input text to split.
            **kwargs: Optional strategy-specific configuration.

        Returns:
            List[Dict[str, Any]] where each item has the form:

            {
                "text": "<chunk text>",
                "metadata": {}
            }
        """
        pass