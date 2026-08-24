import time
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)



def resolve_coreferences(query: str, chat_history: list = None) -> tuple[str, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return query, TechniqueTrace(
            technique="coreference_resolution",
            phase="Phase 1: Context",
            input_text=query or "",
            output_text=query or "",
            latency_ms=0.0,
            status="success",
        )

    history_context = ""
    if chat_history and len(chat_history) > 0:
        recent = chat_history[-6:]
        lines = []
        for msg in recent:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            lines.append(f"{role.capitalize()}: {content}")
        history_context = "\n".join(lines)

    system_prompt = """You are an NLP Coreference Resolution specialist.
Your task is to identify ambiguous pronouns and entity references (such as "it", "they", "that company", "this product", "their numbers", "former vs latter") in the query and replace them with their explicit entity names.

Rules:
- Output ONLY the resolved query.
- Do NOT answer the question.
- Preserve the exact meaning and tone of the question.
- If there are no unresolved pronouns or references, return the query unchanged.
"""

    user_content = f"Context:\n{history_context}\n\nQuery: {query}" if history_context else f"Query: {query}"

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.0,

            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
        resolved = completion.choices[0].message.content.strip().strip('"').strip("'")
        latency = (time.perf_counter() - start_time) * 1000

        if not resolved or len(resolved.split()) < 2:
            resolved = query

        return resolved, TechniqueTrace(
            technique="coreference_resolution",
            phase="Phase 1: Context",
            input_text=query,
            output_text=resolved,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return query, TechniqueTrace(
            technique="coreference_resolution",
            phase="Phase 1: Context",
            input_text=query,
            output_text=query,
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
