import time
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)



def generate_hypothetical_document(query: str) -> tuple[str, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return query, TechniqueTrace(
            technique="hyde",
            phase="Phase 5: Retrieval",
            input_text=query or "",
            output_text=query or "",
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are a Hypothetical Document Embeddings (HyDE) generator for dense semantic retrieval.
Given a user query, generate a plausible, concise hypothetical passage/document excerpt (50-120 words) that would directly answer the question if it appeared in technical documentation or enterprise reports.

Rules:
- Write as an authoritative factual document excerpt.
- Do NOT say "Based on...", "Here is...", or "In conclusion".
- Do NOT address the user. Output ONLY the hypothetical document text.
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.4,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
        )
        hypothetical = completion.choices[0].message.content.strip().strip('"')
        latency = (time.perf_counter() - start_time) * 1000

        if not hypothetical or len(hypothetical.split()) < 5:
            hypothetical = query

        return hypothetical, TechniqueTrace(
            technique="hyde",
            phase="Phase 5: Retrieval",
            input_text=query,
            output_text=hypothetical,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return query, TechniqueTrace(
            technique="hyde",
            phase="Phase 5: Retrieval",
            input_text=query,
            output_text=query,
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
