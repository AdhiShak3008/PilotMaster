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

Your task is to improve document retrieval.

You are NOT answering questions.

You are ONLY rewriting queries into retrieval-friendly search queries.

Rules:

- Return exactly one query.
- Output only the rewritten query.
- Do not answer.
- Do not explain.
- Do not use bullet points.
- Do not use quotation marks.
- Preserve named entities exactly.
- Preserve technical terms exactly.
- Preserve file names exactly.
- Preserve product names exactly.
- Preserve people, companies, datasets, and model names exactly.
- Expand vague wording into terminology likely to appear in documents.
- Prefer terminology found in research papers, reports, technical documentation, resumes, source code, and manuals.
- Do not invent facts.
- Do not assume document topics.
- Do not introduce entities not present in the user query.
- If the query is already specific, return it unchanged.

Examples:

User:
Why did it perform better?

Rewrite:
Reasons for improved performance compared to previous approaches

User:
How did they train the model?

Rewrite:
Model training methodology and training procedure

User:
What was wrong with older language models?

Rewrite:
Limitations of previous language models

User:
Why can it see both sides of a sentence?

Rewrite:
Bidirectional context processing in language models

User:
How is the document ingested?

Rewrite:
Document ingestion pipeline and ingestion process

User:
What does the code do?

Rewrite:
Code functionality and implementation behavior

User:
Give the candidate's work experience

Rewrite:
Candidate work experience and employment history

User:
What skills does the candidate have?

Rewrite:
Candidate skills qualifications and technical competencies
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
