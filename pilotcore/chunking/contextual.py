import concurrent.futures
from typing import List, Dict, Any
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.chunking.base import BaseChunker
from pilotcore.chunking.recursive import RecursiveCharacterChunker


class ContextualChunker(BaseChunker):
    """
    Contextual Chunker (Contextual Retrieval).

    Splits document into base chunks, then uses an LLM to generate
    a succinct (20-40 words) situating context for each chunk based on the
    overall document. The situating prefix is prepended to the chunk:
    
      [Context: {situating_context}]
      {original_chunk}

    This prevents standalone chunks from losing overarching document identity
    (company name, timeframe, document title, subject matter).
    """

    def __init__(self, model: str = None):
        self.model = model or GROQ_FAST_MODEL
        self.client = None
        if GROQ_API_KEY:
            try:
                self.client = Groq(api_key=GROQ_API_KEY)
            except Exception:
                self.client = None

    def chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 80,
        max_doc_context: int = 3500,
        concurrency: int = 4,
        **kwargs: Any,
    ) -> List[Dict[str, Any]]:
        if not text or not text.strip():
            return []

        # 1. Generate baseline recursive chunks
        base_splitter = RecursiveCharacterChunker()
        base_chunks = base_splitter.chunk(text, chunk_size=chunk_size, overlap=overlap)

        if not base_chunks:
            return []

        if not self.client:
            # Fallback if no LLM client is available
            return base_chunks

        # 2. Extract document overview for context window
        doc_overview = text[:max_doc_context].strip()

        # 3. Contextualize chunks in parallel
        def _contextualize_single(chunk_dict: dict, index: int) -> dict:
            raw_text = chunk_dict.get("text", "")
            if not raw_text.strip() or len(raw_text.split()) < 8:
                return chunk_dict

            prompt = f"""<document>
{doc_overview}
</document>

<chunk>
{raw_text}
</chunk>

Please provide a succinct 1-2 sentence context (under 35 words) to situate this chunk within the overall document for search retrieval. Mention key entities, section topic, or dates if relevant. Output ONLY the situating context."""

            try:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    temperature=0.2,
                    max_tokens=80,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a Contextual Retrieval engine. Provide ONLY a concise 1-2 sentence context prefix situating the given chunk within the whole document.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                )
                prefix = completion.choices[0].message.content.strip().strip('"')
                if prefix and len(prefix.split()) >= 3:
                    enhanced_text = f"[Context: {prefix}]\n\n{raw_text}"
                    metadata = dict(chunk_dict.get("metadata", {}))
                    metadata.update({
                        "is_contextual": True,
                        "context_prefix": prefix,
                        "chunk_index": index,
                        "original_text": raw_text,
                    })
                    return {"text": enhanced_text, "metadata": metadata}
            except Exception:
                pass

            return chunk_dict

        results = [None] * len(base_chunks)
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            future_to_idx = {
                executor.submit(_contextualize_single, c, i): i
                for i, c in enumerate(base_chunks)
            }
            for future in concurrent.futures.as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception:
                    results[idx] = base_chunks[idx]

        return [r for r in results if r is not None]
