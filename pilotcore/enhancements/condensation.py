import time
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)


def condense_query(query: str, chat_history: list = None) -> tuple[str, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return query, TechniqueTrace(
            technique="query_condensation",
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

    system_prompt = """You are a conversational query condensation specialist.
Given the previous chat conversation and the latest follow-up question, rephrase the follow-up question into a standalone, fully self-contained question that can be understood without the chat history.

Rules:
- Output ONLY the condensed standalone question.
- Do NOT answer the question.
- Do NOT add pleasantries or commentary.
- If the question is already standalone, return it exactly as is.
"""

    user_content = f"Chat History:\n{history_context}\n\nLatest Question: {query}" if history_context else f"Question: {query}"

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.0,

            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
        condensed = completion.choices[0].message.content.strip().strip('"').strip("'")
        latency = (time.perf_counter() - start_time) * 1000

        if not condensed or len(condensed.split()) < 2:
            condensed = query

        return condensed, TechniqueTrace(
            technique="query_condensation",
            phase="Phase 1: Context",
            input_text=query,
            output_text=condensed,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return query, TechniqueTrace(
            technique="query_condensation",
            phase="Phase 1: Context",
            input_text=query,
            output_text=query,
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
