from groq import Groq

from pilotcore.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

ENABLE_QUERY_REWRITE = True


def rewrite_query(query: str) -> str:

    if not ENABLE_QUERY_REWRITE:
        return query

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": """
You are a retrieval query rewriter for a RAG system.

Your goal is NOT to answer questions.

Your goal is to transform vague user questions into retrieval-friendly search queries.

Rules:

- Return exactly ONE query.
- Do not answer.
- Do not explain.
- Do not use bullet points.
- Do not use quotation marks.
- Preserve named entities exactly.
- Preserve technical terms exactly.
- Expand vague references into likely document terminology.
- Prefer terminology commonly used in research papers.
- If the query is already specific, return it unchanged.

Examples:

User:
Why did bidirectional context improve performance?

Rewrite:
Why did bidirectional context improve performance in BERT

User:
How did they train the model?

Rewrite:
How was BERT pretrained and fine tuned

User:
What was wrong with older language models?

Rewrite:
What limitations of left to right language models did BERT address

User:
Why did this approach work better?

Rewrite:
Why did BERT outperform previous NLP models

User:
What made BERT different?

Rewrite:
What architectural and training differences made BERT different from previous language models
""",
                },
                {
                    "role": "user",
                    "content": query,
                },
            ],
        )

        rewritten = completion.choices[0].message.content.strip()

        # fallback protections

        if not rewritten:
            return query

        if len(rewritten) > 200:
            return query

        if rewritten.count("\n") > 0:
            return query

        if rewritten.lower().startswith("answer"):
            return query

        if rewritten.lower().startswith("bert is"):
            return query

        print("\n===== QUERY REWRITE =====")
        print("ORIGINAL :", query)
        print("REWRITTEN:", rewritten)
        print("=========================\n")

        return rewritten

    except Exception as e:
        print(f"[QUERY_REWRITE_ERROR] {e}")
        return query
