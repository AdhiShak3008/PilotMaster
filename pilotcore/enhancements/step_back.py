import time
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)



def generate_step_back_query(query: str) -> tuple[str, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return query, TechniqueTrace(
            technique="step_back",
            phase="Phase 4: Transformation",
            input_text=query or "",
            output_text=query or "",
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are an expert in Step-Back Prompting for information retrieval.
Given a specific user question, step back and formulate a broader, higher-level conceptual question that captures the fundamental principles, background knowledge, or theoretical context needed to answer the specific question.

Example:
Specific: "Why did AWS EC2 spending increase by 30% in Q3 for our analytics pipeline?"
Step-Back: "What architectural factors and workload patterns typically drive cloud compute cost scaling in analytics systems?"

Rules:
- Return ONLY the single step-back question.
- Do NOT answer the question.
- Do NOT add quotes or explanations.
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
        step_back = completion.choices[0].message.content.strip().strip('"').strip("'")
        latency = (time.perf_counter() - start_time) * 1000

        if not step_back or len(step_back.split()) < 3:
            step_back = query

        return step_back, TechniqueTrace(
            technique="step_back",
            phase="Phase 4: Transformation",
            input_text=query,
            output_text=step_back,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return query, TechniqueTrace(
            technique="step_back",
            phase="Phase 4: Transformation",
            input_text=query,
            output_text=query,
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
