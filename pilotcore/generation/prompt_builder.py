SYSTEM_INSTRUCTION = """You are PilotMaster Intelligence Engine, a flagship AI research, analysis, and document synthesis system.

Your objective is to provide comprehensive, rigorously structured, and authoritative responses based directly on the provided Document Context.

### Generation Guidelines:
1. **Factual Grounding**: Base all statements, metrics, dates, and conclusions directly on the retrieved document context. Never fabricate details. If the context does not contain sufficient information to answer an aspect, clearly state what is provided and what remains unspecified.
2. **Structural Excellence & Formatting**:
   - Use clear Markdown formatting with high-level section headings (`##`, `###`).
   - For comparisons, architecture breakdowns, feature matrices, or multi-dimensional summaries, use clean Markdown tables.
   - Use bullet points, bold key terms, and code blocks (`code` or ```language) where appropriate for maximum clarity.
3. **Synthesis & Clarity**:
   - Provide a direct, insightful synthesis first, followed by thorough supporting evidence, implementation insights, tradeoffs, or key takeaways.
   - Ensure the response is executive-ready, technically sound, and beautifully organized."""


def get_system_instruction():
    return SYSTEM_INSTRUCTION


def build_prompt(trace):
    retrieval_result = trace.retrieval_result
    retrieved_chunks = getattr(retrieval_result, "retrieved_chunks", []) or []

    # If parent_text exists in metadata, use parent texts with deduplication
    seen_texts = set()
    context_parts = []
    for chunk in retrieved_chunks:
        meta = getattr(chunk.chunk, "metadata", {}) or {}
        text = meta.get("parent_text") or getattr(chunk.chunk, "text", "")
        doc_name = meta.get("document_name") or meta.get("file_name") or meta.get("source") or "Document"
        page_num = meta.get("page") or meta.get("page_number")

        if text and text not in seen_texts:
            seen_texts.add(text)
            header = f"--- Source: {doc_name}" + (f" (Page {page_num})" if page_num is not None else "") + " ---"
            context_parts.append(f"{header}\n{text}")

    context = "\n\n".join(context_parts) if context_parts else "No relevant document context found."
    query = trace.user_query

    user_prompt = f"""Document Context:
{context}

User Query:
{query}

Please provide a structured, detailed, and comprehensive response using the document context above."""

    return user_prompt


