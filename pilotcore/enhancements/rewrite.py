import time
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)


def rewrite_retrieval_query(query: str) -> tuple[str, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return query, TechniqueTrace(
            technique="query_rewrite",
            phase="Phase 2: Rewrite",
            input_text=query or "",
            output_text=query or "",
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are an expert search query optimization engine.
Rewrite the given user query to optimize it for vector dense retrieval and sparse BM25 keyword matching.
Strip conversational fluff, fix typos, emphasize core domain entities, and produce a clear, unambiguous search query.

Rules:
- Output ONLY the rewritten search query.
- Do NOT output preamble, quotes, explanations, or answers.
- Preserve all key nouns, acronyms, and technical constraints.
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.0,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
        )
        rewritten = completion.choices[0].message.content.strip().strip('"').strip("'")
        latency = (time.perf_counter() - start_time) * 1000

        if not rewritten or len(rewritten.split()) < 2:
            rewritten = query

        return rewritten, TechniqueTrace(
            technique="query_rewrite",
            phase="Phase 2: Rewrite",
            input_text=query,
            output_text=rewritten,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return query, TechniqueTrace(
            technique="query_rewrite",
            phase="Phase 2: Rewrite",
            input_text=query,
            output_text=query,
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
