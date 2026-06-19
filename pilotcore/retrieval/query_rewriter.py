from groq import Groq

from pilotcore.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

ENABLE_QUERY_REWRITE = True

# Skip rewriting for very short queries
MIN_WORDS_FOR_REWRITE = 5

# Safety limits
MAX_REWRITE_LENGTH = 200


def rewrite_query(query: str) -> str:

    if not ENABLE_QUERY_REWRITE:
        return query

    if not query:
        return query

    # Don't waste LLM calls on tiny queries
    if len(query.split()) < MIN_WORDS_FOR_REWRITE:
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

Your task is to maximize retrieval quality across:
- Dense vector search
- BM25 lexical search
- Hybrid retrieval

You are NOT answering questions.

You are ONLY rewriting queries into retrieval-friendly search queries.

Rules:

- Return exactly one rewritten query.
- Output only the rewritten query.
- Do not answer the question.
- Do not explain your reasoning.
- Do not use bullet points.
- Do not use quotation marks.

Preservation Rules:

- Preserve named entities exactly.
- Preserve technical terms exactly.
- Preserve product names exactly.
- Preserve file names exactly.
- Preserve company names exactly.
- Preserve model names exactly.
- Preserve people names exactly.

Retrieval Optimization Rules:

- Rewrite vague wording into terminology likely to appear in documents.
- Expand pronouns into explicit references when possible.
- Convert conversational language into document language.
- Include important technical concepts already implied by the query.
- Preserve the original intent.
- Do not introduce new facts.
- Do not invent entities.
- Do not change the question topic.
- Do not broaden the scope unnecessarily.

Hybrid Retrieval Rules:

- Prefer terminology commonly found in:
  - research papers
  - technical documentation
  - source code
  - reports
  - resumes
  - manuals

- Include both conceptual and lexical terms when beneficial.
- Improve keyword matching without keyword stuffing.
- Keep the query concise.

If the query is already specific and retrieval-friendly, return it unchanged.
""",
                },
                {
                    "role": "user",
                    "content": query,
                },
            ],
        )

        rewritten = completion.choices[0].message.content.strip()

        # ---------- Guards ----------

        if not rewritten:
            return query

        if len(rewritten) > MAX_REWRITE_LENGTH:
            return query

        if "\n" in rewritten:
            return query

        if len(rewritten.split()) < 2:
            return query

        if rewritten.lower().startswith("answer"):
            return query

        if rewritten.lower().startswith("the answer"):
            return query

        if rewritten.lower().startswith("based on"):
            return query

        if rewritten.lower().startswith("according to"):
            return query

        # No meaningful change
        if rewritten.lower().strip() == query.lower().strip():
            return query

        print("\n===== QUERY REWRITE =====")
        print("ORIGINAL :", query)
        print("REWRITTEN:", rewritten)
        print("=========================\n")

        return rewritten

    except Exception as e:
        print(f"[QUERY_REWRITE_ERROR] {e}")
        return query
