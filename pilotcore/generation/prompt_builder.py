BROAD_VERBS = {"elaborate", "describe", "summarize", "explain", "overview", "discuss", "tell"}


def build_prompt(trace):

    retrieval_result = trace.retrieval_result
    retrieved_chunks = retrieval_result.retrieved_chunks

    context = "\n\n".join([chunk.chunk.text for chunk in retrieved_chunks])

    query = trace.user_query
    first_word = query.strip().split()[0].lower() if query.strip() else ""
    is_broad = first_word in BROAD_VERBS

    if is_broad:
        prompt = f"""You are a document assistant. Using ONLY the document context below, provide a thorough response to the user's request. Do not use outside knowledge.

Document Context:
{context}

User Request:
{query}"""
    else:
        prompt = f"""Answer the user's question using the retrieved context below. If the answer is not in the context, say you don't have enough information.

Retrieved Context:
{context}

User Question:
{query}"""

    return prompt
