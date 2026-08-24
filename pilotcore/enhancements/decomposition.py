import time
import re
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)


def decompose_query(query: str) -> tuple[list[str], TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return [query], TechniqueTrace(
            technique="sub_query_generation",
            phase="Phase 3: Structure",
            input_text=query or "",
            output_text=[query or ""],
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are a query decomposition specialist for a multi-hop RAG retrieval system.
Break down complex or multi-part user questions into 2 to 4 independent, focused sub-queries that can be retrieved in parallel.

Rules:
- Generate 2 to 4 self-contained sub-queries.
- Output each sub-query on a new line starting with a number and period (e.g. 1. subquery).
- Do NOT answer the questions.
- Do NOT add explanations or intro text.
- If the question is simple, single-topic, and cannot be meaningfully decomposed, return the original query as item 1.
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
        raw_text = completion.choices[0].message.content.strip()
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

        sub_queries = []
        for line in lines:
            cleaned = re.sub(r"^\d+[\.\)]\s*", "", line).strip().strip('"').strip("'")
            if cleaned and len(cleaned.split()) >= 2 and cleaned not in sub_queries:
                sub_queries.append(cleaned)

        if not sub_queries:
            sub_queries = [query]

        latency = (time.perf_counter() - start_time) * 1000
        return sub_queries, TechniqueTrace(
            technique="sub_query_generation",
            phase="Phase 3: Structure",
            input_text=query,
            output_text=sub_queries,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return [query], TechniqueTrace(
            technique="sub_query_generation",
            phase="Phase 3: Structure",
            input_text=query,
            output_text=[query],
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
