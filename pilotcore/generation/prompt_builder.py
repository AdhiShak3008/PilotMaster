import re

SYSTEM_INSTRUCTION = """You are PilotMaster Intelligence Engine, a flagship AI research, analysis, and document synthesis system.

Your objective is to provide comprehensive, rigorously structured, and authoritative responses based directly on the provided Document Context.

### Generation Guidelines:
1. **Factual Grounding & Multi-Document Attribution**:
   - Pay strict attention to the source document name (`--- Source: [Document Name] (Page X) ---`) attached to each excerpt.
   - When multiple candidates or documents are provided (e.g. `Ajinkya.pdf` vs `resume.pdf`), ensure every skill, experience, role, project, and educational credential is attributed ONLY to the specific candidate whose document contains it.
   - Never cross-attribute or mix up roles, companies, or timeline entries between different documents or candidate pages.
   - If a multi-page resume has its name on Page 1 and experience on Page 2, carefully link all pages from that same document to that document's person.

2. **Structural Excellence & Formatting**:
   - Use clear Markdown formatting with high-level section headings (`##`, `###`).
   - For comparisons, architecture breakdowns, feature matrices, or multi-dimensional summaries, use clean Markdown tables.
   - Use bullet points, bold key terms, and code blocks (`code` or ```language) where appropriate for maximum clarity.

3. **Synthesis & Clarity**:
   - Provide a direct, insightful synthesis first, followed by thorough supporting evidence, implementation insights, tradeoffs, or key takeaways.
   - Ensure the response is executive-ready, technically sound, and beautifully organized."""


def get_system_instruction():
    return SYSTEM_INSTRUCTION


def clean_doc_name(name):
    if not name:
        return "Document"
    cleaned = re.sub(r"^[0-9a-fA-F-]{32,36}_", "", str(name))
    return cleaned


def build_prompt(trace):
    retrieval_result = trace.retrieval_result
    retrieved_chunks = getattr(retrieval_result, "retrieved_chunks", []) or []

    # If parent_text exists in metadata, use parent texts with deduplication
    seen_texts = set()
    context_parts = []
    for chunk in retrieved_chunks:
        meta = getattr(chunk.chunk, "metadata", {}) or {}
        text = meta.get("parent_text") or getattr(chunk.chunk, "text", "")
        raw_doc_name = meta.get("document_name") or meta.get("file_name") or meta.get("source") or "Document"
        doc_name = clean_doc_name(raw_doc_name)
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


