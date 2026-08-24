from typing import List, Dict, Any, Optional
from pilotcore.enhancements.models import QueryTransformationState, TechniqueTrace
from pilotcore.enhancements.condensation import condense_query
from pilotcore.enhancements.coreference import resolve_coreferences
from pilotcore.enhancements.rewrite import rewrite_retrieval_query
from pilotcore.enhancements.metadata import extract_metadata_filters
from pilotcore.enhancements.routing import route_query
from pilotcore.enhancements.decomposition import decompose_query
from pilotcore.enhancements.step_back import generate_step_back_query
from pilotcore.enhancements.keyword_expansion import expand_keywords
from pilotcore.enhancements.multi_query import generate_multi_queries
from pilotcore.enhancements.hyde import generate_hypothetical_document
from pilotcore.enhancements.rag_fusion import generate_rag_fusion_queries


ENHANCEMENT_NAME_MAP = {
    # Canonical IDs
    "query_condensation": "query_condensation",
    "coreference_resolution": "coreference_resolution",
    "query_rewrite": "query_rewrite",
    "sub_query_generation": "sub_query_generation",
    "metadata_filter_extraction": "metadata_filter_extraction",
    "query_routing": "query_routing",
    "hyde": "hyde",
    "multi_query": "multi_query",
    "rag_fusion": "rag_fusion",
    "step_back": "step_back",
    "keyword_expansion": "keyword_expansion",

    # Human-readable / Frontend title mappings
    "Query Condensation": "query_condensation",
    "Coreference Resolution": "coreference_resolution",
    "Query Rewrite": "query_rewrite",
    "Sub-Query Generation": "sub_query_generation",
    "Metadata Filter Extraction": "metadata_filter_extraction",
    "Query Routing": "query_routing",
    "HyDE": "hyde",
    "HyDE (Hypothetical Embeddings)": "hyde",
    "Multi Query": "multi_query",
    "Multi Query Expansion": "multi_query",
    "Multi-Query Expansion": "multi_query",
    "RAG-Fusion": "rag_fusion",
    "Step-Back Prompting": "step_back",
    "Query Keyword Expansion": "keyword_expansion",
    "Query Expansion": "keyword_expansion",
}

ALL_CANONICAL_ENHANCEMENTS = [
    "query_condensation",
    "coreference_resolution",
    "query_rewrite",
    "metadata_filter_extraction",
    "query_routing",
    "sub_query_generation",
    "step_back",
    "keyword_expansion",
    "multi_query",
    "hyde",
    "rag_fusion",
]


class EnhancementOrchestrator:

    @staticmethod
    def normalize_enhancements(enhancements: Optional[List[str]]) -> List[str]:
        if not enhancements or "Default" in enhancements:
            return []

        if "All" in enhancements or "All Enhancements" in enhancements:
            return list(ALL_CANONICAL_ENHANCEMENTS)

        normalized = []
        for e in enhancements:
            canonical = ENHANCEMENT_NAME_MAP.get(e, ENHANCEMENT_NAME_MAP.get(e.lower().replace("-", "_").replace(" ", "_"), e))
            if canonical in ALL_CANONICAL_ENHANCEMENTS and canonical not in normalized:
                normalized.append(canonical)
        return normalized

    @classmethod
    def execute(
        cls,
        query: str,
        enhancements: Optional[List[str]] = None,
        chat_history: Optional[List[dict]] = None,
    ) -> QueryTransformationState:
        active = cls.normalize_enhancements(enhancements)
        state = QueryTransformationState(
            original_query=query,
            current_query=query,
            active_enhancements=active,
        )

        if not active or not query:
            return state

        # ─────────────────────────────────────────────────────────────
        # Phase 1: Context Preparation
        # ─────────────────────────────────────────────────────────────
        if "query_condensation" in active:
            condensed, trace = condense_query(state.current_query, chat_history)
            state.standalone_query = condensed
            state.current_query = condensed
            state.technique_traces.append(trace)

        if "coreference_resolution" in active:
            resolved, trace = resolve_coreferences(state.current_query, chat_history)
            state.resolved_query = resolved
            state.current_query = resolved
            state.technique_traces.append(trace)

        # ─────────────────────────────────────────────────────────────
        # Phase 2: Query Rewrite
        # ─────────────────────────────────────────────────────────────
        if "query_rewrite" in active:
            rewritten, trace = rewrite_retrieval_query(state.current_query)
            state.rewritten_query = rewritten
            state.current_query = rewritten
            state.technique_traces.append(trace)

        # ─────────────────────────────────────────────────────────────
        # Phase 3: Query Structuring & Routing
        # ─────────────────────────────────────────────────────────────
        if "metadata_filter_extraction" in active:
            filters, trace = extract_metadata_filters(state.current_query)
            state.metadata_filters = filters
            state.technique_traces.append(trace)

        if "query_routing" in active:
            route_info, trace = route_query(state.current_query)
            state.route = route_info
            state.technique_traces.append(trace)

        if "sub_query_generation" in active:
            sub_queries, trace = decompose_query(state.current_query)
            state.sub_queries = sub_queries
            state.technique_traces.append(trace)

        # ─────────────────────────────────────────────────────────────
        # Phase 4: Expansion & Transformation
        # ─────────────────────────────────────────────────────────────
        if "step_back" in active:
            step_back_q, trace = generate_step_back_query(state.current_query)
            state.step_back_query = step_back_q
            state.technique_traces.append(trace)

        if "keyword_expansion" in active:
            enriched_q, terms, trace = expand_keywords(state.current_query)
            state.keyword_expansion_terms = terms
            state.current_query = enriched_q
            state.technique_traces.append(trace)

        # ─────────────────────────────────────────────────────────────
        # Phase 5: Retrieval Augmentation (Multi-Query / HyDE / RAG-Fusion)
        # ─────────────────────────────────────────────────────────────
        if "hyde" in active:
            hypo_doc, trace = generate_hypothetical_document(state.current_query)
            state.hypothetical_document = hypo_doc
            state.technique_traces.append(trace)

        if "rag_fusion" in active:
            fusion_variants, trace = generate_rag_fusion_queries(state.current_query)
            state.expanded_queries = fusion_variants
            state.technique_traces.append(trace)
        elif "multi_query" in active:
            multi_variants, trace = generate_multi_queries(state.current_query)
            state.expanded_queries = multi_variants
            state.technique_traces.append(trace)

        return state
