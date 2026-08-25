import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import LoadingOverlay from "../components/LoadingOverlay";
import GlossaryDrawer from "../components/GlossaryDrawer";
import GlossaryButton from "../components/GlossaryButton";
import { cleanDocName, formatPage } from "../utils/formatUtils";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/tracepilot",
});

const relevanceColor = {
  high: "#10b981",
  medium: "#f59e0b",
  moderate: "#f59e0b",
  low: "#ef4444",
  none: "#64748b",
  unknown: "#64748b",
};

const confColor = {
  high: "#10b981",
  medium: "#f59e0b",
  moderate: "#f59e0b",
  low: "#ef4444",
  none: "#64748b",
  unknown: "#64748b",
};

const consensusColor = {
  strong: "#10b981",
  semantic: "#38bdf8",
  lexical: "#f59e0b",
  none: "#64748b",
  consensus: "#10b981",
  "semantic-only": "#38bdf8",
  "lexical-only": "#f59e0b",
};

const riskColor = {
  low: "#10b981",
  medium: "#f59e0b",
  moderate: "#f59e0b",
  high: "#ef4444",
  none: "#64748b",
  unknown: "#64748b",
};

const ansColor = {
  high: "#10b981",
  medium: "#f59e0b",
  moderate: "#f59e0b",
  partial: "#f59e0b",
  low: "#ef4444",
  none: "#ef4444",
  unknown: "#64748b",
  abstained: "#a855f7",
};

export default function TraceExplorer({
  onHome,
  onDocPilot,
  onGaugePilot,
  onToggleMode,
  experimentMode,
}) {
  const [traces, setTraces] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [replaying, setReplaying] = useState(false);
  const [loadingTraces, setLoadingTraces] = useState(true);
  const [loadingTraceId, setLoadingTraceId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [isLlmOutputOpen, setIsLlmOutputOpen] = useState(false);

  useEffect(() => {
    const fetchIfVisible = () => {
      if (document.visibilityState === "visible") {
        fetchTraces();
      }
    };

    fetchIfVisible();
    const interval = setInterval(fetchIfVisible, 15000);
    return () => clearInterval(interval);
  }, [experimentMode]);

  function fetchTraces() {
    setLoadingTraces(true);
    api
      .get("/traces", {
        params: {
          mode: experimentMode ? "experimental" : "production",
        },
      })
      .then((r) => setTraces(r.data || []))
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
      setIsLlmOutputOpen(false);
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
    const mode = experimentMode ? "experimental" : "production";
    if (!window.confirm(`Clear all ${mode} execution traces?`)) return;

    try {
      setResetting(true);
      await api.delete("/traces/reset", { params: { mode } });
      fetchTraces();
      setSelectedTrace(null);
      setSelectedId(null);
      setResetMessage(`${mode.toUpperCase()} traces successfully cleared.`);
      setTimeout(() => setResetMessage(""), 4000);
    } catch (err) {
      setResetMessage("Failed to reset traces.");
    } finally {
      setResetting(false);
    }
  }

  const filteredTraces = useMemo(() => {
    if (!searchFilter.trim()) return traces;
    const q = searchFilter.toLowerCase();
    return traces.filter(
      (t) =>
        t.query?.toLowerCase().includes(q) ||
        t.trace_id?.toLowerCase().includes(q) ||
        t.model_name?.toLowerCase().includes(q)
    );
  }, [traces, searchFilter]);

  const avgLatency = traces.length
    ? Math.round(traces.reduce((s, t) => s + (t.latency || 0), 0) / traces.length)
    : 0;

  const groundedCount = traces.filter((t) => t.grounded).length;
  const groundedPct = traces.length
    ? Math.round((groundedCount / traces.length) * 100)
    : 0;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const accentColor = experimentMode ? "#a855f7" : "#3b82f6";

  return (
    <div
      className="trace-root"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      {loadingTraces && traces.length === 0 && (
        <LoadingOverlay text="Loading TracePilot workspace..." />
      )}
      {replaying && (
        <LoadingOverlay text="Replaying execution trace..." />
      )}

      {sidebarOpen && (

        <button
          className="mobile-drawer-backdrop"
          aria-label="Close traces"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* TOPBAR (Google Cloud Telemetry Header) */}
      <header
        style={{
          padding: "16px 28px",
          background: "var(--bg-secondary)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              className="mobile-menu-button trace-mobile-list-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open trace list"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: "9999px",
                cursor: "pointer",
              }}
            >
              ☰
            </button>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    fontWeight: "800",
                    letterSpacing: "-0.7px",
                    color: experimentMode ? "#c084fc" : "#38bdf8",
                  }}
                >
                  TracePilot
                </h1>

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    background: experimentMode
                      ? "rgba(168, 85, 247, 0.15)"
                      : "rgba(56, 189, 248, 0.12)",
                    color: experimentMode ? "#c084fc" : "#38bdf8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {experimentMode ? "Lab Observability" : "Production Trace"}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.02em" }}>
                Execution telemetry &amp; retrieval evaluation kernel
              </p>
            </div>
          </div>


          {/* Action Toolbar */}
          <div className="pill-scroll-bar" style={{ display: "flex", gap: "8px", alignItems: "center", overflowX: "auto", maxWidth: "100%", paddingBottom: "2px" }}>
            <a
              href="/home"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onHome();
                }
              }}
              style={{
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary)",
                textDecoration: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
            >
              Home
            </a>

            {onDocPilot && (
              <a
                href={experimentMode ? "/experimentalmode/docpilot" : "/productionmode/docpilot"}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onDocPilot();
                  }
                }}
                style={{
                  padding: "6px 14px",
                  background: experimentMode ? "rgba(168, 85, 247, 0.12)" : "rgba(56, 189, 248, 0.1)",
                  color: experimentMode ? "#c084fc" : "#38bdf8",
                  textDecoration: "none",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                DocPilot
              </a>
            )}

            {experimentMode && onGaugePilot && (
              <a
                href="/experimentalmode/gaugepilot"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onGaugePilot();
                  }
                }}
                style={{
                  padding: "6px 14px",
                  background: "rgba(168, 85, 247, 0.12)",
                  color: "#c084fc",
                  textDecoration: "none",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                GaugePilot
              </a>
            )}

            <GlossaryButton
              onClick={() => setShowGlossary(true)}
              experimentMode={experimentMode}
            />

            <a
              href={experimentMode ? "/productionmode/tracepilot" : "/experimentalmode/tracepilot"}
              className="interactive-mode-btn"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onToggleMode && onToggleMode(!experimentMode);
                }
              }}
              style={{
                padding: "6px 14px",
                background: experimentMode
                  ? "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(126, 34, 206, 0.3) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(37, 99, 235, 0.28) 100%)",
                color: experimentMode ? "#f3e8ff" : "#dbeafe",
                border: experimentMode
                  ? "1px solid rgba(192, 132, 252, 0.45)"
                  : "1px solid rgba(147, 197, 253, 0.4)",
                boxShadow: experimentMode
                  ? "0 0 16px rgba(168, 85, 247, 0.35), inset 0 0 8px rgba(168, 85, 247, 0.15)"
                  : "0 0 16px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.15)",
                textDecoration: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.18s ease",
              }}
            >
              {experimentMode ? "← Production" : "🧪 Experimental"}
            </a>


            <button
              onClick={resetTraces}
              disabled={resetting || traces.length === 0}
              style={{
                padding: "6px 14px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "none",
                borderRadius: "9999px",
                cursor: resetting || traces.length === 0 ? "not-allowed" : "pointer",
                fontSize: "12px",
                opacity: resetting || traces.length === 0 ? 0.4 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {resetting ? "Resetting..." : "✕ Clear Traces"}
            </button>
          </div>
        </div>

        {/* Telemetry Stat Tiles (Google Metric Tiles) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          <StatTile
            label="Total Traces"
            value={traces.length}
            sub="Executed requests"
            icon="📊"
            accent={accentColor}
          />
          <StatTile
            label="Avg Latency"
            value={`${avgLatency} ms`}
            sub={avgLatency < 1000 ? "Optimal speed" : "Standard response"}
            icon="⚡"
            accent="#38bdf8"
          />
          <StatTile
            label="Grounded Ratio"
            value={`${groundedPct}%`}
            sub={`${groundedCount} of ${traces.length} grounded`}
            icon="🎯"
            accent="#10b981"
          />
          <StatTile
            label="Ungrounded Risk"
            value={traces.length - groundedCount}
            sub={traces.length - groundedCount > 0 ? "Requires review" : "Zero risk"}
            icon="🛡️"
            accent={traces.length - groundedCount > 0 ? "#ef4444" : "#10b981"}
          />
        </div>

        {resetMessage && (
          <div
            style={{
              padding: "8px 14px",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "9999px",
              color: "#60a5fa",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            {resetMessage}
          </div>
        )}
      </header>

      {/* BODY WORKBENCH */}
      <div
        className="trace-body"
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* LEFT SIDEBAR: TRACE LIST */}
        <aside
          className={`trace-sidebar ${sidebarOpen ? "is-open" : ""}`}
          style={{
            width: "320px",
            flexShrink: 0,
            background: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "14px 12px",
            gap: "10px",
            boxSizing: "border-box",
          }}
        >
          {/* Search filter pill */}
          <input
            type="text"
            placeholder="Search query or ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "none",
              borderRadius: "9999px",
              color: "var(--text-primary)",
              fontSize: "12px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              padding: "2px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <span>History ({filteredTraces.length})</span>
            {loadingTraces && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Spinner size={12} /> Syncing
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {!loadingTraces && filteredTraces.length === 0 && (
              <div
                style={{
                  padding: "36px 12px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                No traces recorded.
                <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.7 }}>
                  Ask questions in DocPilot to generate live observability telemetry.
                </p>
              </div>
            )}

            {filteredTraces.map((trace) => {
              const isSelected = selectedId === trace.trace_id;
              const rel =
                trace.evaluation?.retrieval_relevance ||
                trace.retrieval_quality ||
                "medium";

              return (
                <div
                  key={trace.trace_id}
                  onClick={() => loadTrace(trace.trace_id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "14px",
                    background: isSelected ? "rgba(99, 102, 241, 0.16)" : "rgba(255, 255, 255, 0.02)",
                    cursor: loadingTraceId ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: isSelected ? "600" : "400",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {trace.query}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <PillTag color={relevanceColor[rel] || "#64748b"}>{rel}</PillTag>
                      {trace.grounded && <PillTag color="#10b981">Grounded</PillTag>}
                      {trace.parent_trace_id && <PillTag color="#a855f7">Replay</PillTag>}
                    </div>

                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {loadingTraceId === trace.trace_id ? (
                        <Spinner size={10} />
                      ) : (
                        `${trace.latency ? trace.latency.toFixed(0) : "—"} ms`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT PANE: DEEP TRACE INSPECTOR */}
        <main
          className="trace-detail-panel"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 36px",
            background: "var(--bg-primary)",
          }}
        >
          {!selectedTrace ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                🔍
              </div>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                Select a trace to inspect its execution lifecycle
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "440px" }}>
                Deep inspection of retrieved chunks, reranking logits, grounding metrics, and execution spans.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px", margin: "0 auto" }}>
              {/* HERO QUERY CARD */}
              <div
                style={{
                  padding: "20px 24px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-muted)",
                      }}
                    >
                      User Prompt
                    </span>
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedTrace.query}
                  </h2>
                </div>

                <button
                  onClick={() => replayTrace(selectedTrace.trace_id)}
                  disabled={replaying}
                  style={{
                    padding: "8px 16px",
                    background: experimentMode ? "#9333ea" : "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: replaying ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: replaying ? 0.7 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  {replaying ? <Spinner size={12} /> : "↺"} {replaying ? "Replaying..." : "Re-Run"}
                </button>
              </div>

              {/* EVALUATION METRICS TILES */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "10px",
                }}
              >
                {(() => {
                  const ev = selectedTrace.evaluation || {};
                  return (
                    <>
                      <EvalTile
                        label="Retrieval Quality"
                        value={ev.retrieval_relevance || selectedTrace.retrieval_quality || "—"}
                        color={relevanceColor[ev.retrieval_relevance || selectedTrace.retrieval_quality]}
                      />
                      <EvalTile
                        label="Grounding Conf"
                        value={ev.grounding_confidence || "—"}
                        color={confColor[ev.grounding_confidence]}
                      />
                      <EvalTile
                        label="Consensus"
                        value={ev.retrieval_consensus || "—"}
                        color={consensusColor[ev.retrieval_consensus]}
                      />
                      <EvalTile
                        label="Answerability"
                        value={ev.answerability || "—"}
                        color={ansColor[ev.answerability]}
                      />
                      <EvalTile
                        label="Hallucination Risk"
                        value={ev.hallucination_risk || "—"}
                        color={riskColor[ev.hallucination_risk]}
                      />
                    </>
                  );
                })()}
              </div>

              {/* GENERATED RESPONSE (COLLAPSIBLE) */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "20px",
                  border: isLlmOutputOpen ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "16px 22px",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  onClick={() => setIsLlmOutputOpen(!isLlmOutputOpen)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px" }}>✨</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: isLlmOutputOpen ? "var(--text-primary)" : "rgba(255, 255, 255, 0.85)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      LLM Synthesis Output
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: isLlmOutputOpen ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.06)",
                        color: isLlmOutputOpen ? "#c084fc" : "var(--text-muted)",
                      }}
                    >
                      {isLlmOutputOpen ? "Expanded" : "Click to view full output"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(selectedTrace.response);
                      }}
                      title="Copy response"
                      style={{
                        padding: "4px 10px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "none",
                        borderRadius: "9999px",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {copiedResponse ? "✓ Copied" : "📋 Copy"}
                    </button>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        transform: isLlmOutputOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        display: "inline-block",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {!isLlmOutputOpen && selectedTrace.response && (
                  <div
                    onClick={() => setIsLlmOutputOpen(true)}
                    style={{
                      marginTop: "10px",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {selectedTrace.response}
                  </div>
                )}

                {isLlmOutputOpen && (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: "14px",
                      lineHeight: 1.75,
                      color: "#e2e8f0",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedTrace.response || "No response recorded."}
                  </div>
                )}
              </div>

              {/* PIPELINE ARCHITECTURE & EXPERIMENT CONFIG */}
              {selectedTrace.pipeline_config && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "20px",
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Pipeline Architecture &amp; Configuration
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        background: selectedTrace.mode === "experimental" ? "rgba(168, 85, 247, 0.18)" : "rgba(59, 130, 246, 0.14)",
                        color: selectedTrace.mode === "experimental" ? "#c084fc" : "#60a5fa",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {selectedTrace.mode || "Production"} Mode
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <MetricCard label="Model" value={selectedTrace.model_name || "—"} />
                    <MetricCard label="Retrieval Strategy" value={selectedTrace.pipeline_config.retrieval_strategy || "Hybrid (Dense + BM25)"} />
                    <MetricCard label="Embedding Model" value={selectedTrace.pipeline_config.embedding_model || "all-mpnet-base-v2"} />
                    <MetricCard label="Chunker" value={selectedTrace.pipeline_config.chunker || "Parent-Child (1200/300)"} />
                    <MetricCard
                      label="Working Memory"
                      value={
                        selectedTrace.memory_turns_count > 0
                          ? `${selectedTrace.memory_turns_count} turns active`
                          : "Stateless (Turn 1)"
                      }
                    />
                    <MetricCard
                      label="Enhancements"
                      value={
                        selectedTrace.pipeline_config.active_enhancements?.length > 0
                          ? selectedTrace.pipeline_config.active_enhancements.join(", ")
                          : "None (Direct Baseline)"
                      }
                    />
                  </div>

                  {/* ── Episodic Long-Term Memory Context Display ── */}
                  {selectedTrace.memory_context && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px 14px",
                        background: "rgba(168, 85, 247, 0.08)",
                        border: "1px solid rgba(168, 85, 247, 0.2)",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px" }}>🧠</span>
                        <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: 700, textTransform: "uppercase" }}>
                          Episodic Memory Recalled ({selectedTrace.memory_matches_count || 1}):
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                        {selectedTrace.memory_context}
                      </p>
                    </div>
                  )}

                  {/* ── Granular Query Enhancement Lifecycle & Transformation States ── */}
                  {(() => {
                    const tState =
                      selectedTrace.transformation_state ||
                      selectedTrace.pipeline_config?.transformation_state;
                    if (!tState) {
                      return (
                        <>
                          {selectedTrace.rewritten_query && selectedTrace.rewritten_query !== selectedTrace.query && (
                            <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                                Rewritten Query Transformation:
                              </span>
                              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#38bdf8" }}>
                                {selectedTrace.rewritten_query}
                              </p>
                            </div>
                          )}

                          {selectedTrace.generated_queries?.length > 1 && (
                            <div style={{ marginTop: "10px", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                                Multi-Query Variants ({selectedTrace.generated_queries.length}):
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                                {selectedTrace.generated_queries.map((q, i) => (
                                  <span key={i} style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                    • {q}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    }

                    return (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                          Query Transformation Pipeline Lifecycle ({tState.active_enhancements?.length || 0} active techniques)
                        </span>

                        {/* Phase 1: Context Preparation */}
                        {(tState.standalone_query || tState.resolved_query) && (
                          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>
                              Phase 1: Context Preparation
                            </span>
                            {tState.standalone_query && (
                              <p style={{ margin: "4px 0 2px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>Condensed Standalone:</strong> {tState.standalone_query}
                              </p>
                            )}
                            {tState.resolved_query && (
                              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>Coreference Resolved:</strong> {tState.resolved_query}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Phase 2: Query Rewrite */}
                        {tState.rewritten_query && tState.rewritten_query !== tState.original_query && (
                          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>
                              Phase 2: Retrieval Optimization Rewrite
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#38bdf8", fontWeight: 500 }}>
                              {tState.rewritten_query}
                            </p>
                          </div>
                        )}

                        {/* Phase 3: Structuring & Routing */}
                        {(tState.metadata_filters && Object.keys(tState.metadata_filters).length > 0 || tState.route || (tState.sub_queries && tState.sub_queries.length > 1)) && (
                          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>
                              Phase 3: Structuring &amp; Routing Decisions
                            </span>

                            {tState.route && (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Route:</span>
                                <span style={{ padding: "3px 10px", borderRadius: "9999px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", fontSize: "12px", fontWeight: 600 }}>
                                  🧭 {tState.route.route || "general_knowledge"} ({Math.round((tState.route.confidence || 0.9) * 100)}% conf)
                                </span>
                                {tState.route.reasoning && (
                                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>— {tState.route.reasoning}</span>
                                )}
                              </div>
                            )}

                            {tState.metadata_filters && Object.keys(tState.metadata_filters).length > 0 && (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Filters:</span>
                                {Object.entries(tState.metadata_filters).map(([k, v]) => (
                                  <span key={k} style={{ padding: "3px 10px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", color: "var(--text-primary)", fontSize: "12px" }}>
                                    🏷️ {k}: <strong>{String(v)}</strong>
                                  </span>
                                ))}
                              </div>
                            )}

                            {tState.sub_queries?.length > 1 && (
                              <div style={{ marginTop: "6px" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Decomposed Sub-Queries ({tState.sub_queries.length}):
                                </span>
                                {tState.sub_queries.map((sq, i) => (
                                  <div key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                                    • {sq}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Phase 4: Expansion & Transformation */}
                        {(tState.step_back_query || (tState.keyword_expansion_terms && tState.keyword_expansion_terms.length > 0)) && (
                          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase" }}>
                              Phase 4: Conceptual &amp; Keyword Expansion
                            </span>
                            {tState.step_back_query && (
                              <p style={{ margin: "4px 0 2px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>Step-Back Query:</strong> {tState.step_back_query}
                              </p>
                            )}
                            {tState.keyword_expansion_terms?.length > 0 && (
                              <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Keywords:</span>
                                {tState.keyword_expansion_terms.map((kw, i) => (
                                  <span key={i} style={{ padding: "2px 8px", borderRadius: "9999px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", fontSize: "12px" }}>
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Phase 5: Retrieval Augmentation (HyDE & Multi-Query) */}
                        {(tState.hypothetical_document || (tState.expanded_queries && tState.expanded_queries.length > 1)) && (
                          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: 700, textTransform: "uppercase" }}>
                              Phase 5: Retrieval Augmentation (HyDE &amp; Multi-Query)
                            </span>
                            {tState.hypothetical_document && (
                              <div style={{ marginTop: "4px", padding: "8px 10px", background: "rgba(168,85,247,0.1)", borderRadius: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: 700 }}>HyDE Synthetic Document Excerpt:</span>
                                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#e2e8f0", fontStyle: "italic" }}>
                                  "{tState.hypothetical_document}"
                                </p>
                              </div>
                            )}
                            {tState.expanded_queries?.length > 1 && (
                              <div style={{ marginTop: "6px" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Retrieved Against {tState.expanded_queries.length} Formulations:
                                </span>
                                {tState.expanded_queries.map((eq, i) => (
                                  <div key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                                    • {eq}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Technique Latency & Execution Breakdown */}
                        {tState.technique_traces?.length > 0 && (
                          <div style={{ marginTop: "6px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                              Technique Telemetry &amp; Latency Profiles
                            </span>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "6px" }}>
                              {tState.technique_traces.map((tech, i) => (
                                <div key={i} style={{ padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                                      {tech.technique.replace(/_/g, " ")}
                                    </span>
                                    <span style={{ fontSize: "12px", color: tech.status === "success" ? "#34d399" : "#fbbf24" }}>
                                      {tech.status === "success" ? "✓" : "⚠"} {Math.round(tech.latency_ms || 0)}ms
                                    </span>
                                  </div>
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                                    {tech.phase}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}


              {/* RETRIEVED CHUNKS & MULTI-DOC DISTRIBUTION */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "20px",
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Retrieved Knowledge Chunks ({selectedTrace.retrieved_chunks?.length || 0})
                  </span>

                  {/* Multi-Doc Distribution Pill Summary */}
                  {(() => {
                    const docMap = {};
                    (selectedTrace.retrieved_chunks || []).forEach((c) => {
                      const name = cleanDocName(c.source_file) || "Unknown Document";
                      docMap[name] = (docMap[name] || 0) + 1;
                    });
                    const docNames = Object.keys(docMap);
                    if (docNames.length === 0) return null;

                    return (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {docNames.length} {docNames.length === 1 ? "document" : "documents"} in scope:
                        </span>
                        {docNames.map((d, i) => (
                          <span
                            key={d}
                            style={{
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              background: i % 2 === 0 ? "rgba(56, 189, 248, 0.15)" : "rgba(168, 85, 247, 0.15)",
                              color: i % 2 === 0 ? "#38bdf8" : "#c084fc",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            📄 {d} ({docMap[d]})
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {(!selectedTrace.retrieved_chunks || selectedTrace.retrieved_chunks.length === 0) ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                    No chunks retrieved for this execution.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedTrace.retrieved_chunks.map((chunk, i) => (
                      <ChunkCard key={i} chunk={chunk} index={i} />
                    ))}
                  </div>
                )}
              </div>

              {/* TELEMETRY METRICS */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "20px",
                  padding: "20px 24px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "block",
                    marginBottom: "14px",
                  }}
                >
                  Execution Metadata &amp; Observability Metrics
                </span>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <MetricCard label="Model" value={selectedTrace.model_name || "—"} />
                  <MetricCard label="Latency" value={`${selectedTrace.latency?.toFixed(0) ?? "—"} ms`} />
                  <MetricCard label="Chunk Count" value={selectedTrace.chunk_count ?? "—"} />
                  <MetricCard label="Response Size" value={`${selectedTrace.response_length ?? 0} chars`} />
                  <MetricCard label="Faithfulness" value={selectedTrace.evaluation?.faithfulness_score?.toFixed(2) ?? "—"} />
                  <MetricCard label="Query Coverage" value={selectedTrace.evaluation?.query_coverage?.toFixed(2) ?? "—"} />
                  <MetricCard label="Query Type" value={selectedTrace.evaluation?.query_type ?? "—"} />
                  <MetricCard label="Evaluator" value={selectedTrace.evaluator_version ?? "v1.0"} />
                </div>
              </div>


              {/* SPANS */}
              {selectedTrace.spans?.length > 0 && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "20px",
                    padding: "20px 24px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    Span Duration Breakdown
                  </span>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedTrace.spans.map((span, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          borderRadius: "9999px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                          {span.name || span.span_type}
                        </span>
                        {span.duration_ms && (
                          <span style={{ color: "#60a5fa", fontWeight: 700 }}>
                            {span.duration_ms} ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CONTEXT-AWARE GLOSSARY DRAWER */}
      <GlossaryDrawer
        isOpen={showGlossary}
        onClose={() => setShowGlossary(false)}
        page="tracepilot"
        mode={experimentMode ? "exp" : "prod"}
      />
    </div>
  );
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function StatTile({ label, value, sub, icon, accent }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "16px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "17px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          {label}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "17px", fontWeight: "700", color: "var(--text-primary)" }}>
          {value}
        </p>
        {sub && (
          <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function EvalTile({ label, value, color = "#64748b" }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "14px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, display: "inline-block" }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color, textTransform: "capitalize" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "12px",
        padding: "10px 14px",
      }}
    >
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
        {String(value)}
      </p>
    </div>
  );
}

function PillTag({ color, children }) {
  return (
    <span
      style={{
        background: `${color}18`,
        color,
        borderRadius: "9999px",
        padding: "3px 9px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "capitalize",
      }}
    >
      {children}
    </span>
  );
}

function ChunkCard({ chunk, index }) {
  const [open, setOpen] = useState(false);
  const displayScore = chunk.reranker_score ?? chunk.score;
  const hasLineage =
    chunk.dense_score != null ||
    chunk.bm25_score != null ||
    chunk.rrf_score != null ||
    chunk.reranker_score != null ||
    chunk.retrieval_sources?.length > 0;

  const primaryScoreColor =
    chunk.reranker_confidence != null
      ? chunk.reranker_confidence > 0.7
        ? "#10b981"
        : chunk.reranker_confidence > 0.4
        ? "#f59e0b"
        : "#ef4444"
      : "var(--text-muted)";

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "16px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "3px 9px",
              background: "rgba(255, 255, 255, 0.06)",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            #{chunk.final_rank ?? chunk.rank ?? index + 1}
          </span>

          {chunk.source_file && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "9999px",
                background: "rgba(56, 189, 248, 0.12)",
                color: "#38bdf8",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              📄 {cleanDocName(chunk.source_file)}
            </span>
          )}

          {chunk.page != null && (
            <span
              style={{
                padding: "3px 9px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {formatPage(chunk.page)}
            </span>
          )}

          {displayScore != null && (
            <PillTag color={primaryScoreColor}>
              {chunk.reranker_score != null ? "Reranker Logit" : "Score"}{" "}
              {typeof displayScore === "number" ? displayScore.toFixed(3) : displayScore}
            </PillTag>
          )}

          {chunk.reranker_confidence != null && (
            <PillTag
              color={
                chunk.reranker_confidence > 0.7
                  ? "#10b981"
                  : chunk.reranker_confidence > 0.4
                  ? "#f59e0b"
                  : "#ef4444"
              }
            >
              Conf {chunk.reranker_confidence.toFixed(2)}
            </PillTag>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {hasLineage && (
            <button
              onClick={() => setOpen((o) => !o)}
              style={{
                background: "rgba(129, 140, 248, 0.1)",
                border: "none",
                color: "#818cf8",
                borderRadius: "9999px",
                padding: "4px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {open ? "▲ Hide Pipeline Flow" : "▼ Pipeline Diagnostics"}
            </button>
          )}
        </div>
      </div>

      {chunk.section_title && (
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
          📌 Section: <span style={{ color: "var(--text-secondary)" }}>{chunk.section_title}</span>
        </div>
      )}

      {open && hasLineage && <RetrievalDiagnostics chunk={chunk} />}

      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
        {chunk.text}
      </p>
    </div>
  );
}


function RetrievalDiagnostics({ chunk }) {
  const fmt = (v) => (v != null ? (typeof v === "number" ? v.toFixed(3) : v) : "-");
  const fmtRank = (v) => (v != null ? `#${v}` : "-");

  const stages = [
    {
      label: "Semantic",
      color: "#38bdf8",
      items: [
        { k: "Dense Score", v: fmt(chunk.dense_score) },
        { k: "Dense Rank", v: fmtRank(chunk.dense_rank) },
      ],
    },
    {
      label: "Lexical",
      color: "#f59e0b",
      items: [
        { k: "BM25 Score", v: fmt(chunk.bm25_score) },
        { k: "BM25 Rank", v: fmtRank(chunk.bm25_rank) },
      ],
    },
    {
      label: "Fusion",
      color: "#a855f7",
      items: [{ k: "RRF Score", v: fmt(chunk.rrf_score) }],
    },
    {
      label: "Reranker",
      color: "#10b981",
      items: [
        { k: "Reranker Score", v: fmt(chunk.reranker_score) },
        { k: "Reranker Rank", v: fmtRank(chunk.reranker_rank) },
        { k: "Final Rank", v: fmtRank(chunk.final_rank) },
      ],
    },
  ];

  return (
    <div
      style={{
        padding: "10px 14px",
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
        {stages.map((s, i) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: s.color, textTransform: "uppercase" }}>
              {s.label}
            </span>
            {i < stages.length - 1 && (
              <span style={{ color: "var(--text-muted)", fontSize: "12px", opacity: 0.5 }}>→</span>
            )}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "6px" }}>
        {stages.map((s) => (
          <div
            key={s.label}
            style={{
              background: `${s.color}0d`,
              borderRadius: "8px",
              padding: "6px 10px",
            }}
          >
            <p style={{ margin: "0 0 2px", fontSize: "12px", color: s.color, fontWeight: 700, textTransform: "uppercase" }}>
              {s.label}
            </p>
            {s.items.map(({ k, v }) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                <span>{k}:</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner({ size = 14 }) {
  return (
    <span
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "pilot-spin 0.8s linear infinite",
      }}
    />
  );
}
