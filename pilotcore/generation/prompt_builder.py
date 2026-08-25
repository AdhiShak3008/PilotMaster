import os
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
    if not name or name == "None":
        return "Document"
    base = os.path.basename(str(name))
    cleaned = re.sub(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?", "", base)
    cleaned = re.sub(r"^[0-9a-fA-F]{16,64}_?", "", cleaned)
    cleaned = re.sub(r"^[0-9a-fA-F-]{32,38}_?", "", cleaned)
    return cleaned.strip() if cleaned.strip() else base


def build_prompt(trace, chat_history=None):
    retrieval_result = trace.retrieval_result
    retrieved_chunks = getattr(retrieval_result, "retrieved_chunks", []) or []

    # If parent_text exists in metadata, use parent texts with deduplication
    seen_texts = set()
    context_parts = []
    for chunk in retrieved_chunks:
        chunk_obj = getattr(chunk, "chunk", chunk)
        meta = getattr(chunk_obj, "metadata", {}) or {}
        text = meta.get("parent_text") or getattr(chunk_obj, "text", "")
        raw_doc_name = (
            meta.get("document_name")
            or meta.get("file_name")
            or meta.get("source_file")
            or meta.get("source")
            or getattr(chunk_obj, "source", None)
            or getattr(chunk_obj, "source_file", None)
            or getattr(chunk_obj, "document_name", None)
            or "Document"
        )
        doc_name = clean_doc_name(raw_doc_name)
        page_num = (
            meta.get("page")
            or meta.get("page_number")
            or getattr(chunk_obj, "page_number", None)
            or getattr(chunk_obj, "page", None)
        )

        if text and text not in seen_texts:
            seen_texts.add(text)
            header = f"--- Source: {doc_name}" + (f" (Page {page_num})" if page_num is not None else "") + " ---"
            context_parts.append(f"{header}\n{text}")

    context = "\n\n".join(context_parts) if context_parts else "No relevant document context found."
    query = trace.user_query

    prompt_sections = [
        f"Document Context:\n{context}"
    ]

    # Check for Episodic Long-Term Memory Context
    memory_context = getattr(trace, "memory_context", None)
    if memory_context:
        prompt_sections.append(f"User Episodic Memory Context:\n{memory_context}")

    # Check for Conversational Working Memory Buffer
    history = chat_history or getattr(trace, "chat_history", None)
    if history and len(history) > 0:
        history_lines = []
        for msg in history[-8:]:  # Keep last 8 turns (4 full Q&A pairs)
            role = msg.get("role", "user")
            content = msg.get("content", "").strip()
            if content:
                history_lines.append(f"{role.capitalize()}: {content}")
        if history_lines:
            prompt_sections.append(f"Conversation History:\n" + "\n".join(history_lines))

    prompt_sections.append(f"User Query:\n{query}")
    prompt_sections.append("Please provide a structured, detailed, and comprehensive response using the document context and conversation history above.")

    return "\n\n".join(prompt_sections)


