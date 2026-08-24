import time
import re
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)


def expand_keywords(query: str) -> tuple[str, list[str], TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return query, [], TechniqueTrace(
            technique="keyword_expansion",
            phase="Phase 4: Transformation",
            input_text=query or "",
            output_text=[],
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are a keyword expansion specialist for BM25 and hybrid search systems.
Given a search query, output 4 to 8 highly relevant domain keywords, technical synonyms, acronyms, and related terms that would help retrieve matching documents.

Rules:
- Output terms as a single comma-separated line (e.g. term1, term2, term3, term4).
- Do NOT output commentary or markdown.
- Avoid keyword spamming; all terms must be strictly relevant to the query's core intent.
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
        )
        raw_terms = completion.choices[0].message.content.strip().strip('"').strip("'")
        terms = [t.strip() for t in raw_terms.split(",") if t.strip() and len(t.strip()) > 1]
        
        # Combine original query with keywords for enriched lexical query
        keyword_str = ", ".join(terms[:8])
        enriched_query = f"{query} ({keyword_str})" if keyword_str else query
        latency = (time.perf_counter() - start_time) * 1000

        return enriched_query, terms, TechniqueTrace(
            technique="keyword_expansion",
            phase="Phase 4: Transformation",
            input_text=query,
            output_text=terms,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return query, [], TechniqueTrace(
            technique="keyword_expansion",
            phase="Phase 4: Transformation",
            input_text=query,
            output_text=[],
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
