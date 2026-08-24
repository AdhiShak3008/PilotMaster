from groq import Groq

from pilotcore.config import GROQ_API_KEY, GROQ_MODEL
from pilotcore.generation.prompt_builder import build_prompt, get_system_instruction
from pilotcore.models.registry import SUPPORTED_MODELS
from pilotcore.tracing.telemetry import emit_event

client = Groq(api_key=GROQ_API_KEY)


def generate_response(
    trace,
    model_name=None,
):
    selected_model = model_name or GROQ_MODEL

    if selected_model not in SUPPORTED_MODELS:
        selected_model = GROQ_MODEL

    system_instruction = get_system_instruction()
    user_prompt = build_prompt(trace)


    print(f"\n===== FINAL PROMPT SENT TO LLM ({selected_model}) =====")
    print(user_prompt)
    print("===================================\n")

    try:
        completion = client.chat.completions.create(
            model=selected_model,
            messages=[
                {
                    "role": "system",
                    "content": system_instruction,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            temperature=0.2,
        )
    except Exception as e:
        print(f"Warning: Model '{selected_model}' failed with error: {e}. Falling back to '{GROQ_MODEL}'.")
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_instruction,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            temperature=0.2,
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

