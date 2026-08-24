import time
import re
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)



def generate_multi_queries(query: str, count: int = 3) -> tuple[list[str], TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return [query], TechniqueTrace(
            technique="multi_query",
            phase="Phase 5: Retrieval",
            input_text=query or "",
            output_text=[query or ""],
            latency_ms=0.0,
            status="success",
        )

    system_prompt = f"""You are a multi-query generation specialist for vector database retrieval.
Generate {count} different semantic perspectives / reformulations of the given query to overcome distance boundary limitations and capture diverse relevant documents.

Rules:
- Output each query on a new line starting with a number (e.g. 1. query).
- Do NOT answer the questions.
- Do NOT add explanations.
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.7,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
        )
        raw_text = completion.choices[0].message.content.strip()
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

        variants = []
        for line in lines:
            cleaned = re.sub(r"^\d+[\.\)]\s*", "", line).strip().strip('"').strip("'")
            if cleaned and len(cleaned.split()) >= 2 and cleaned not in variants:
                variants.append(cleaned)

        if not variants:
            variants = [query]

        latency = (time.perf_counter() - start_time) * 1000
        return variants, TechniqueTrace(
            technique="multi_query",
            phase="Phase 5: Retrieval",
            input_text=query,
            output_text=variants,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return [query], TechniqueTrace(
            technique="multi_query",
            phase="Phase 5: Retrieval",
            input_text=query,
            output_text=[query],
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
