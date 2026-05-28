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
const riskColor = { low: "#16a34a", medium: "#eab308", moderate: "#eab308", high: "#ef4444", none: "#6b7280", unknown: "#6b7280" };
const ansColor = { high: "#16a34a", medium: "#eab308", moderate: "#eab308", partial: "#eab308", low: "#ef4444", none: "#ef4444", unknown: "#6b7280", abstained: "#7c4dff" };

export default function TraceExplorer({ onHome, onDocPilot }) {
    const [traces, setTraces] = useState([]);
    const [selectedTrace, setSelectedTrace] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [replaying, setReplaying] = useState(false);
    const [loadingTraces, setLoadingTraces] = useState(true);
    const [loadingTraceId, setLoadingTraceId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

   useEffect(() => {
    const fetchIfVisible = () => {
        if (document.visibilityState === "visible") {
            fetchTraces();
        }
    };

    fetchIfVisible();

    const interval = setInterval(fetchIfVisible, 30000);

    return () => clearInterval(interval);
}, []);

    function fetchTraces() {
        setLoadingTraces(true);
        api.get("/traces")
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

    async function clearTraces() {
        if (window.confirm("Clear all TracePilot traces? This action cannot be undone.")) {
            try {
                await api.delete("/traces");
                setSelectedTrace(null);
                setSelectedId(null);
                fetchTraces();
            } catch (error) {
                console.error("Failed to clear traces", error);
            }
        }
    }

    const avgLatency = traces.length
        ? Math.round(traces.reduce((s, t) => s + (t.latency || 0), 0) / traces.length)
        : 0;

    const groundedCount = traces.filter(t => t.grounded).length;

    return (
        <div className="trace-root" style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0d0d0d", color: "#e0e0e0", fontFamily: "monospace" }}>
            {sidebarOpen && <button className="mobile-drawer-backdrop" aria-label="Close traces" onClick={() => setSidebarOpen(false)} />}

            {/* HEADER */}
            <div className="trace-header" style={{ padding: "24px 32px 20px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
                <button className="mobile-menu-button trace-mobile-list-button" onClick={() => setSidebarOpen(true)} aria-label="Open trace list">☰</button>
                <h1 className="trace-title" style={{
                    margin: 0, fontSize: "42px", fontFamily: "Georgia, serif",
                    fontWeight: "600", letterSpacing: "-2px", color: "white", lineHeight: 1,
                }}>
                    TracePilot
                </h1>
                <p style={{ margin: "6px 0 0", color: "#555", fontSize: "13px" }}>
                    execution intelligence layer
                </p>
                {onHome && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <button onClick={onHome} style={{
                            padding: "7px 14px", background: "transparent",
                            color: "#555", border: "1px solid #2a2a2a", borderRadius: "8px",
                            cursor: "pointer", fontSize: "12px",
                        }}>← Home</button>
                        {onDocPilot && (
                            <button onClick={onDocPilot} style={{
                                padding: "7px 14px", background: "transparent",
                                color: "#4caf50", border: "1px solid #2a2a2a", borderRadius: "8px",
                                cursor: "pointer", fontSize: "12px",
                            }}>DocPilot →</button>
                        )}
                        <button onClick={clearTraces} style={{
                            padding: "7px 14px", background: "transparent",
                            color: "#ef4444", border: "1px solid #2a2a2a", borderRadius: "8px",
                            cursor: "pointer", fontSize: "12px",
                        }}>Clear Traces</button>
                    </div>
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
            <div className="trace-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* SIDEBAR */}
                <div className={`trace-sidebar ${sidebarOpen ? "is-open" : ""}`} style={{ width: "34%", borderRight: "1px solid #1e1e1e", overflowY: "auto", padding: "1rem", background: "#0d0d0d" }}>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {traces.length} trace{traces.length !== 1 ? "s" : ""}
                    </p>
                    {loadingTraces && traces.length === 0 && (
                        <p style={{ color: "#333", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}><Spinner /> Loading traces...</p>
                    )}
                    {!loadingTraces && traces.length === 0 && (
                        <p style={{ color: "#333", fontSize: "0.82rem" }}>No traces yet. Ask a question in DocPilot.</p>
                    )}
                    {traces.map(trace => {
                        const rel = trace.evaluation?.retrieval_relevance || trace.retrieval_quality;
                        return (
                            <div key={trace.trace_id} onClick={() => loadTrace(trace.trace_id)} style={{
                                padding: "0.75rem 0.9rem",
                                marginBottom: "0.4rem",
                                border: `1px solid ${selectedId === trace.trace_id ? "#444" : "#1e1e1e"}`,
                                background: selectedId === trace.trace_id ? "#161616" : "#111",
                                cursor: loadingTraceId ? "not-allowed" : "pointer",
                                opacity: loadingTraceId && loadingTraceId !== trace.trace_id ? 0.7 : 1,
                                borderRadius: "6px",
                                transition: "border-color 0.15s, opacity 0.15s",
                            }}>
                                <p style={{ margin: "0 0 0.5rem", fontSize: "0.83rem", color: "#ccc", lineHeight: 1.4 }}>
                                    {trace.query}
                                </p>
                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                                    <Tag color={relevanceColor[rel] || "#555"}>{rel}</Tag>
                                    {trace.evaluation?.answerability === "none" && <Tag color="#f44336">unanswerable</Tag>}
                                    {trace.evaluation?.abstained && <Tag color="#7c4dff">abstained</Tag>}
                                    {trace.parent_trace_id && <Tag color="#7c4dff">replay</Tag>}
                                    <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#444" }}>
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
                        <div className="trace-empty-state" style={{ color: "#2a2a2a", fontSize: "0.9rem", marginTop: "2rem", textAlign: "center" }}>
                            ← select a trace to inspect
                        </div>
                    ) : (
                        <div>
                            {/* TRACE HEADER */}
                            <div className="trace-detail-header text-wrap-safe" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                <div style={{ flex: 1, marginRight: "1rem" }}>
                                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>query</p>
                                    <h2 style={{ margin: 0, fontSize: "1rem", color: "#fff", fontWeight: "500", lineHeight: 1.4 }}>
                                        {selectedTrace.query}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => replayTrace(selectedTrace.trace_id)}
                                    disabled={replaying}
                                    style={{
                                        background: "#161616", color: replaying ? "#666" : "#aaa",
                                        border: "1px solid #2a2a2a", padding: "0.45rem 1rem",
                                        cursor: replaying ? "not-allowed" : "pointer", borderRadius: "6px",
                                        fontSize: "0.78rem", flexShrink: 0,
                                        opacity: replaying ? 0.7 : 1,
                                        transition: "opacity 0.15s",
                                    }}>
                                    {replaying ? <ButtonContent text="Replaying..." /> : "↺ Replay"}
                                </button>
                            </div>

                            {/* EVALUATION TAGS */}
                            <div className="trace-eval-row" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem", padding: "0.75rem", background: "#111", borderRadius: "6px", border: "1px solid #1e1e1e" }}>
                                {(() => {
                                    const ev = selectedTrace.evaluation || {};
                                    return (<>
                                        <Tag color={relevanceColor[ev.retrieval_relevance] || "#555"}>retrieval: {ev.retrieval_relevance || "—"}</Tag>
                                        <Tag color={confColor[ev.grounding_confidence] || "#555"}>grounding: {ev.grounding_confidence || "—"}</Tag>
                                        <Tag color={ansColor[ev.answerability] || "#555"}>answerability: {ev.answerability || "—"}</Tag>
                                        <Tag color={riskColor[ev.hallucination_risk] || "#555"}>hallucination risk: {ev.hallucination_risk || "—"}</Tag>
                                        {ev.abstained && <Tag color="#7c4dff">abstained ✓</Tag>}
                                        <span className="trace-meta" style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#444" }}>
                                            {selectedTrace.model_name} · {selectedTrace.latency?.toFixed(0)} ms
                                            {selectedTrace.parent_trace_id && ` · replay of ${selectedTrace.parent_trace_id.slice(0, 8)}…`}
                                        </span>
                                    </>);
                                })()}
                            </div>

                            {/* RESPONSE */}
                            <Section title="Response">
                                <div className="text-wrap-safe" style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "1rem" }}>
                                    <p style={{ margin: 0, lineHeight: 1.75, color: "#ccc", fontSize: "0.85rem" }}>{selectedTrace.response}</p>
                                </div>
                            </Section>

                            {/* CHUNKS */}
                            <Section title={`Retrieved Chunks (${selectedTrace.retrieved_chunks?.length || 0})`}>
                                {selectedTrace.retrieved_chunks?.length === 0 && (
                                    <p style={{ color: "#333", fontSize: "0.82rem" }}>No chunks retrieved.</p>
                                )}
                                {selectedTrace.retrieved_chunks?.map((chunk, i) => (
                                    <div className="text-wrap-safe" key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "0.75rem", marginBottom: "0.5rem" }}>
                                        <div className="trace-chunk-tags" style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                                            <Tag color="#2a2a2a">rank {chunk.rank}</Tag>
                                            <Tag color={chunk.score < 0.8 ? "#4caf50" : chunk.score < 1.2 ? "#ff9800" : "#f44336"}>
                                                score {chunk.score?.toFixed(3)}
                                            </Tag>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#888", lineHeight: 1.6 }}>{chunk.text}</p>
                                    </div>
                                ))}
                            </Section>

                            {/* METRICS */}
                            <Section title="Metrics">
                                <div className="trace-metrics-row" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <MetricBox label="Retrieval Avg" value={selectedTrace.retrieval_score_avg?.toFixed(3)} />
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
                                            <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "#666" }}>
                                                <span style={{ color: "#aaa" }}>{span.name || span.span_type}</span>
                                                {span.duration_ms && <span style={{ marginLeft: "0.5rem", color: "#444" }}>{span.duration_ms} ms</span>}
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

function Tag({ color, children }) {
    return (
        <span style={{
            background: color + "18", color, border: `1px solid ${color}40`,
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
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.68rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</p>
            {children}
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "8px 16px", minWidth: "100px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ margin: "3px 0 0", fontSize: "1rem", fontWeight: "600", color: color || "#ccc" }}>{value}</p>
        </div>
    );
}

function MetricBox({ label, value }) {
    return (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "6px", padding: "0.6rem 0.9rem", minWidth: "110px" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#aaa", fontWeight: "500" }}>{value}</p>
        </div>
    );
}
