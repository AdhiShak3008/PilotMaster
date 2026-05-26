from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_MODEL
from pilotcore.generation.prompt_builder import build_prompt
from pilotcore.tracing.telemetry import emit_event

client = Groq(api_key=GROQ_API_KEY)


def generate_response(
    trace,
):

    prompt = build_prompt(trace)

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    response = completion.choices[0].message.content

    trace.final_response = response

    emit_event(
        "generation.completed",
        {
            "trace_id": trace.trace_id,
            "response_length": len(response),
            "model": GROQ_MODEL,
        },
    )

    return response
