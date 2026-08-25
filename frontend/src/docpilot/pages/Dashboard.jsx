import { useState, useEffect, useRef, useMemo } from "react";
import { apiRequest } from "../api";
import { useDropzone } from "react-dropzone";
import MarkdownRenderer from "../components/MarkdownRenderer";
import GlossaryDrawer from "../../components/GlossaryDrawer";
import GlossaryButton from "../../components/GlossaryButton";
import { cleanDocName, formatPage } from "../../utils/formatUtils";


// ─────────────────────────────────────────────
// Shared custom popup selector (Google Pill Style)
// ─────────────────────────────────────────────
function CustomSelector({ label, sublabel, open, onToggle, selectorRef, children, badge = null }) {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
      }}
      ref={selectorRef}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          background: open ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
          border: open ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
          color: "var(--text-primary)",
          cursor: "pointer",
          padding: "6px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "500",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {badge && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "9999px",
              background: "rgba(99, 102, 241, 0.25)",
              color: "#c7d2fe",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
        <span style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.7 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            width: "min(320px, calc(100vw - 28px))",
            maxWidth: "calc(100vw - 28px)",
            maxHeight: "360px",
            overflowY: "auto",
            zIndex: 9999,
            borderRadius: "18px",
            background: "rgba(22, 27, 46, 0.95)",
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(24px)",
            padding: "8px",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      )}

      {sublabel && (
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "2px",
            textAlign: "center",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

function SelectorItem({ label, subtitle, active, onClick, multiSelect }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: "12px",
        cursor: "pointer",
        background: active ? "rgba(99, 102, 241, 0.18)" : "transparent",
        color: active ? "#ffffff" : "var(--text-secondary)",
        transition: "all 0.15s ease",
        marginBottom: "2px",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          {multiSelect && (
            <span
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "5px",
                border: active ? "none" : "1.5px solid rgba(255, 255, 255, 0.2)",
                background: active ? "#6366f1" : "transparent",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                color: "white",
                flexShrink: 0,
              }}
            >
              {active ? "✓" : ""}
            </span>
          )}
          <span
            style={{
              fontSize: "13px",
              fontWeight: active ? "600" : "400",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>

        {!multiSelect && active && (
          <span style={{ fontSize: "12px", color: "#818cf8", fontWeight: "bold" }}>✓</span>
        )}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "2px",
            paddingLeft: multiSelect ? "24px" : "0",
            lineHeight: 1.3,
            opacity: 0.8,
          }}
        >
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
    label: "FAISS Vector",
    subtitle: "Dense embeddings nearest-neighbor search",
  },
  {
    id: "BM25",
    label: "BM25 Keyword",
    subtitle: "Lexical inverted-index keyword matching",
  },
  {
    id: "Hybrid",
    label: "Hybrid (Dense + BM25)",
    subtitle: "Reciprocal Rank Fusion (RRF) ensemble",
  },
];

// ─────────────────────────────────────────────
// Reranker model selections
// ─────────────────────────────────────────────
const RERANKER_OPTIONS = [
  {
    id: "none",
    label: "None",
    subtitle: "Raw first-stage retrieval rankings",
  },
  {
    id: "minilm",
    label: "MiniLM Cross-Encoder",
    subtitle: "Fast balanced baseline reranker",
  },
  {
    id: "tinybert",
    label: "TinyBERT",
    subtitle: "Ultra-low latency lightweight reranker",
  },
  {
    id: "bge-large",
    label: "BGE Large Reranker",
    subtitle: "High precision semantic re-scoring",
  },
  {
    id: "bge-m3",
    label: "BGE M3",
    subtitle: "Multi-lingual retrieval reranker",
  },
];

// ─────────────────────────────────────────────
// Enhancements multi-select categorized config
// ─────────────────────────────────────────────
const ENHANCEMENT_CATEGORIES = [
  {
    category: "Context Preparation",
    items: [
      {
        id: "query_condensation",
        label: "Query Condensation",
        subtitle: "Convert conversational/follow-up query into a standalone question",
      },
      {
        id: "coreference_resolution",
        label: "Coreference Resolution",
        subtitle: "Resolve pronouns (it, they, that company) into explicit entity names",
      },
      {
        id: "query_rewrite",
        label: "Query Rewrite",
        subtitle: "Rewrite query into clearer retrieval-optimized search terms",
      },
    ],
  },
  {
    category: "Structuring & Routing",
    items: [
      {
        id: "sub_query_generation",
        label: "Sub-Query Generation",
        subtitle: "Break complex multi-part questions into independent sub-queries",
      },
      {
        id: "metadata_filter_extraction",
        label: "Metadata Filter Extraction",
        subtitle: "Extract structured filters (dates, authors, departments, categories)",
      },
      {
        id: "query_routing",
        label: "Query Routing",
        subtitle: "Determine appropriate retrieval index and domain route",
      },
    ],
  },
  {
    category: "Expansion & Transformation",
    items: [
      {
        id: "hyde",
        label: "HyDE",
        subtitle: "Generate hypothetical document and use its embedding for retrieval",
      },
      {
        id: "multi_query",
        label: "Multi-Query Expansion",
        subtitle: "Generate multiple semantic formulations and retrieve against each",
      },
      {
        id: "rag_fusion",
        label: "RAG-Fusion",
        subtitle: "Generate query variants, retrieve each, and combine with RRF",
      },
      {
        id: "step_back",
        label: "Step-Back Prompting",
        subtitle: "Generate broader conceptual query to retrieve foundational context",
      },
      {
        id: "keyword_expansion",
        label: "Query Keyword Expansion",
        subtitle: "Expand query with relevant domain terminology, synonyms, keywords",
      },
    ],
  },
];

const ALL_ENHANCEMENT_ITEMS = ENHANCEMENT_CATEGORIES.flatMap((c) => c.items);
const ALL_ENHANCEMENT_IDS = ALL_ENHANCEMENT_ITEMS.map((item) => item.id);

function getEnhancementLabel(id) {
  return ALL_ENHANCEMENT_ITEMS.find((item) => item.id === id)?.label || id;
}

function buildEnhancementLabel(selected) {
  if (!selected || selected.includes("Default") || selected.length === 0) return "Default (Baseline)";
  if (
    ALL_ENHANCEMENT_IDS.every((id) => selected.includes(id)) &&
    selected.length === ALL_ENHANCEMENT_IDS.length
  )
    return "All Enhancements (11)";
  if (selected.length === 1) return getEnhancementLabel(selected[0]);
  return `${selected.length} Enhancements`;
}

function toggleEnhancement(current, id) {

  if (id === "Default") return ["Default"];
  if (id === "All") return [...ALL_ENHANCEMENT_IDS];

  let next = current.filter((e) => e !== "Default");
  if (next.includes(id)) {
    next = next.filter((e) => e !== id);
  } else {
    next = [...next, id];
  }
  if (next.length === 0) return ["Default"];
  return next;
}

function removeEnhancementPill(current, id, e) {
  if (e) e.stopPropagation();
  const next = current.filter((item) => item !== id && item !== "Default");
  return next.length === 0 ? ["Default"] : next;
}

function isEnhancementActive(selected, id) {
  if (id === "Default") return selected.includes("Default") || selected.length === 0;
  if (id === "All")
    return (
      ALL_ENHANCEMENT_IDS.every((e) => selected.includes(e)) &&
      selected.length === ALL_ENHANCEMENT_IDS.length
    );
  return selected.includes(id);
}


// ─────────────────────────────────────────────
// Chunker config
// ─────────────────────────────────────────────
const CHUNKER_OPTIONS = [
  {
    id: "parent_child",
    label: "Parent-Child (1200 / 300)",
    subtitle: "Small child chunks for retrieval, large parent for context",
  },
  {
    id: "contextual",
    label: "Contextual Chunking",
    subtitle: "LLM-generated situating context prefix for every chunk",
  },
  {
    id: "structure_aware",
    label: "Structure-Aware",
    subtitle: "Hierarchical headers & syntax preservation (Markdown/HTML)",
  },
  {
    id: "recursive",
    label: "Recursive Character",
    subtitle: "Hierarchical splitting by paragraph, sentence, and word",
  },
  {
    id: "fixed",
    label: "Fixed Window (500c)",
    subtitle: "Uniform chunk length with standard 50c overlap",
  },
  {
    id: "token",
    label: "Token-Based (256t)",
    subtitle: "Exact tokenizer boundary alignment",
  },
  {
    id: "semantic",
    label: "Semantic Similarity",
    subtitle: "Splits text at natural cosine-similarity topic shifts",
  },
];

// ─────────────────────────────────────────────
// Embedding Model config
// ─────────────────────────────────────────────
const EMBEDDING_OPTIONS = [
  {
    id: "all-mpnet-base-v2",
    label: "all-mpnet-base-v2",
    subtitle: "Sentence Transformers · 768 dim",
  },
  {
    id: "all-MiniLM-L6-v2",
    label: "all-MiniLM-L6-v2",
    subtitle: "Sentence Transformers · 384 dim",
  },
  {
    id: "all-MiniLM-L12-v2",
    label: "all-MiniLM-L12-v2",
    subtitle: "Sentence Transformers · 384 dim",
  },
  {
    id: "bge-large-en-v1.5",
    label: "bge-large-en-v1.5",
    subtitle: "BAAI BGE Large · 1024 dim",
  },
  {
    id: "gte-large",
    label: "gte-large",
    subtitle: "Thenlper GTE Large · 1024 dim",
  },
  {
    id: "text-embedding-3-small",
    label: "text-embedding-3-small",
    subtitle: "OpenAI Embedding · 1536 dim",
  },
  {
    id: "text-embedding-3-large",
    label: "text-embedding-3-large",
    subtitle: "OpenAI Embedding · 3072 dim",
  },
];

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
function Dashboard({
  experimentMode,
  onLogout,
  onHome,
  onTracePilot,
  onGaugePilot,
  onToggleMode,
}) {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b");

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
  const [clearingSessions, setClearingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editPromptText, setEditPromptText] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");


  // Document-scoped retrieval state
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  const messagesEndRef = useRef(null);
  const modelSelectorRef = useRef(null);
  const retrievalSelectorRef = useRef(null);
  const rerankerSelectorRef = useRef(null);
  const enhancementSelectorRef = useRef(null);
  const documentSelectorRef = useRef(null);
  const chunkerSelectorRef = useRef(null);
  const embeddingSelectorRef = useRef(null);
  const questionTextareaRef = useRef(null);

  // Experiment toggles
  const [retrievalStrategy, setRetrievalStrategy] = useState("Hybrid");
  const [showRetrieval, setShowRetrieval] = useState(false);
  const [reranker, setReranker] = useState("none");
  const [showReranker, setShowReranker] = useState(false);
  const [selectedEnhancements, setSelectedEnhancements] = useState(["Default"]);
  const [showEnhancements, setShowEnhancements] = useState(false);
  const [selectedChunker, setSelectedChunker] = useState("parent_child");
  const [showChunkers, setShowChunkers] = useState(false);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState("all-mpnet-base-v2");
  const [showEmbeddings, setShowEmbeddings] = useState(false);

  const togglePopup = (popupName) => {
    setShowModels((curr) => (popupName === "models" ? !curr : false));
    setShowRetrieval((curr) => (popupName === "retrieval" ? !curr : false));
    setShowReranker((curr) => (popupName === "reranker" ? !curr : false));
    setShowEnhancements((curr) => (popupName === "enhancements" ? !curr : false));
    setShowDocuments((curr) => (popupName === "documents" ? !curr : false));
    setShowChunkers((curr) => (popupName === "chunkers" ? !curr : false));
    setShowEmbeddings((curr) => (popupName === "embeddings" ? !curr : false));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-expand question textarea as content grows
  useEffect(() => {
    if (questionTextareaRef.current) {
      questionTextareaRef.current.style.height = "auto";
      questionTextareaRef.current.style.height = `${Math.min(questionTextareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  // Close all popups on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !modelSelectorRef.current?.contains(event.target) &&
        !retrievalSelectorRef.current?.contains(event.target) &&
        !enhancementSelectorRef.current?.contains(event.target) &&
        !rerankerSelectorRef.current?.contains(event.target) &&
        !documentSelectorRef.current?.contains(event.target) &&
        !chunkerSelectorRef.current?.contains(event.target) &&
        !embeddingSelectorRef.current?.contains(event.target)
      ) {
        setShowModels(false);
        setShowRetrieval(false);
        setShowReranker(false);
        setShowEnhancements(false);
        setShowDocuments(false);
        setShowChunkers(false);
        setShowEmbeddings(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowModels(false);
        setShowRetrieval(false);
        setShowReranker(false);
        setShowEnhancements(false);
        setShowDocuments(false);
        setShowChunkers(false);
        setShowEmbeddings(false);
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
          apiRequest(
            `/history/sessions?mode=${
              experimentMode ? "experimental" : "production"
            }`
          ),
          apiRequest("/billing/me"),
        ]);
        setSessions(Array.isArray(sessionData) ? sessionData : []);
        setUsername(billingData?.username || "");

        // Always initialize a fresh new conversation by default on load / login
        setDocuments([]);
        setSelectedDocumentIds([]);
        setSource("");
        setMessages([]);
        setCurrentSessionId(null);
      } catch {
        // ignore
      } finally {
        setInitialLoading(false);
      }
    };
    loadDashboard();
  }, [experimentMode]);

  useEffect(() => {
    apiRequest("/models/")
      .then((data) => {
        if (Array.isArray(data)) {
          setModels(data);
          if (data.length > 0 && !selectedModel) setSelectedModel(data[0].id);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiRequest(
        `/history/sessions?mode=${
          experimentMode ? "experimental" : "production"
        }`
      );
      setSessions(Array.isArray(data) ? data : []);
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
      const [msgData, docData] = await Promise.all([
        apiRequest(`/history/${sessionId}`),
        apiRequest(`/docs/?session_id=${sessionId}`),
      ]);
      if (Array.isArray(msgData)) {
        setMessages(
          msgData.map((m) => ({
            role: m.role,
            content: m.content,
            sources: m.sources,
            timestamp: m.timestamp || m.created_at || new Date().toISOString(),
          }))
        );
      }
      if (Array.isArray(docData) && docData.length > 0) {
        const formatted = docData.map((d, index) => ({
          document_id: d.id ?? d.document_id ?? index,
          filename: cleanDocName(d.filename ?? d.name ?? `Document ${index + 1}`),
        }));
        setDocuments(formatted);
        setSelectedDocumentIds(formatted.map((d) => d.document_id));
        setSource(
          formatted.length === 1
            ? cleanDocName(formatted[0].filename)
            : `${formatted.length} documents`
        );
      } else {
        setDocuments([]);
        setSelectedDocumentIds([]);
        setSource("");
      }
      setCurrentSessionId(sessionId);
      setSidebarOpen(false);
    } finally {
      setLoadingSessionId(null);
    }
  };


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles(acceptedFiles);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [
        ".txt",
        ".md",
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".cpp",
        ".c",
        ".h",
        ".go",
        ".rs",
        ".json",
        ".yaml",
        ".yml",
        ".sql",
        ".css",
        ".html",
      ],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
  });

  const uploadFile = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const queryParams = new URLSearchParams();
      if (currentSessionId) queryParams.set("session_id", currentSessionId);
      if (selectedChunker) queryParams.set("chunker", selectedChunker);
      if (selectedEmbeddingModel) queryParams.set("embedding_model", selectedEmbeddingModel);

      const url = `/docs/upload${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const data = await apiRequest(url, "POST", formData);
      const uploaded = (data.uploaded || []).map((d) => ({
        ...d,
        filename: cleanDocName(d.filename),
      }));
      if (data.detail) {
        alert(data.detail);
      } else {
        setFiles([]);

        if (uploaded.length > 0) {
          setDocuments((prev) => {
            const existingIds = new Set(prev.map((d) => d.document_id));
            const newOnes = uploaded.filter((d) => !existingIds.has(d.document_id));
            const updated = [...prev, ...newOnes];
            setSource(
              updated.length === 1
                ? cleanDocName(updated[0].filename)
                : `${updated.length} documents`
            );
            return updated;
          });

          setSelectedDocumentIds((prev) => {
            const merged = new Set([...prev, ...uploaded.map((d) => d.document_id)]);
            return Array.from(merged);
          });
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.message || "Network error"));
    } finally {
      setUploading(false);
    }
  };


  const copyToClipboard = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const executeQuery = async (queryText, replaceFromIndex = null) => {
    const q = (queryText || "").trim();
    if (!q || asking) return;

    setEditingIndex(null);
    setQuestion("");

    setMessages((prev) => {
      let baseMessages = prev;
      if (replaceFromIndex !== null) {
        baseMessages = prev.slice(0, replaceFromIndex);
      }
      return [
        ...baseMessages,
        { role: "user", content: q, timestamp: new Date().toISOString() },
        { role: "assistant", content: "Thinking...", loading: true, timestamp: new Date().toISOString() },
      ];
    });

    setAsking(true);
    try {
      const payload = {
        question: q,
        session_id: currentSessionId,
        model_name: selectedModel,
        mode: experimentMode ? "experimental" : "production",
        document_ids:
          selectedDocumentIds && selectedDocumentIds.length > 0
            ? selectedDocumentIds
            : null,
      };

      if (experimentMode) {
        payload.retrieval_strategy = retrievalStrategy;
        payload.reranker = reranker;
        payload.enhancements = selectedEnhancements;
        payload.chunker = selectedChunker;
        payload.embedding_model = selectedEmbeddingModel;
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
          content: "I encountered an error connecting to the retrieval engine.",
          timestamp: new Date().toISOString(),
        };
        return u;
      });
    } finally {
      setAsking(false);
    }
  };

  const askQuestion = () => executeQuery(question);

  const handleEditSubmit = (index, newQuery) => {
    if (!newQuery || !newQuery.trim()) return;
    executeQuery(newQuery, index);
  };

  const handleTryAgain = (assistantIndex) => {
    let userQuery = "";
    let userIdx = -1;
    for (let j = assistantIndex - 1; j >= 0; j--) {
      if (messages[j]?.role === "user") {
        userQuery = messages[j].content;
        userIdx = j;
        break;
      }
    }
    if (userQuery && userIdx >= 0) {
      executeQuery(userQuery, userIdx);
    }
  };


  const deleteActiveDocument = async () => {
    if (deletingDoc) return;
    if (!window.confirm("Clear all documents and reset the active vector index?"))
      return;
    setDeletingDoc(true);
    try {
      await apiRequest("/docs/reset", "DELETE");
      setSource("");
      setFiles([]);
      setMessages([]);
      setCurrentSessionId(null);
      setDocuments([]);
      setSelectedDocumentIds([]);
      fetchSessions();
    } catch {
      alert("Failed to reset documents.");
    } finally {
      setDeletingDoc(false);
    }
  };

  const clearAllSessions = async () => {
    if (clearingSessions) return;
    const mode = experimentMode ? "experimental" : "production";
    if (!window.confirm(`Delete all ${mode} conversation histories?`)) return;
    setClearingSessions(true);
    try {
      await apiRequest(`/history/sessions/reset?mode=${mode}`, "DELETE");
      setMessages([]);
      setCurrentSessionId(null);
      await fetchSessions();
    } catch {
      alert("Failed to clear conversations.");
    } finally {
      setClearingSessions(false);
    }
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return sessions;
    const q = sessionSearch.toLowerCase();
    return sessions.filter((s) => (s.title || `Chat #${s.id}`).toLowerCase().includes(q));
  }, [sessions, sessionSearch]);

  const activeModelLabel =
    models.length === 0
      ? "Loading models..."
      : models.find((m) => m.id === selectedModel)?.label || selectedModel;

  const activeRetrievalLabel =
    RETRIEVAL_STRATEGIES.find((r) => r.id === retrievalStrategy)?.label || retrievalStrategy;
  const activeRerankerLabel =
    RERANKER_OPTIONS.find((r) => r.id === reranker)?.label || "None";
  const activeEnhancementLabel = buildEnhancementLabel(selectedEnhancements);
  const activeChunkerLabel =
    CHUNKER_OPTIONS.find((c) => c.id === selectedChunker)?.label || "Parent-Child";
  const activeEmbeddingLabel =
    EMBEDDING_OPTIONS.find((e) => e.id === selectedEmbeddingModel)?.label || "all-mpnet-base-v2";
  const activeDocumentsLabel =
    selectedDocumentIds.length === 0
      ? "No Docs Selected"
      : selectedDocumentIds.length === documents.length
      ? `All ${documents.length} Docs`
      : `${selectedDocumentIds.length} of ${documents.length} Docs`;

  const starterPrompts = [
    "Summarize the key takeaways and core concepts from the uploaded documents.",
    "Extract all action items, dates, and critical requirements from the text.",
    "Compare and contrast the primary findings across the knowledge base.",
  ];

  return (
    <div
      className="docpilot-root"
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      {(initialLoading || uploading) && (
        <LoadingOverlay text={uploading ? "Ingesting & indexing documents..." : "Loading DocPilot workspace..."} />
      )}

      {sidebarOpen && (
        <button
          className="mobile-drawer-backdrop"
          aria-label="Close conversations"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Google Gemini seamless left drawer) */}
      <aside
        className={`docpilot-sidebar ${sidebarOpen ? "is-open" : ""}`}
        style={{
          width: "280px",
          flexShrink: 0,
          background: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "16px 14px",
          gap: "14px",
          boxSizing: "border-box",
        }}
      >
        {/* BRAND & USER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 4px" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: "800",
                letterSpacing: "-0.7px",
                color: experimentMode ? "#c084fc" : "#60a5fa",
              }}
            >
              DocPilot
            </h1>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
              {username ? `@${username}` : "AI Workspace"}
            </span>
          </div>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "9999px",
              background: experimentMode ? "rgba(168, 85, 247, 0.15)" : "rgba(66, 133, 244, 0.12)",
              color: experimentMode ? "#c084fc" : "#60a5fa",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {experimentMode ? "Lab" : "Production"}
          </span>
        </div>


        {/* NEW CHAT PILL */}
        <button
          onClick={() => {
            setMessages([]);
            setCurrentSessionId(null);
            setDocuments([]);
            setSelectedDocumentIds([]);
            setSource("");
            setFiles([]);
            setSidebarOpen(false);
          }}

          style={{
            width: "100%",
            padding: "11px 16px",
            background: "rgba(255, 255, 255, 0.06)",
            color: "var(--text-primary)",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)")}
        >
          <span style={{ fontSize: "16px", color: experimentMode ? "#c084fc" : "#60a5fa" }}>+</span>
          <span>New Conversation</span>
        </button>

        {/* COMPACT UPLOAD DROPZONE */}
        <div
          {...getRootProps()}
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: isDragActive ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.18s ease",
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: "16px", marginBottom: "4px" }}>
            {isDragActive ? "📥" : "📄"}
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
            {isDragActive ? "Drop documents here" : "Upload source files"}
          </p>
          {files.length > 0 && (
            <p style={{ margin: "4px 0 0", color: "#818cf8", fontSize: "12px", fontWeight: 600 }}>
              {files.length} staged · click Upload below
            </p>
          )}
        </div>

        {files.length > 0 && (
          <button
            onClick={uploadFile}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "8px",
              background: experimentMode ? "#9333ea" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.15s ease",
            }}
          >
            {uploading ? <ButtonContent text="Ingesting..." /> : `Index ${files.length} Document${files.length !== 1 ? "s" : ""}`}
          </button>
        )}

        {/* CONVERSATION SESSIONS (Google Pill List) */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 8px 6px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Recent Chats
            </span>
            {sessions.length > 0 && (
              <button
                onClick={clearAllSessions}
                disabled={clearingSessions}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: clearingSessions ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  padding: 0,
                  opacity: 0.75,
                }}
              >
                {clearingSessions ? "Clearing..." : "Clear"}
              </button>
            )}
          </div>

          {sessions.length > 6 && (
            <input
              type="text"
              placeholder="Search..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "none",
                borderRadius: "9999px",
                color: "var(--text-primary)",
                fontSize: "12px",
                outline: "none",
                marginBottom: "4px",
                boxSizing: "border-box",
              }}
            />
          )}

          {loadingSessions && sessions.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "12px", padding: "12px", textAlign: "center" }}>
              <Spinner size={12} />
            </p>
          )}

          {!loadingSessions && filteredSessions.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "12px", padding: "16px 8px", textAlign: "center" }}>
              No chats yet.
            </p>
          )}

          {filteredSessions.map((session) => {
            const isSelected = currentSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "9999px",
                  background: isSelected ? "rgba(99, 102, 241, 0.18)" : "transparent",
                  color: isSelected ? "#ffffff" : "var(--text-secondary)",
                  cursor: loadingSessionId || deletingSessionId ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {session.title || `Chat #${session.id}`}
                </span>

                {deletingSessionId === session.id ? (
                  <Spinner size={11} />
                ) : (
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
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "12px",
                      padding: "0 0 0 6px",
                      opacity: 0.5,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* MAIN CHAT WORKSPACE */}
      <main
        className="docpilot-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg-primary)",
        }}
      >
        {/* TOPBAR (Seamless Google Pill Bar) */}
        <header
          className="docpilot-topbar"
          style={{
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open conversations"
              style={{
                color: "var(--text-primary)",
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                borderRadius: "9999px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              ☰
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px",
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "9999px",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: documents.length > 0 ? "#10b981" : "#64748b",
                }}
              />
              <span style={{ color: "var(--text-muted)" }}>Scope:</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {source || "No Documents Loaded"}
              </span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="docpilot-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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

            <a
              href={experimentMode ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot"}
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onTracePilot();
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
              TracePilot
            </a>

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
              href={experimentMode ? "/productionmode/docpilot" : "/experimentalmode/docpilot"}
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
              onClick={deleteActiveDocument}
              disabled={deletingDoc}
              title="Clear all uploaded documents and reset the active vector index"
              style={{
                padding: "6px 14px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "9999px",
                cursor: deletingDoc ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                opacity: deletingDoc ? 0.5 : 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!deletingDoc) {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!deletingDoc) {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                }
              }}
            >
              {deletingDoc ? "Clearing..." : "✕ Clear Vector Index"}
            </button>

            <button
              onClick={onLogout}
              style={{
                padding: "6px 12px",
                background: "transparent",
                color: "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* CHAT FEED */}
        <div
          className="docpilot-chat-area"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 32px 140px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "720px",
                margin: "0 auto",
                textAlign: "center",
                gap: "28px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "700",
                    letterSpacing: "-0.6px",
                    color: "#ffffff",
                    lineHeight: 1.3,
                  }}
                >
                  {experimentMode ? (
                    <span>
                      Experimental <span style={{ color: "#c084fc" }}>RAG Studio</span>
                    </span>
                  ) : (
                    <span>
                      How can I <span style={{ color: "#60a5fa" }}>assist you</span> today?
                    </span>
                  )}
                </h2>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#94a3b8",
                    fontSize: "15px",
                    lineHeight: 1.6,
                  }}
                >

                  {documents.length > 0
                    ? `Ready to query and synthesize across ${documents.length} indexed document${documents.length !== 1 ? "s" : ""}.`
                    : "Upload your PDFs, documents, or data files in the sidebar to begin searching and chatting."}
                </p>
              </div>

              {documents.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", width: "100%" }}>
                  {starterPrompts.map((promptText, i) => (
                    <div
                      key={i}
                      onClick={() => setQuestion(promptText)}
                      style={{
                        padding: "16px",
                        borderRadius: "18px",
                        background: "rgba(255, 255, 255, 0.03)",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        textAlign: "left",
                        lineHeight: 1.5,
                        transition: "all 0.18s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {promptText}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto" }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "28px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "user" ? (
                    editingIndex === i ? (
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "85%",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: experimentMode
                            ? "1px solid rgba(168, 85, 247, 0.3)"
                            : "1px solid rgba(96, 165, 250, 0.3)",
                          borderRadius: "20px",
                          padding: "14px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        <textarea
                          value={editPromptText}
                          onChange={(e) => setEditPromptText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleEditSubmit(i, editPromptText);
                            }
                          }}
                          rows={Math.min(6, Math.max(2, editPromptText.split("\n").length))}
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            color: "var(--text-primary)",
                            fontSize: "15px",
                            lineHeight: 1.6,
                            resize: "vertical",
                            fontFamily: "inherit",
                            boxSizing: "border-box",
                          }}
                          autoFocus
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            onClick={() => setEditingIndex(null)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "9999px",
                              background: "rgba(255, 255, 255, 0.06)",
                              color: "var(--text-secondary)",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 500,
                              transition: "all 0.15s ease",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditSubmit(i, editPromptText)}
                            disabled={!editPromptText.trim() || asking}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "9999px",
                              background: experimentMode
                                ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                              color: "#ffffff",
                              border: "none",
                              cursor: !editPromptText.trim() || asking ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              opacity: !editPromptText.trim() || asking ? 0.5 : 1,
                              transition: "all 0.15s ease",
                            }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", maxWidth: "80%" }}>
                        <div
                          style={{
                            background: experimentMode
                              ? "linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.35))"
                              : "linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(29, 78, 216, 0.45))",
                            padding: "12px 18px",
                            borderRadius: "20px 20px 4px 20px",
                            fontSize: "15px",
                            lineHeight: 1.6,
                            color: "#ffffff",
                            wordBreak: "break-word",
                            border: experimentMode
                              ? "1px solid rgba(168, 85, 247, 0.2)"
                              : "1px solid rgba(59, 130, 246, 0.2)",
                          }}
                        >
                          {msg.content}
                        </div>

                        {/* User action bar: Copy & Edit */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            paddingTop: "2px",
                          }}
                        >
                          <button
                            onClick={() => copyToClipboard(msg.content, `user-${i}`)}
                            title="Copy message"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            {copiedIndex === `user-${i}` ? (
                              <>
                                <span style={{ color: "#22c55e", fontWeight: 600 }}>✓</span>
                                <span style={{ color: "#22c55e" }}>Copied</span>
                              </>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setEditingIndex(i);
                              setEditPromptText(msg.content);
                            }}
                            title="Edit query"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        fontSize: "15px",
                        lineHeight: 1.75,
                        color: "var(--text-primary)",
                      }}
                    >
                      {msg.loading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", padding: "12px 0" }}>
                          <Spinner size={14} />
                          <span>Synthesizing answer...</span>
                        </div>
                      ) : (
                        <div>
                          <MarkdownRenderer content={msg.content} experimentMode={experimentMode} />


                          {/* Sources citation pills */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div style={{ marginTop: "14px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {msg.sources.map((s, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "4px 12px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "9999px",
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  📄 {cleanDocName(s.source || s.file_name || s.document_name || "Document")}{" "}
                                  {(s.page || s.page_number) != null && (
                                    <span style={{ opacity: 0.8 }}>· {formatPage(s.page || s.page_number)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Assistant Action Bar: Copy & Try Again */}
                          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => copyToClipboard(msg.content, `assistant-${i}`)}
                              title="Copy response"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "12px",
                                padding: "4px 9px",
                                borderRadius: "8px",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                e.currentTarget.style.color = "var(--text-primary)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                e.currentTarget.style.color = "var(--text-muted)";
                              }}
                            >
                              {copiedIndex === `assistant-${i}` ? (
                                <>
                                  <span style={{ color: "#22c55e", fontWeight: 600 }}>✓</span>
                                  <span style={{ color: "#22c55e" }}>Copied</span>
                                </>
                              ) : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleTryAgain(i)}
                              disabled={asking}
                              title="Try again (Regenerate answer)"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: asking ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                padding: "4px 9px",
                                borderRadius: "8px",
                                opacity: asking ? 0.5 : 1,
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!asking) {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                  e.currentTarget.style.color = "var(--text-primary)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                e.currentTarget.style.color = "var(--text-muted)";
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                              </svg>
                              <span>Try again</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* COMPOSER CAPSULE (Google Gemini flagship bar) */}
        <div
          style={{
            padding: "0 24px 20px",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              borderRadius: "28px",
              background: "rgba(255, 255, 255, 0.05)",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(20px)",
              padding: "12px 18px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >

            {/* Input textarea */}
            <textarea
              ref={questionTextareaRef}
              rows={1}
              placeholder="Ask anything about your documents..."
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              style={{
                width: "100%",
                minHeight: "24px",
                maxHeight: "180px",
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "15px",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                boxSizing: "border-box",
                overflowY: question.split("\n").length > 4 || question.length > 200 ? "auto" : "hidden",
                transition: "height 0.1s ease",
              }}
            />

            {/* Bottom action pills */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                  flex: 1,
                }}
              >
                {/* MODEL SELECTOR */}
                <CustomSelector
                  label={activeModelLabel}
                  sublabel="Model"
                  open={showModels}
                  onToggle={() => togglePopup("models")}
                  selectorRef={modelSelectorRef}
                >
                  <p style={{ margin: "4px 8px 8px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Select LLM Provider
                  </p>
                  {models.map((model) => (
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

                {/* DOCUMENTS SELECTOR */}
                <CustomSelector
                  label={activeDocumentsLabel}
                  sublabel="Docs"
                  badge={`${selectedDocumentIds.length}`}
                  open={showDocuments}
                  onToggle={() => togglePopup("documents")}
                  selectorRef={documentSelectorRef}
                >
                  <div style={{ display: "flex", padding: "4px", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDocumentIds(documents.map((d) => d.document_id))}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#c7d2fe",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDocumentIds([])}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "none",
                        borderRadius: "8px",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Clear All
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                      No documents ingested yet
                    </div>
                  ) : (
                    <div style={{ maxHeight: "220px", overflowY: "auto", padding: "4px" }}>
                      {documents.map((doc) => (
                        <SelectorItem
                          key={doc.document_id}
                          label={doc.filename}
                          active={selectedDocumentIds.includes(doc.document_id)}
                          multiSelect
                          onClick={() => {
                            setSelectedDocumentIds((prev) =>
                              prev.includes(doc.document_id)
                                ? prev.filter((id) => id !== doc.document_id)
                                : [...prev, doc.document_id]
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CustomSelector>

                {/* EXPERIMENTAL PIPELINE SELECTORS */}
                {experimentMode && (
                  <>
                    <CustomSelector
                      label={activeChunkerLabel}
                      sublabel="Chunker"
                      open={showChunkers}
                      onToggle={() => togglePopup("chunkers")}
                      selectorRef={chunkerSelectorRef}
                    >
                      <p style={{ margin: "4px 8px 8px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Chunking Strategy
                      </p>
                      {CHUNKER_OPTIONS.map((opt) => (
                        <SelectorItem
                          key={opt.id}
                          label={opt.label}
                          subtitle={opt.subtitle}
                          active={selectedChunker === opt.id}
                          onClick={() => {
                            setSelectedChunker(opt.id);
                            setShowChunkers(false);
                          }}
                        />
                      ))}
                    </CustomSelector>

                    <CustomSelector
                      label={activeEmbeddingLabel}
                      sublabel="Embedding"
                      open={showEmbeddings}
                      onToggle={() => togglePopup("embeddings")}
                      selectorRef={embeddingSelectorRef}
                    >
                      <p style={{ margin: "4px 8px 8px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Embedding Vector Model
                      </p>
                      {EMBEDDING_OPTIONS.map((opt) => (
                        <SelectorItem
                          key={opt.id}
                          label={opt.label}
                          subtitle={opt.subtitle}
                          active={selectedEmbeddingModel === opt.id}
                          onClick={() => {
                            setSelectedEmbeddingModel(opt.id);
                            setShowEmbeddings(false);
                          }}
                        />
                      ))}
                    </CustomSelector>

                    <CustomSelector
                      label={activeRetrievalLabel}
                      sublabel="Retriever"
                      open={showRetrieval}
                      onToggle={() => togglePopup("retrieval")}
                      selectorRef={retrievalSelectorRef}
                    >
                      <p style={{ margin: "4px 8px 8px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Retrieval Technique
                      </p>
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

                    <CustomSelector
                      label={activeRerankerLabel}
                      sublabel="Reranker"
                      open={showReranker}
                      onToggle={() => togglePopup("reranker")}
                      selectorRef={rerankerSelectorRef}
                    >
                      <p style={{ margin: "4px 8px 8px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Cross-Encoder Reranker
                      </p>
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

                    {/* MULTI-SELECT QUERY ENHANCEMENTS SELECTOR */}
                    <div ref={enhancementSelectorRef} style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        onClick={() => togglePopup("enhancements")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "9999px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: showEnhancements ? "1px solid rgba(168, 85, 247, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                          color: "var(--text-primary)",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                          backdropFilter: "blur(8px)",
                          maxWidth: "320px",
                          overflowX: "hidden",
                        }}
                      >
                        {selectedEnhancements.includes("Default") || selectedEnhancements.length === 0 ? (
                          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Default (Baseline)</span>
                        ) : ALL_ENHANCEMENT_IDS.every((id) => selectedEnhancements.includes(id)) && selectedEnhancements.length === ALL_ENHANCEMENT_IDS.length ? (
                          <span style={{ color: "#c084fc", fontWeight: 700 }}>All Enhancements (11)</span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "nowrap", overflow: "hidden" }}>
                            {selectedEnhancements.filter((e) => e !== "Default").slice(0, 2).map((id) => (
                              <span
                                key={id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  padding: "2px 8px",
                                  borderRadius: "9999px",
                                  background: "rgba(168, 85, 247, 0.2)",
                                  color: "#c084fc",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {getEnhancementLabel(id)}
                                <span
                                  onClick={(e) => setSelectedEnhancements((prev) => removeEnhancementPill(prev, id, e))}
                                  style={{ cursor: "pointer", opacity: 0.7, fontSize: "12px", marginLeft: "2px" }}
                                >
                                  ✕
                                </span>
                              </span>
                            ))}
                            {selectedEnhancements.filter((e) => e !== "Default").length > 2 && (
                              <span
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: "9999px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  color: "var(--text-muted)",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}
                              >
                                +{selectedEnhancements.filter((e) => e !== "Default").length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        <span style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.7, marginLeft: "auto" }}>
                          {showEnhancements ? "▲" : "▼"}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          textAlign: "center",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          opacity: 0.8,
                        }}
                      >
                        Query Enhancements
                      </span>

                      {showEnhancements && (
                        <div
                          style={{
                          position: "absolute",
                          bottom: "calc(100% + 8px)",
                          left: 0,
                          width: "min(340px, calc(100vw - 32px))",
                          maxWidth: "calc(100vw - 32px)",
                          maxHeight: "440px",
                          overflowY: "auto",
                          zIndex: 9999,
                          borderRadius: "18px",
                          background: "rgba(22, 27, 46, 0.96)",
                          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                          backdropFilter: "blur(24px)",
                          padding: "12px",
                          boxSizing: "border-box",
                        }}
                      >
                        {/* PRESETS BAR */}
                        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedEnhancements(["Default"])}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              borderRadius: "9999px",
                              border: "none",
                              background: selectedEnhancements.includes("Default") || selectedEnhancements.length === 0 ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.04)",
                              color: selectedEnhancements.includes("Default") ? "#ffffff" : "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Default (Baseline)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedEnhancements([...ALL_ENHANCEMENT_IDS])}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              borderRadius: "9999px",
                              border: "none",
                              background: ALL_ENHANCEMENT_IDS.every((e) => selectedEnhancements.includes(e)) && selectedEnhancements.length === ALL_ENHANCEMENT_IDS.length ? "rgba(168, 85, 247, 0.25)" : "rgba(255, 255, 255, 0.04)",
                              color: ALL_ENHANCEMENT_IDS.every((e) => selectedEnhancements.includes(e)) ? "#c084fc" : "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            All Enhancements (11)
                          </button>
                        </div>

                        {/* CATEGORIZED TECHNIQUES */}
                        {ENHANCEMENT_CATEGORIES.map((cat) => (
                          <div key={cat.category} style={{ marginBottom: "12px" }}>
                            <p style={{ margin: "2px 8px 6px", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                              {cat.category}
                            </p>
                            {cat.items.map((opt) => (
                              <SelectorItem
                                key={opt.id}
                                label={opt.label}
                                subtitle={opt.subtitle}
                                active={isEnhancementActive(selectedEnhancements, opt.id)}
                                multiSelect
                                onClick={() => setSelectedEnhancements((prev) => toggleEnhancement(prev, opt.id))}
                              />
                            ))}
                          </div>
                        ))}

                        {/* LATENCY ADVISORY & RESET FOOTER */}
                        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {selectedEnhancements.filter((e) => e !== "Default").length > 2 && (
                            <div
                              title="Multiple query enhancements may increase latency and token usage."
                              style={{
                                padding: "6px 10px",
                                borderRadius: "10px",
                                background: "rgba(245, 158, 11, 0.12)",
                                color: "#fbbf24",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span>⚡</span>
                              <span>Multiple enhancements may increase latency &amp; tokens</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedEnhancements(["Default"])}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "12px",
                              textAlign: "center",
                              padding: "4px",
                            }}
                          >
                            Reset to Baseline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  </>
                )}
              </div>

              {/* CIRCULAR SEND BUTTON */}
              <button
                type="button"
                onClick={askQuestion}
                disabled={asking || !question.trim()}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: question.trim()
                    ? experimentMode
                      ? "#a855f7"
                      : "#3b82f6"
                    : "rgba(255, 255, 255, 0.08)",
                  color: question.trim() ? "white" : "var(--text-muted)",
                  cursor: asking || !question.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  flexShrink: 0,
                  boxShadow: question.trim()
                    ? `0 4px 14px ${experimentMode ? "rgba(168, 85, 247, 0.4)" : "rgba(59, 130, 246, 0.4)"}`
                    : "none",
                  transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {asking ? <Spinner size={13} /> : "➤"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* CONTEXT-AWARE GLOSSARY DRAWER */}
      <GlossaryDrawer
        isOpen={showGlossary}
        onClose={() => setShowGlossary(false)}
        page="docpilot"
        mode={experimentMode ? "exp" : "prod"}
      />
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

function ButtonContent({ text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <Spinner size={12} />
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
        background: "rgba(8, 12, 24, 0.8)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        gap: "14px",
      }}
    >
      <Spinner size={32} />
      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
        {text}
      </p>
    </div>
  );
}

export default Dashboard;