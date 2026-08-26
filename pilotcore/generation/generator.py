from groq import Groq

from pilotcore.config import GROQ_API_KEY, GROQ_MODEL, GROQ_FAST_MODEL
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
    print(user_prompt[:500] + "... [truncated for logging]" if len(user_prompt) > 500 else user_prompt)
    print("===================================\n")

    fallback_models = [selected_model]
    if GROQ_MODEL not in fallback_models:
        fallback_models.append(GROQ_MODEL)
    if GROQ_FAST_MODEL not in fallback_models:
        fallback_models.append(GROQ_FAST_MODEL)

    completion = None
    used_model = selected_model

    for idx, model_id in enumerate(fallback_models):
        max_tok = 2048 if idx == 0 else 1536
        try:
            completion = client.chat.completions.create(
                model=model_id,
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
                max_tokens=max_tok,
            )
            used_model = model_id
            break
        except Exception as e:
            print(f"Warning: Model '{model_id}' failed with error: {e}. Trying next fallback...")
            continue

    if completion is None:
        raise RuntimeError("All Groq generation model fallbacks failed. Check API key or rate limits.")

    response = completion.choices[0].message.content

    trace.final_response = response

    emit_event(
        "generation.completed",
        {
            "trace_id": trace.trace_id,
            "response_length": len(response),
            "model": used_model,
        },
    )

    return response

