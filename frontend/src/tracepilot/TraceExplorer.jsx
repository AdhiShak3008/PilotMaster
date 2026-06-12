import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/tracepilot",
});

const relevanceColor = {
  high: "#16a34a",
  medium: "#eab308",
  moderate: "#eab308",
  low: "#ef4444",
  none: "#6b7280",
  unknown: "#6b7280",
};
const confColor = { high: "#16a34a", medium: "#eab308", moderate: "#eab308", low: "#ef4444", none: "#6b7280", unknown: "#6b7280" };
const consensusColor = { strong: "#16a34a", semantic: "#3b82f6", lexical: "#f59e0b", none: "#6b7280", consensus: "#16a34a", "semantic-only": "#3b82f6", "lexical-only": "#f59e0b" };
const riskColor = { low: "#16a34a", medium: "#eab308", moderate: "#eab308", high: "#ef4444", none: "#6b7280", unknown: "#6b7280" };
const ansColor = { high: "#16a34a", medium: "#eab308", moderate: "#eab308", partial: "#eab308", low: "#ef4444", none: "#ef4444", unknown: "#6b7280", abstained: "#7c4dff" };

export default function TraceExplorer({ onHome, onDocPilot, experimentMode, }) {
    const [traces, setTraces] = useState([]);
    const [selectedTrace, setSelectedTrace] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [replaying, setReplaying] = useState(false);
    const [loadingTraces, setLoadingTraces] = useState(true);
    const [loadingTraceId, setLoadingTraceId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState("");
    
   useEffect(() => {
    const fetchIfVisible = () => {
        if (document.visibilityState === "visible") {
            fetchTraces();
        }
    };

    fetchIfVisible();

    const interval = setInterval(fetchIfVisible, 30000);

    return () => clearInterval(interval);
}, [experimentMode]);

    function fetchTraces() {
        setLoadingTraces(true);
        api.get("/traces", {
        params: {
             mode: experimentMode
        ? "experimental"
        : "production",
        },
    })
            .then(r => setTraces(r.data))
            .catch(() => {})
            .finally(() => setLoadingTraces(false));
    }

    async function loadTrace(traceId) {
        if (loadingTraceId) return;
        setSelectedId(traceId);
        setLoadingTraceId(traceId);
        try {
            const r = await api.get(`/traces/${traceId}`);
            setSelectedTrace(r.data);
            setSidebarOpen(false);
        } finally {
            setLoadingTraceId(null);
        }
    }

    async function replayTrace(traceId) {
        if (replaying) return;
        setReplaying(true);
        try {
            await api.post(`/traces/${traceId}/replay`);
            fetchTraces();
        } finally {
            setReplaying(false);
        }
    }

async function resetTraces() {
    console.log("RESET CLICKED");

    const mode = experimentMode
        ? "experimental"
        : "production";

    console.log("MODE =", mode);

    try {
        setResetting(true);

        const response = await api.delete(
            "/traces/reset",
            {
                params: { mode },
            }
        );

        console.log("RESET SUCCESS", response.data);

        fetchTraces();

        setSelectedTrace(null);
        setSelectedId(null);

        setResetMessage(
            `${mode} traces cleared`
        );

    } catch (err) {
        console.error("RESET FAILED", err);
        console.error(err?.response?.data);

        setResetMessage(
            "Failed to reset traces."
        );
    } finally {
        setResetting(false);
    }
}
    const avgLatency = traces.length
        ? Math.round(traces.reduce((s, t) => s + (t.latency || 0), 0) / traces.length)
        : 0;

    const groundedCount = traces.filter(t => t.grounded).length;

    return (
        <div className="trace-root" style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "monospace" }}>
            {sidebarOpen && <button className="mobile-drawer-backdrop" aria-label="Close traces" onClick={() => setSidebarOpen(false)} />}

            {/* HEADER */}
            <div className="trace-header" style={{ padding: "24px 32px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                <button className="mobile-menu-button trace-mobile-list-button" onClick={() => setSidebarOpen(true)} aria-label="Open trace list">☰</button>
                <h1 className="trace-title" style={{
                    margin: 0, fontSize: "42px", fontFamily: "Georgia, serif",
                    fontWeight: "600", letterSpacing: "-2px", color: "white", lineHeight: 1,
                }}>
                    TracePilot
                </h1>
                <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "13px" }}>
                    execution intelligence layer
                </p>
                
                {onHome && (
                    <>
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                            <button onClick={onHome} style={{
                                padding: "7px 14px", background: "var(--surface)",
                                color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "8px",
                                cursor: "pointer", fontSize: "12px",
                            }}>← Home</button>
                            {onDocPilot && (
                                <button onClick={onDocPilot} style={{
                                    padding: "7px 14px", background: "var(--surface)",
                                    color: "var(--success)", border: "1px solid var(--border)", borderRadius: "8px",
                                    cursor: "pointer", fontSize: "12px",
                                }}>DocPilot →</button>
                            )}
                            <button onClick={resetTraces} disabled={resetting} style={{
                                padding: "7px 14px", background: "var(--surface)",
                                color: "var(--danger)", border: "1px solid var(--border)", borderRadius: "8px",
                                cursor: resetting ? "not-allowed" : "pointer", fontSize: "12px", opacity: resetting ? 0.75 : 1,
                            }}>{resetting ? "Resetting..." : "Reset Traces"}</button>
                        </div>
                        {resetMessage && (
                            <p style={{ margin: "12px 0 0", color: "var(--text-primary)", fontSize: "0.82rem", opacity: 0.85 }}>{resetMessage}</p>
                        )}
                    </>
                )}

                {/* STAT PILLS */}
                <div className="trace-stat-row" style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap" }}>
                    <Stat label="Total Traces" value={traces.length} />
                    <Stat label="Avg Latency" value={`${avgLatency} ms`} />
                    <Stat label="Grounded" value={`${groundedCount} / ${traces.length}`} color="#4caf50" />
                    <Stat
                        label="Ungrounded"
                        value={traces.length - groundedCount}
                        color={traces.length - groundedCount > 0 ? "#f44336" : "#555"}
                    />
                </div>
            </div>

            {/* BODY */}
           <div
  className="trace-body"
  style={{
    display: "flex",
    flex: 1,
    overflow: "hidden",
  }}
>
                {/* SIDEBAR */}
                <div className={`trace-sidebar ${sidebarOpen ? "is-open" : ""}`} style={{ width: "34%", borderRight: "1px solid var(--border)", overflowY: "auto", padding: "1rem", background: "var(--bg-secondary)" }}>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {traces.length} trace{traces.length !== 1 ? "s" : ""}
                    </p>
                    {loadingTraces && traces.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}><Spinner /> Loading traces...</p>
                    )}
                    {!loadingTraces && traces.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No traces yet. Ask a question in DocPilot.</p>
                    )}
                    {traces.map(trace => {
                        const rel = trace.evaluation?.retrieval_relevance || trace.retrieval_quality;
                        return (
                            <div key={trace.trace_id} onClick={() => loadTrace(trace.trace_id)} style={{
                                padding: "0.75rem 0.9rem",
                                marginBottom: "0.4rem",
                                border: `1px solid ${selectedId === trace.trace_id ? "#4b5563" : "var(--border)"}`,
                                background: selectedId === trace.trace_id ? "var(--surface-hover)" : "var(--surface)",
                                cursor: loadingTraceId ? "not-allowed" : "pointer",
                                opacity: loadingTraceId && loadingTraceId !== trace.trace_id ? 0.7 : 1,
                                borderRadius: "6px",
                                transition: "border-color 0.15s, opacity 0.15s",
                            }}>
                                <p style={{ margin: "0 0 0.5rem", fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                    {trace.query}
                                </p>
                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                                    <Tag color={relevanceColor[rel] || "var(--text-muted)"}>{rel}</Tag>
                                    {trace.evaluation?.answerability === "none" && <Tag color="#f44336">unanswerable</Tag>}
                                    {trace.evaluation?.abstained && <Tag color="#7c4dff">abstained</Tag>}
                                    {trace.parent_trace_id && <Tag color="#7c4dff">replay</Tag>}
                                    <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                        {loadingTraceId === trace.trace_id ? <Spinner size={12} /> : `${trace.latency?.toFixed(0)} ms`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DETAIL PANEL */}
                <div className="trace-detail-panel" style={{ flex: 1, overflowY: "auto", padding: "1.75rem 2rem" }}>
                    {!selectedTrace ? (
                        <div className="trace-empty-state" style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "2rem", textAlign: "center" }}>
                            ← select a trace to inspect
                        </div>
                    ) : (
                        <div>
                            {/* TRACE HEADER */}
                            <div className="trace-detail-header text-wrap-safe" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                <div style={{ flex: 1, marginRight: "1rem" }}>
                                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>query</p>
                                    <h2 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)", fontWeight: "500", lineHeight: 1.4 }}>
                                        {selectedTrace.query}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => replayTrace(selectedTrace.trace_id)}
                                    disabled={replaying}
                                    style={{
                                        background: "var(--surface)", color: replaying ? "var(--text-muted)" : "var(--text-secondary)",
                                        border: "1px solid var(--border)", padding: "0.45rem 1rem",
                                        cursor: replaying ? "not-allowed" : "pointer", borderRadius: "6px",
                                        fontSize: "0.78rem", flexShrink: 0,
                                        opacity: replaying ? 0.7 : 1,
                                        transition: "opacity 0.15s",
                                    }}>
                                    {replaying ? <ButtonContent text="Replaying..." /> : "↺ Re-Run"}
                                </button>
                            </div>

                            {/* EVALUATION TAGS */}
                            <div className="trace-eval-row" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem", padding: "0.75rem", background: "var(--surface)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                                {(() => {
                                    const ev = selectedTrace.evaluation || {};
                                    return (<>
                                        <Tag color={relevanceColor[ev.retrieval_relevance] || "var(--text-muted)"}>retrieval quality: {ev.retrieval_relevance || "—"}</Tag>
                                        <Tag color={confColor[ev.grounding_confidence] || "var(--text-muted)"}>grounding: {ev.grounding_confidence || "—"}</Tag>
                                        <Tag color={consensusColor[ev.retrieval_consensus] || "#6b7280"}>retrieval agreement: {ev.retrieval_consensus || "—"}</Tag>
                                        <Tag color={ansColor[ev.answerability] || "var(--text-muted)"}>answerability: {ev.answerability || "—"}</Tag>
                                        <Tag color={riskColor[ev.hallucination_risk] || "var(--text-muted)"}>hallucination risk: {ev.hallucination_risk || "—"}</Tag>
                                        {ev.abstained && <Tag color="#7c4dff">abstained ✓</Tag>}
                                        <span className="trace-meta" style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                            {selectedTrace.model_name} · {selectedTrace.latency?.toFixed(0)} ms
                                            {selectedTrace.parent_trace_id && ` · replay of ${selectedTrace.parent_trace_id.slice(0, 8)}…`}
                                        </span>
                                    </>);
                                })()}
                            </div>

                            {/* RESPONSE */}
                            <Section title="Response">
                                <div className="text-wrap-safe" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "1rem" }}>
                                    <p style={{ margin: 0, lineHeight: 1.75, color: "var(--text-secondary)", fontSize: "0.85rem" }}>{selectedTrace.response}</p>
                                </div>
                            </Section>

                            {/* CHUNKS */}
                            <Section title={`Retrieved Chunks (${selectedTrace.retrieved_chunks?.length || 0})`}>
                                {selectedTrace.retrieved_chunks?.length === 0 && (
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No chunks retrieved.</p>
                                )}
                                {selectedTrace.retrieved_chunks?.map((chunk, i) => (
                                    <ChunkCard key={i} chunk={chunk} index={i} />
                                ))}
                            </Section>

                            {/* METRICS */}
                            <Section title="Metrics">
                                <div className="trace-metrics-row" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <MetricBox label="Avg Retrieval Confidence" value={selectedTrace.evaluation?.reranker_confidence_avg?.toFixed(3) ?? "—"} />
                                    <MetricBox label="Retrieval Quality Score" value={selectedTrace.evaluation?.retrieval_quality_score?.toFixed(3) ?? "—"} />
                                    <MetricBox label="Chunk Count" value={selectedTrace.chunk_count} />
                                    <MetricBox label="Response Length" value={`${selectedTrace.response_length} chars`} />
                                    <MetricBox label="Faithfulness" value={selectedTrace.evaluation?.faithfulness_score?.toFixed(2) ?? "—"} />
                                    <MetricBox label="Query Coverage" value={selectedTrace.evaluation?.query_coverage?.toFixed(2) ?? "—"} />
                                    <MetricBox label="Query Type" value={selectedTrace.evaluation?.query_type ?? "—"} />
                                    <MetricBox label="Evaluator v" value={selectedTrace.evaluator_version ?? "—"} />
                                    <MetricBox label="Prompt v" value={selectedTrace.prompt_version ?? "—"} />
                                    <MetricBox label="Retriever v" value={selectedTrace.retriever_version ?? "—"} />
                                </div>
                            </Section>

                            {/* SPANS */}
                            {selectedTrace.spans?.length > 0 && (
                                <Section title="Spans">
                                    <div className="trace-spans-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {selectedTrace.spans.map((span, i) => (
                                            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                <span style={{ color: "var(--text-muted)" }}>{span.name || span.span_type}</span>
                                                {span.duration_ms && <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)" }}>{span.duration_ms} ms</span>}
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ChunkCard({ chunk, index }) {
    const [open, setOpen] = useState(false);
    const displayScore = chunk.reranker_score ?? chunk.score;
    const hasLineage = chunk.dense_score != null || chunk.bm25_score != null ||
        chunk.rrf_score != null || chunk.reranker_score != null || chunk.retrieval_sources?.length > 0;

    const primaryScoreColor = chunk.reranker_confidence != null
        ? (chunk.reranker_confidence > 0.7 ? "#16a34a" : chunk.reranker_confidence > 0.4 ? "#eab308" : "#ef4444")
        : "var(--text-muted)";

    return (
        <div className="text-wrap-safe" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                    #{chunk.final_rank ?? chunk.rank ?? index + 1}
                </span>
            </div>
            <div className="trace-chunk-tags" style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {displayScore != null && (
                    <Tag color={primaryScoreColor}>
                        {chunk.reranker_score != null ? "reranker logit" : "score"} {displayScore.toFixed(3)}
                    </Tag>
                )}
                {chunk.reranker_confidence != null && (
                    <Tag color={chunk.reranker_confidence > 0.7 ? "#16a34a" : chunk.reranker_confidence > 0.4 ? "#eab308" : "#ef4444"}>confidence {chunk.reranker_confidence.toFixed(2)}</Tag>
                )}
                {chunk.retrieval_sources?.map(src => <SourceBadge key={src} source={src} />)}
                {hasLineage && (
                    <button onClick={() => setOpen(o => !o)} style={{
                        marginLeft: "auto", background: "transparent", border: "1px solid var(--border)",
                        color: "var(--text-muted)", borderRadius: "4px", padding: "0.1rem 0.45rem",
                        fontSize: "0.65rem", cursor: "pointer",
                    }}>{open ? "▲ diagnostics" : "▼ diagnostics"}</button>
                )}
            </div>
            {(chunk.source_file || chunk.page != null || chunk.section_title) && (
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {chunk.source_file && <span>{chunk.source_file}</span>}
                    {chunk.page != null && <span>Page {chunk.page}</span>}
                    {chunk.section_title && <span>Section: {chunk.section_title}</span>}
                </div>
            )}
            {open && hasLineage && <RetrievalDiagnostics chunk={chunk} />}
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{chunk.text}</p>
        </div>
    );
}

const SOURCE_COLORS = { dense: "#3b82f6", bm25: "#f59e0b" };

function SourceBadge({ source }) {
    const color = SOURCE_COLORS[source] || "#6b7280";
    return (
        <span style={{
            background: color + "18", color, border: `1px solid ${color}40`,
            borderRadius: "4px", padding: "0.15rem 0.5rem", fontSize: "0.65rem", fontWeight: "600",
        }}>{source}</span>
    );
}

function RetrievalDiagnostics({ chunk }) {
    const fmt = v => v != null ? (typeof v === "number" ? v.toFixed(3) : v) : "-";
    const fmtRank = v => v != null ? `#${v}` : "-";

    const stages = [
        { label: "Semantic", color: "#3b82f6", items: [
            { k: "Dense Score", v: fmt(chunk.dense_score) },
            { k: "Dense Rank",  v: fmtRank(chunk.dense_rank) },
        ]},
        { label: "Lexical", color: "#f59e0b", items: [
            { k: "BM25 Score", v: fmt(chunk.bm25_score) },
            { k: "BM25 Rank",  v: fmtRank(chunk.bm25_rank) },
        ]},
        { label: "Fusion", color: "#8b5cf6", items: [
            { k: "RRF Score", v: fmt(chunk.rrf_score) },
        ]},
        { label: "Final Ranking", color: "#10b981", items: [
            { k: "Reranker Score", v: fmt(chunk.reranker_score) },
            { k: "Reranker Rank",  v: fmtRank(chunk.reranker_rank) },
            { k: "Final Rank",     v: fmtRank(chunk.final_rank) },
            { k: "Reranker Conf",  v: fmt(chunk.reranker_confidence) },
            { k: "Reranker Margin", v: fmt(chunk.reranker_margin) },
        ]},
    ];

    return (
        <div style={{ margin: "0.5rem 0 0.6rem", padding: "0.65rem 0.75rem", background: "var(--bg-secondary)", borderRadius: "6px", border: "1px solid var(--border)" }}>
            {/* Pipeline flow */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "0.65rem", flexWrap: "wrap" }}>
                {stages.map((s, i) => (
                    <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: "600", color: s.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                        {i < stages.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>→</span>}
                    </span>
                ))}
            </div>
            {/* Stage groups */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {stages.map(s => (
                    <div key={s.label} style={{ border: `1px solid ${s.color}30`, borderRadius: "5px", padding: "0.4rem 0.6rem", minWidth: "110px" }}>
                        <p style={{ margin: "0 0 0.3rem", fontSize: "0.6rem", color: s.color, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>{s.label}</p>
                        {s.items.map(({ k, v }) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{k}</span>
                                <span style={{ fontSize: "0.68rem", color: v === "-" ? "var(--text-muted)" : "var(--text-secondary)", fontWeight: "500" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {chunk.retrieval_sources?.length > 0 && (
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>sources</span>
                    {chunk.retrieval_sources.map(s => <SourceBadge key={s} source={s} />)}
                </div>
            )}
        </div>
    );
}

function Tag({ color, children }) {
    const isCssVar = typeof color === "string" && color.trim().startsWith("var(");
    const backgroundColor = isCssVar ? "color-mix(in srgb, currentColor 12%, transparent)" : color + "18";
    const borderColor = isCssVar ? "color-mix(in srgb, currentColor 34%, transparent)" : `${color}40`;
    return (
        <span style={{
            background: backgroundColor, color, border: `1px solid ${borderColor}`,
            borderRadius: "4px", padding: "0.15rem 0.5rem", fontSize: "0.7rem",
            fontWeight: "500", whiteSpace: "nowrap",
        }}>{children}</span>
    );
}

function Spinner({ size = 14 }) {
    return (
        <span style={{
            width: `${size}px`, height: `${size}px`, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "999px", display: "inline-block",
            animation: "pilot-spin 0.8s linear infinite", verticalAlign: "-2px",
        }} />
    );
}

function ButtonContent({ text }) {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><Spinner />{text}</span>;
}

function Section({ title, children }) {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</p>
            {children}
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 16px", minWidth: "100px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ margin: "3px 0 0", fontSize: "1rem", fontWeight: "600", color: color || "var(--text-secondary)" }}>{value}</p>
        </div>
    );
}

function MetricBox({ label, value }) {
    return (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.6rem 0.9rem", minWidth: "110px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: "500" }}>{value}</p>
        </div>
    );
}
