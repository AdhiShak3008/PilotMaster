from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class TechniqueTrace(BaseModel):
    technique: str
    phase: str
    input_text: str
    output_text: Any
    latency_ms: float = 0.0
    status: str = "success"  # "success" | "fallback" | "error"
    error_message: Optional[str] = None
    model: str = "llama-3.1-8b-instant"


class QueryTransformationState(BaseModel):
    original_query: str
    current_query: str
    standalone_query: Optional[str] = None
    resolved_query: Optional[str] = None
    rewritten_query: Optional[str] = None
    sub_queries: List[str] = Field(default_factory=list)
    expanded_queries: List[str] = Field(default_factory=list)
    step_back_query: Optional[str] = None
    keyword_expansion_terms: List[str] = Field(default_factory=list)
    hypothetical_document: Optional[str] = None
    metadata_filters: Dict[str, Any] = Field(default_factory=dict)
    route: Optional[Dict[str, Any]] = None
    active_enhancements: List[str] = Field(default_factory=list)
    technique_traces: List[TechniqueTrace] = Field(default_factory=list)
