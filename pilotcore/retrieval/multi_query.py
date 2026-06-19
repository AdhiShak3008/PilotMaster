from groq import Groq
from pilotcore.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)


def generate_queries(query: str):

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": """
You are a retrieval query generator for a RAG system.

Generate 4 retrieval-oriented search queries.

Each query must explore a DIFFERENT retrieval angle.

Do NOT simply paraphrase the original query.

Focus on different perspectives such as:
- definition
- mechanism
- cause
- comparison
- related terminology
- implementation
- underlying concepts

Rules:
- Preserve entities exactly.
- Preserve technical terms exactly.
- Do not answer the question.
- Do not explain.
- Output only queries.
- One query per line.
- No numbering.
- No bullet points.
- No quotation marks.
- Each query should retrieve different documents or passages.
""",
            },
            {
                "role": "user",
                "content": query,
            },
        ],
    )

    generated = [
        q.strip()
        for q in completion.choices[0].message.content.split("\n")
        if q.strip()
    ]

    return generated[:4]
