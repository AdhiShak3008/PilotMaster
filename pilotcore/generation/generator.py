from groq import Groq

from pilotcore.config import GROQ_API_KEY, GROQ_MODEL
from pilotcore.generation.prompt_builder import build_prompt
from pilotcore.models.registry import SUPPORTED_MODELS
from pilotcore.tracing.telemetry import emit_event

client = Groq(api_key=GROQ_API_KEY)


def generate_response(
    trace,
    model_name=None,
):
    selected_model = model_name or GROQ_MODEL

    if selected_model not in SUPPORTED_MODELS:
        raise ValueError(f"Unsupported model: {selected_model}")

    prompt = build_prompt(trace)

    completion = client.chat.completions.create(
        model=selected_model,
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
            "model": selected_model,
        },
    )

    return response
