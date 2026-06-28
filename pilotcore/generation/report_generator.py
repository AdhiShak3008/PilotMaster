from groq import Groq

from pilotcore.config import (
    GROQ_API_KEY,
    GROQ_MODEL,
)

from pilotcore.models.registry import SUPPORTED_MODELS

client = Groq(api_key=GROQ_API_KEY)


def generate_report(
    system_prompt: str,
    prompt: str,
    model_name=None,
):
    selected_model = model_name or GROQ_MODEL

    if selected_model not in SUPPORTED_MODELS:
        raise ValueError(f"Unsupported model: {selected_model}")

    completion = client.chat.completions.create(
        model=selected_model,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return completion.choices[0].message.content
