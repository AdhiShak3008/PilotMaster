import { useState, useEffect, useRef } from "react";
import { apiRequest } from "../api";
import { useDropzone } from "react-dropzone";

// ─────────────────────────────────────────────
// Shared custom popup selector
// ─────────────────────────────────────────────
function CustomSelector({ label, sublabel, items, open, onToggle, selectorRef, children }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column" }} ref={selectorRef}>
      <button
        onClick={onToggle}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-primary)",
          cursor: "pointer",
          padding: 0,
          fontSize: "14px",
          textAlign: "left",
        }}
      >
        {label} ▼
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: "10px",
            width: "320px",
            zIndex: 9999,
            borderRadius: "18px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      )}

      <span style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>{sublabel}</span>
    </div>
  );
}

function SelectorItem({ label, subtitle, active, onClick, multiSelect }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px",
        cursor: "pointer",
        background: active ? "var(--surface-hover)" : "transparent",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--surface-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {multiSelect ? (
          <span
            style={{
              width: "14px",
              height: "14px",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              background: active ? "var(--surface-hover)" : "transparent",
              flexShrink: 0,
            }}
          >
            {active ? "✓" : ""}
          </span>
        ) : (
          <span style={{ width: "16px", fontSize: "13px" }}>{active ? "✓" : ""}</span>
        )}
        <span>{label}</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", paddingLeft: multiSelect ? "20px" : "16px" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Retrieval Strategy config
// ─────────────────────────────────────────────
const RETRIEVAL_STRATEGIES = [
  {
    id: "FAISS",
    label: "FAISS",
    subtitle: "Dense vector retrieval",
  },

  {
    id: "BM25",
    label: "BM25",
    subtitle: "Sparse keyword retrieval",
  },

  {
    id: "Hybrid",
    label: "Hybrid",
    subtitle: "Dense + sparse retrieval",
  },
];

// ─────────────────────────────────────────────
// Reranker model selections
// ─────────────────────────────────────────────

const RERANKER_OPTIONS = [
  {
    id: "none",
    label: "None",
    subtitle: "No reranking",
  },
  {
    id: "minilm",
    label: "MiniLM",
    subtitle: "cross-encoder/ms-marco-MiniLM-L-6-v2",
  },
];
// ─────────────────────────────────────────────
// Enhancements config
// ─────────────────────────────────────────────
const ENHANCEMENT_OPTIONS = [
  {
    id: "Default",
    label: "Default",
    subtitle:
      "Run the normal retrieval pipeline without any additional enhancement techniques.",
  },
  {
  id: "Query Rewrite",
  label: "Query Rewrite",
  subtitle: "Rewrite the user query before retrieval."
  },
  {
    id: "HyDE",
    label: "HyDE",
    subtitle: "Generate hypothetical answers before retrieval.",
  },
  {
    id: "Multi Query",
    label: "Multi Query",
    subtitle: "Generate multiple query variants.",
  },
  {
    id: "Context Compression",
    label: "Context Compression",
    subtitle: "Compress retrieved context before generation.",
  },
  {
    id: "All",
    label: "All",
    subtitle: "Enable every enhancement technique.",
  },
];

const ALL_ENHANCEMENT_IDS = [
  "Query Rewrite",
  "HyDE",
  "Multi Query",
  "Context Compression",
];
function buildEnhancementLabel(selected) {
  if (selected.includes("Default") || selected.length === 0) return "Default";
  if (
    ALL_ENHANCEMENT_IDS.every((id) => selected.includes(id)) &&
    selected.length === ALL_ENHANCEMENT_IDS.length
  )
    return "All";
  return selected.join(" + ");
}

function toggleEnhancement(current, id) {
  if (id === "Default") return ["Default"];

  if (id === "All") {
    // Select all individual enhancements
    return [...ALL_ENHANCEMENT_IDS];
  }

  // Remove Default if present
  let next = current.filter((e) => e !== "Default");

  if (next.includes(id)) {
    next = next.filter((e) => e !== id);
  } else {
    next = [...next, id];
  }

  if (next.length === 0) return ["Default"];
  return next;
}

function isEnhancementActive(selected, id) {
  if (id === "All")
    return ALL_ENHANCEMENT_IDS.every((e) => selected.includes(e)) && selected.length === ALL_ENHANCEMENT_IDS.length;
  return selected.includes(id);
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
function Dashboard({ experimentMode, onLogout, onHome, onTracePilot }) {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant");
  const [models, setModels] = useState([]);
  const [showModels, setShowModels] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState(null);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const modelSelectorRef = useRef(null);
  const retrievalSelectorRef = useRef(null);
  const rerankerSelectorRef = useRef(null);
  const enhancementSelectorRef = useRef(null);

  // Experiment toggles
  const [retrievalStrategy, setRetrievalStrategy] = useState("Hybrid");
  const [showRetrieval, setShowRetrieval] = useState(false);

  const [reranker, setReranker] = useState("minilm");
  const [showReranker, setShowReranker] = useState(false);
  const [selectedEnhancements, setSelectedEnhancements] = useState(["Default"]);
  const [showEnhancements, setShowEnhancements] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close all popups on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target))
        setShowModels(false);
      if (retrievalSelectorRef.current && !retrievalSelectorRef.current.contains(event.target))
        setShowRetrieval(false);
      if (enhancementSelectorRef.current && !enhancementSelectorRef.current.contains(event.target))
        setShowEnhancements(false);
      if (rerankerSelectorRef.current && !rerankerSelectorRef.current.contains(event.target))
        setShowReranker(false);
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowModels(false);
        setShowRetrieval(false);
        setShowReranker(false);
        setShowEnhancements(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      setInitialLoading(true);
      try {
        const [sessionData, billingData] = await Promise.all([
          apiRequest("/history/sessions"),
          apiRequest("/billing/me"),
        ]);
        setSessions(sessionData);
        setUsername(billingData.username);
      } catch {
        // ignore
      } finally {
        setInitialLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    apiRequest("/models/")
      .then((data) => {
        setModels(data);
        if (data.length > 0 && !selectedModel) setSelectedModel(data[0].id);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiRequest("/history/sessions");
      setSessions(data);
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSession = async (sessionId) => {
    if (loadingSessionId || deletingSessionId) return;
    setLoadingSessionId(sessionId);
    try {
      const data = await apiRequest(`/history/${sessionId}`);
      setMessages(
        data.map((m) => ({
          role: m.role,
          content: m.content,
          sources: m.sources,
          timestamp: m.timestamp || m.created_at || new Date().toISOString(),
        }))
      );
      setCurrentSessionId(sessionId);
      setSidebarOpen(false);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.length > 0 && setFile(files[0]),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt", ".md", ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".h", ".go", ".rs", ".json", ".yaml", ".yml", ".sql", ".css", ".html"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
  });

  const uploadFile = async () => {
    if (!file || uploading) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await apiRequest("/docs/upload", "POST", formData);
      if (data.detail) {
        alert(data.detail);
      } else {
        alert(data.message);
        setSource(file.name);
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!question || asking) return;
    const q = question;
    setQuestion("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: q, timestamp: new Date().toISOString() },
      { role: "assistant", content: "Thinking...", loading: true, timestamp: new Date().toISOString() },
    ]);

    setAsking(true);
    try {
      const payload = {
        question: q,
        source,
        session_id: currentSessionId,
        model_name: selectedModel,
      };

      if (experimentMode) {
  payload.retrieval_strategy = retrievalStrategy;
  payload.reranker = reranker;
  payload.enhancements = selectedEnhancements;
}

      const data = await apiRequest("/chat/ask", "POST", payload);

      if (data.session_id) {
        setCurrentSessionId(data.session_id);
        fetchSessions();
      }

      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          timestamp: new Date().toISOString(),
        };
        return u;
      });
    } catch {
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content: "Something went wrong.",
          timestamp: new Date().toISOString(),
        };
        return u;
      });
    } finally {
      setAsking(false);
    }
  };

  const deleteActiveDocument = async () => {
    if (deletingDoc) return;
    if (!window.confirm("Delete all documents and clear the vector store?")) return;
    setDeletingDoc(true);
    try {
      await apiRequest("/docs/reset", "DELETE");
      setSource("");
      setFile(null);
      setMessages([]);
      setCurrentSessionId(null);
      fetchSessions();
    } catch {
      alert("Failed to delete documents.");
    } finally {
      setDeletingDoc(false);
    }
  };

  const activeModelLabel =
    models.length === 0 ? "Loading models..." : models.find((m) => m.id === selectedModel)?.label || selectedModel;

  const activeRetrievalLabel = retrievalStrategy;
  const activeRerankerLabel =
    RERANKER_OPTIONS.find((r) => r.id === reranker)?.label || "MiniLM";
  const activeEnhancementLabel = buildEnhancementLabel(selectedEnhancements);

  return (
    <div
      className="docpilot-root"
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "Arial",
        overflow: "hidden",
      }}
    >
      {(initialLoading || uploading) && (
        <LoadingOverlay text={uploading ? "Uploading document..." : "Loading dashboard..."} />
      )}

      {sidebarOpen && (
        <button
          className="mobile-drawer-backdrop"
          aria-label="Close conversations"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`docpilot-sidebar ${sidebarOpen ? "is-open" : ""}`}
        style={{
          width: "280px",
          flexShrink: 0,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 24px 16px", flexShrink: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "44px",
              fontFamily: "Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-2px",
              color: "white",
              lineHeight: 1,
            }}
          >
            DocPilot
          </h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: "14px" }}>{username}</p>
        </div>

        {/* UPLOAD */}
        <div style={{ padding: "0 16px 16px", flexShrink: 0, borderBottom: "1px solid #1a1a1a" }}>
          <div
            {...getRootProps()}
            style={{
              border: "1px dashed var(--border)",
              borderRadius: "12px",
              padding: "20px 16px",
              textAlign: "center",
              background: isDragActive ? "var(--surface-hover)" : "var(--surface)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "13px",
              marginBottom: "10px",
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p style={{ margin: 0 }}>Drop here...</p>
            ) : (
              <p style={{ margin: 0 }}>Drag &amp; drop or click to upload</p>
            )}
            {file && <p style={{ margin: "8px 0 0", color: "#888", fontSize: "12px" }}>{file.name}</p>}
          </div>

          <button
            onClick={uploadFile}
            disabled={uploading || !file}
            style={{
              width: "100%",
              padding: "11px",
              background: "var(--surface)",
              color: uploading ? "var(--text-muted)" : "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              cursor: uploading || !file ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: uploading || !file ? 0.75 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {uploading ? <ButtonContent text="Uploading..." /> : "Upload"}
          </button>
        </div>

        {/* NEW CHAT */}
        <div style={{ padding: "12px 16px", flexShrink: 0 }}>
          <button
            onClick={() => {
              setMessages([]);
              setCurrentSessionId(null);
            }}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            + New Chat
          </button>
        </div>

        {/* SESSIONS */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "11px",
              color: "#777",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Conversations
          </p>

          {loadingSessions && sessions.length === 0 && (
            <p style={{ color: "#777", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Spinner /> Loading...
            </p>
          )}

          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => loadSession(session.id)}
              style={{
                padding: "12px 14px",
                marginBottom: "6px",
                borderRadius: "10px",
                background: currentSessionId === session.id ? "var(--surface-hover)" : "var(--surface)",
                border: "1px solid var(--border)",
                cursor: loadingSessionId || deletingSessionId ? "not-allowed" : "pointer",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: loadingSessionId && loadingSessionId !== session.id ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  color: "var(--text-primary)",
                }}
              >
                {session.title || `Chat #${session.id}`}
              </span>

              {deletingSessionId === session.id && (
                <span style={{ color: "#999", marginLeft: "8px", display: "inline-flex" }}>
                  <Spinner size={12} />
                </span>
              )}

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (deletingSessionId) return;
                  setDeletingSessionId(session.id);
                  try {
                    await apiRequest(`/history/${session.id}`, "DELETE");
                    if (currentSessionId === session.id) {
                      setMessages([]);
                      setCurrentSessionId(null);
                    }
                    fetchSessions();
                  } finally {
                    setDeletingSessionId(null);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginLeft: "8px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div
        className="docpilot-main"
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-primary)" }}
      >
        {/* TOPBAR */}
        <div
          className="docpilot-topbar"
          style={{
            padding: "12px 24px",
            borderBottom: `1px solid var(--border)`,
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
            style={{
              color: "var(--text-primary)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ☰
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p className="docpilot-active-document" style={{ margin: 0, fontSize: "13px", color: "#ccc" }}>
              Active Document: <span style={{ color: source ? "#ddd" : "#888" }}>{source || "None"}</span>
            </p>
          </div>

          <div className="docpilot-actions" style={{ display: "flex", gap: "8px" }}>
            {[
              { label: "← Home", onClick: onHome, color: "#ddd" },
              { label: "TracePilot →", onClick: onTracePilot, color: "#ddd" },
              { label: deletingDoc ? "Deleting..." : "✕ Delete Doc Data", onClick: deleteActiveDocument, color: "#ef4444", disabled: deletingDoc },
              { label: "Logout", onClick: onLogout, color: "#ddd" },
            ].map((btn) => (
              <button
                key={String(btn.label)}
                onClick={btn.onClick}
                disabled={btn.disabled}
                style={{
                  padding: "8px 14px",
                  background: "var(--surface)",
                  color: btn.color,
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                  cursor: btn.disabled ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  opacity: btn.disabled ? 0.75 : 1,
                  transition: "opacity 0.15s, transform 0.15s",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div
          className="docpilot-chat-area"
          style={{ flex: 1, overflowY: "auto", padding: "32px 60px", background: "var(--bg-primary)" }}
        >
          {messages.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>Ask questions about your document...</p>
          )}

          {messages
            .slice()
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((msg, i) => (
              <div
                key={i}
                style={{ marginBottom: "28px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
              >
                {msg.role === "user" ? (
                  <div
                    className="docpilot-message-user text-wrap-safe"
                    style={{
                      background: "var(--surface)",
                      padding: "14px 20px",
                      borderRadius: "18px",
                      maxWidth: "65%",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      color: "var(--text-primary)",
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className="docpilot-message-assistant text-wrap-safe"
                    style={{ maxWidth: "80%", fontSize: "16px", lineHeight: 1.8, color: "var(--text-secondary)" }}
                  >
                    <div>{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: "16px", paddingLeft: "4px", fontSize: "12px", color: "#aaa" }}>
                        <p
                          style={{
                            margin: "0 0 6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontSize: "10px",
                            color: "#ccc",
                            fontWeight: "bold",
                          }}
                        >
                          Sources
                        </p>
                        {msg.sources.map((s, idx) => (
                          <div key={idx} style={{ color: "#bbb", marginBottom: "2px" }}>
                            📁 <span style={{ color: "#ddd" }}>{s.source || s.file_name}</span> ·{" "}
                            <span style={{ fontStyle: "italic" }}>Page {s.page || s.page_number}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div
          className="docpilot-input-bar"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
            background: "var(--surface)",
          }}
        >
          <div
            className="composer"
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "24px",
              padding: "16px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <input
                type="text"
                placeholder="Ask something..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askQuestion()}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: "18px",
                  outline: "none",
                  padding: "6px 4px",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

                {/* MODEL SELECTOR */}
                <CustomSelector
                  label={activeModelLabel}
                  sublabel="Active model"
                  open={showModels}
                  onToggle={() => setShowModels((v) => !v)}
                  selectorRef={modelSelectorRef}
                >
                  {models.length > 0 &&
                    models.map((model) => (
                      <SelectorItem
                        key={model.id}
                        label={model.label}
                        subtitle={model.subtitle}
                        active={selectedModel === model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModels(false);
                        }}
                      />
                    ))}
                </CustomSelector>

                {experimentMode && (
                  <>
                    {/* RETRIEVAL STRATEGY SELECTOR */}
                    <CustomSelector
                      label={activeRetrievalLabel}
                      sublabel="Retrieval Strategy"
                      open={showRetrieval}
                      onToggle={() => setShowRetrieval((v) => !v)}
                      selectorRef={retrievalSelectorRef}
                    >
                      {RETRIEVAL_STRATEGIES.map((strategy) => (
                        <SelectorItem
                          key={strategy.id}
                          label={strategy.label}
                          subtitle={strategy.subtitle}
                          active={retrievalStrategy === strategy.id}
                          onClick={() => {
                            setRetrievalStrategy(strategy.id);
                            setShowRetrieval(false);
                          }}
                        />
                      ))}
                    </CustomSelector>
                      {/* RERANKER SELECTOR */}
<CustomSelector
  label={activeRerankerLabel}
  sublabel="Reranker"
  open={showReranker}
  onToggle={() => setShowReranker((v) => !v)}
  selectorRef={rerankerSelectorRef}
>
  {RERANKER_OPTIONS.map((option) => (
    <SelectorItem
      key={option.id}
      label={option.label}
      subtitle={option.subtitle}
      active={reranker === option.id}
      onClick={() => {
        setReranker(option.id);
        setShowReranker(false);
      }}
    />
  ))}
</CustomSelector>
                    {/* ENHANCEMENTS MULTI-SELECT */}
                    <CustomSelector
                      label={activeEnhancementLabel}
                      sublabel="Enhancements"
                      open={showEnhancements}
                      onToggle={() => setShowEnhancements((v) => !v)}
                      selectorRef={enhancementSelectorRef}
                    >
                      {ENHANCEMENT_OPTIONS.map((opt) => (
                        <SelectorItem
                          key={opt.id}
                          label={opt.label}
                          subtitle={opt.subtitle}
                          active={isEnhancementActive(selectedEnhancements, opt.id)}
                          multiSelect
                          onClick={() => {
                            setSelectedEnhancements((prev) => toggleEnhancement(prev, opt.id));
                          }}
                        />
                      ))}
                    </CustomSelector>
                  </>
                )}
              </div>

              <button
                onClick={askQuestion}
                disabled={asking}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "999px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  cursor: asking ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {asking ? "⏳" : "➤"}
              </button>
            </div>
          </div>
        </div>
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
        borderRadius: "999px",
        display: "inline-block",
        animation: "pilot-spin 0.8s linear infinite",
      }}
    />
  );
}

function ButtonContent({ text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <Spinner />
      {text}
    </span>
  );
}

function LoadingOverlay({ text }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13, 13, 13, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ddd",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 18px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        }}
      >
        <Spinner /> {text}
      </div>
    </div>
  );
}

export default Dashboard;
