from groq import Groq
import os


def generate_llm_summary(
    leaderboard,
    insights,
    diagnoses,
    recommendations,
):

    try:

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        compact_data = {
            "leaderboard": [
                {
                    "config": item["config_name"],
                    "rank": i + 1,
                }
                for i, item in enumerate(leaderboard[:3])
            ],
            "insights": [i.title for i in insights[:5]],
            "diagnoses": [d.issue for d in diagnoses[:5]],
            "recommendations": [r.title for r in recommendations[:5]],
        }

        prompt = f"""
You are an expert Retrieval Engineer.

Analyze this benchmark data:

{compact_data}

Write:

1. Winning configuration and why.
2. Biggest risk or bottleneck.
3. Highest-leverage next action.

Maximum 4 sentences.
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.1,
            max_tokens=180,
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Summary unavailable: {str(e)}"
