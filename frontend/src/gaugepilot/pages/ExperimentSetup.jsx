import { useState, useRef, useEffect } from "react";
import { useBenchmark } from "../hooks/useBenchmark";
import { getModels } from "../api";
import Leaderboards from "./Leaderboards";
import Visualizations from "./Visualizations";
import ExperimentSelector from "../components/ExperimentSelector";
import { CustomSelector, SelectorItem } from "../components/CustomSelector";
import LoadingOverlay from "../../components/LoadingOverlay";


const DEFAULT_MODEL_OPTIONS = [
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B", description: "High-intelligence frontier model" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B", description: "Ultra-fast & efficient RAG engine" },
  { value: "qwen/qwen3.6-27b", label: "Qwen 3.6 27B", description: "High-precision reasoning & vision" },
  { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 70B", description: "Advanced chain-of-thought reasoning" },
];



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
        subtitle: "Resolve pronouns (it, they, that company) into explicit entities",
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
  return selected.filter((e) => e !== "Default").map(getEnhancementLabel).join(", ");
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


export default function ExperimentSetup({ onRunChange }) {
  const [modelOptions, setModelOptions] = useState(DEFAULT_MODEL_OPTIONS);
  const [model, setModel] = useState("openai/gpt-oss-120b");
  const [retrievalMethod, setRetrievalMethod] = useState("Hybrid");
  const [reranker, setReranker] = useState("minilm");
  const [chunker, setChunker] = useState("parent_child");
  const [embeddingModel, setEmbeddingModel] = useState("all-mpnet-base-v2");
  const [selectedEnhancements, setSelectedEnhancements] = useState(["Default"]);
  const [showEnhancements, setShowEnhancements] = useState(false);

  const [questions, setQuestions] = useState(
    "What are the main advantages of this approach?\nHow does the system handle edge cases and failure modes?\nWhat is the expected latency and throughput tradeoff?"
  );

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [allRuns, setAllRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringRun, setIsHoveringRun] = useState(false);

  const fileInputRef = useRef(null);
  const enhancementRef = useRef(null);

  const {
    loading,
    error,
    results,
    benchmarkRuns,
    bestScore,
    startBenchmark,
  } = useBenchmark();

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDocuments();
    fetchRuns();
    getModels(token)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModelOptions(
            data.map((m) => ({
              value: m.id || m.value,
              label: m.label,
              description: m.subtitle || m.description || "",
            }))
          );
        }
      })
      .catch(console.error);
  }, []);


  const fetchDocuments = async () => {
    try {
      const { getDocuments } = await import("../api");
      const docs = await getDocuments(token);
      const formatted = (docs || []).map((d, index) => ({
        id: d.id ?? d.document_id ?? index,
        filename: d.filename ?? d.name ?? `Document ${index + 1}`,
      }));
      setDocuments(formatted);
      setSelectedDocIds(formatted.map((d) => d.id));
    } catch {
      // ignore
    }
  };

  const fetchRuns = async () => {
    try {
      const { getBenchmarkRuns } = await import("../api");
      const runs = await getBenchmarkRuns(token);
      const sorted = (runs || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setAllRuns(sorted);
      if (sorted.length > 0) {
        setSelectedRun(sorted[0]);
        onRunChange?.(sorted[0]);
      }
    } catch {
      // ignore
    }
  };

  const handleFilesChange = async (files) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    setUploadedFiles(fileArr);
    setUploading(true);
    try {
      const { uploadDocument } = await import("../api");
      for (const file of fileArr) {
        await uploadDocument(file, token);
      }
      await fetchDocuments();
      setUploadedFiles([]);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesChange(e.dataTransfer.files);
  };

  const handleSelectRun = async (runId) => {
    if (!runId) return;
    const found = allRuns.find((r) => String(r.id) === String(runId));
    if (found) {
      setSelectedRun(found);
      onRunChange?.(found);
      try {
        const { getBenchmarkRunDetail } = await import("../api");
        const detail = await getBenchmarkRunDetail(runId, token);
        if (detail?.leaderboard) setSelectedLeaderboard(detail.leaderboard);
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteRun = async () => {
    if (!selectedRun) return;
    if (!window.confirm(`Delete benchmark run "${selectedRun.name}"?`)) return;
    try {
      const { deleteBenchmarkRun } = await import("../api");
      await deleteBenchmarkRun(selectedRun.id, token);
      setSelectedRun(null);
      setSelectedLeaderboard(null);
      await fetchRuns();
    } catch {
      alert("Failed to delete run.");
    }
  };

  const handleResetRuns = async () => {
    if (!window.confirm("Delete ALL benchmark runs permanently?")) return;
    try {
      const { resetBenchmarkRuns } = await import("../api");
      await resetBenchmarkRuns(token);
      setSelectedRun(null);
      setSelectedLeaderboard(null);
      await fetchRuns();
    } catch {
      alert("Failed to reset runs.");
    }
  };

  const handleResetDocuments = async () => {
    if (!window.confirm("Clear all uploaded documents and reset the index?")) return;
    try {
      const { resetDocuments } = await import("../api");
      await resetDocuments(token);
      setDocuments([]);
      setSelectedDocIds([]);
    } catch {
      alert("Failed to reset documents.");
    }
  };

  const questionList = questions
    .split("\n")
    .map((q) => q.trim())
    .filter(Boolean);

  const canRun = questionList.length > 0 && !loading;

  const handleRun = async () => {
    if (!canRun) return;
    try {
      const result = await startBenchmark({
        model,
        retrievalMethod,
        reranker,
        chunker,
        embeddingModel,
        enhancements: selectedEnhancements,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : null,
        questions: questionList,
      });

      if (result) {
        await fetchRuns();
        if (result.leaderboard) setSelectedLeaderboard(result.leaderboard);
      }
    } catch {
      // error handled in useBenchmark hook
    }
  };

  const labelMap = {
    "openai/gpt-oss-120b": "GPT-OSS 120B",
    "openai/gpt-oss-20b": "GPT-OSS 20B",
    "qwen/qwen3.6-27b": "Qwen 3.6 27B",
    "deepseek-r1-distill-llama-70b": "DeepSeek R1 70B",

    parent_child: "Parent-Child",
    recursive: "Recursive",
    fixed: "Fixed Character",
    token: "Token-Based",
    semantic: "Semantic",
    Hybrid: "Hybrid (Dense + BM25)",
    FAISS: "FAISS Vector",
    BM25: "BM25 Keyword",
    minilm: "MiniLM Cross-Encoder",
    tinybert: "TinyBERT",
    "bge-large": "BGE Large",
    "bge-m3": "BGE M3",
    none: "None",
  };


  const quickPromptTemplates = [
    { label: "+ Summary", text: "Summarize the core arguments and evidence in the uploaded documents." },
    { label: "+ Factual Accuracy", text: "Extract all key numeric metrics, dates, and quantitative claims." },
    { label: "+ Comparative", text: "Compare and contrast the primary findings across the knowledge base." },
  ];

  const displayedLeaderboard =
    selectedLeaderboard ||
    results?.leaderboard || {
      overall: [],
      faithfulness: [],
      grounding: [],
      retrieval_quality: [],
      query_coverage: [],
      latency: [],
    };

  return (
    <div
      id="experiment-setup"

      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "clamp(16px, 3vw, 32px) clamp(14px, 3vw, 28px) 80px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {loading && (
        <LoadingOverlay text="Evaluating benchmark experiment & AI matrix..." />
      )}
      {uploading && (
        <LoadingOverlay text="Ingesting & indexing benchmark documents..." />
      )}

      {/* ── Page Header (Google Cloud Vertex Evaluation Studio) ── */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: "800",
                letterSpacing: "-0.8px",
                color: "#c084fc",
              }}
            >
              GaugePilot Benchmark Studio
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            Configure retrieval pipelines, evaluate faithfulness, and compare multi-model leaderboards.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "9999px",
            background: results ? "rgba(16, 185, 129, 0.15)" : "rgba(168, 85, 247, 0.15)",
            color: results ? "#34d399" : "#c084fc",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: results ? "#10b981" : "#a855f7",
              boxShadow: `0 0 8px ${results ? "#10b981" : "#a855f7"}`,
            }}
          />
          {loading ? "Evaluating Pipelines..." : results ? "Benchmark Complete" : "Engine Ready"}
        </div>
      </div>

      {/* ── Telemetry KPI Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <KpiTile label="Questions Added" value={questionList.length} sub="Active prompt list" icon="❓" color="#a855f7" />
        <KpiTile label="Uploaded Files" value={documents.length} sub="Indexed source docs" icon="📄" color="#38bdf8" />
        <KpiTile label="Benchmark Runs" value={benchmarkRuns} sub="Historical evaluations" icon="🚀" color="#10b981" />
        <KpiTile
          label="Best Score"
          value={bestScore != null && !Number.isNaN(Number(bestScore)) ? Number(bestScore).toFixed(2) : "—"}
          sub="Highest overall score"
          icon="🏆"
          color="#f59e0b"
        />
      </div>

      {/* ── Benchmark History & Actions Bar ── */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "20px",
          padding: "18px 24px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 320px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", flexShrink: 0 }}>
            Run History:
          </span>

          {allRuns.length === 0 ? (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              No historical runs recorded yet.
            </span>
          ) : (
            <select
              value={selectedRun?.id ?? ""}
              onChange={(e) => handleSelectRun(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {allRuns.map((run) => (
                <option key={run.id} value={run.id} style={{ background: "#111827", color: "white" }}>
                  {run.name} ({new Date(run.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}

          {selectedRun && (
            <button
              onClick={handleDeleteRun}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#fca5a5",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              ✕ Delete Run
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {allRuns.length > 0 && (
            <button
              onClick={handleResetRuns}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 500,
              }}
            >
              Clear All Runs
            </button>
          )}

          {documents.length > 0 && (
            <button
              onClick={handleResetDocuments}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              ✕ Clear Vector Index
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline Configuration Capsule (Google Pill Grid) ── */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "24px",
          padding: "22px 24px",
          marginBottom: "20px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            marginBottom: "14px",
          }}
        >
          Pipeline Architecture Parameters
        </span>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <ExperimentSelector
            label="Model"
            value={model}
            onChange={setModel}
            options={modelOptions}
          />


          <ExperimentSelector
            label="Chunker"
            value={chunker}
            onChange={setChunker}
            options={[
              { value: "parent_child", label: "Parent-Child (1200/300)", description: "Hierarchical parent-child chunking" },
              { value: "recursive", label: "Recursive Splitter", description: "LangChain recursive token splitter" },
              { value: "fixed", label: "Fixed Window (500c)", description: "Uniform fixed length character blocks" },
              { value: "token", label: "Token-Based (256t)", description: "Tokenizer boundary alignment" },
              { value: "semantic", label: "Semantic Boundary", description: "Cosine similarity topic transitions" },
            ]}
          />

          <ExperimentSelector
            label="Embedding"
            value={embeddingModel}
            onChange={setEmbeddingModel}
            options={[
              { value: "all-mpnet-base-v2", label: "all-mpnet-base-v2", description: "Sentence Transformers · 768 dim" },
              { value: "all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2", description: "Sentence Transformers · 384 dim" },
              { value: "all-MiniLM-L12-v2", label: "all-MiniLM-L12-v2", description: "Sentence Transformers · 384 dim" },
              { value: "bge-large-en-v1.5", label: "bge-large-en-v1.5", description: "BAAI BGE Large v1.5 · 1024 dim" },
              { value: "gte-large", label: "gte-large", description: "Thenlper GTE Large · 1024 dim" },
              { value: "text-embedding-3-small", label: "text-embedding-3-small", description: "OpenAI Embedding · 1536 dim" },
              { value: "text-embedding-3-large", label: "text-embedding-3-large", description: "OpenAI Embedding · 3072 dim" },
            ]}
          />

          <ExperimentSelector
            label="Retriever"
            value={retrievalMethod}
            onChange={setRetrievalMethod}
            options={[
              { value: "Hybrid", label: "Hybrid (Dense + BM25)", description: "Reciprocal rank fusion (RRF)" },
              { value: "FAISS", label: "FAISS Vector", description: "Dense semantic nearest neighbor" },
              { value: "BM25", label: "BM25 Keyword", description: "Sparse inverted-index search" },
            ]}
          />

          <ExperimentSelector
            label="Reranker"
            value={reranker}
            onChange={setReranker}
            options={[
              { value: "minilm", label: "MiniLM Cross-Encoder", description: "Balanced precision reranker" },
              { value: "none", label: "None (Raw First-Stage)", description: "Disable second-stage cross-encoder" },
              { value: "tinybert", label: "TinyBERT", description: "Lightweight ultra-low latency" },
              { value: "bge-large", label: "BGE Large Reranker", description: "Deep semantic re-scoring" },
              { value: "bge-m3", label: "BGE M3", description: "Multi-lingual retrieval reranker" },
            ]}
          />

          {/* MULTI-SELECT QUERY ENHANCEMENTS SELECTOR */}
          <div ref={enhancementRef} style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <div
              onClick={() => setShowEnhancements((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.05)",
                border: showEnhancements ? "1px solid rgba(168, 85, 247, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                backdropFilter: "blur(8px)",
                maxWidth: "340px",
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
                        padding: "1px 7px",
                        borderRadius: "9999px",
                        background: "rgba(168, 85, 247, 0.2)",
                        color: "#c084fc",
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getEnhancementLabel(id)}
                      <span
                        onClick={(e) => setSelectedEnhancements((prev) => removeEnhancementPill(prev, id, e))}
                        style={{ cursor: "pointer", opacity: 0.7, fontSize: "10px", marginLeft: "2px" }}
                      >
                        ✕
                      </span>
                    </span>
                  ))}
                  {selectedEnhancements.filter((e) => e !== "Default").length > 2 && (
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "9999px",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "var(--text-muted)",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      +{selectedEnhancements.filter((e) => e !== "Default").length - 2}
                    </span>
                  )}
                </div>
              )}

              <span style={{ fontSize: "9px", color: "var(--text-muted)", opacity: 0.7, marginLeft: "auto" }}>
                {showEnhancements ? "▲" : "▼"}
              </span>
            </div>

            <span
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                marginTop: "2px",
                textAlign: "center",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Enhance
            </span>

            {showEnhancements && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
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
                      fontSize: "11px",
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
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    All Enhancements (11)
                  </button>
                </div>

                {/* CATEGORIZED TECHNIQUES */}
                {ENHANCEMENT_CATEGORIES.map((cat) => (
                  <div key={cat.category} style={{ marginBottom: "12px" }}>
                    <p style={{ margin: "2px 8px 6px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
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
                        fontSize: "11px",
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
                      fontSize: "11px",
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

        </div>
      </div>

      {/* ── Main Setup Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "20px",
          alignItems: "stretch",
          marginBottom: "24px",
        }}
      >
        {/* Left Column: Source Document Upload & Scope */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Upload Drop Capsule */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              borderRadius: "24px",
              minHeight: "180px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: "pointer",
              background: isDragging
                ? "rgba(168, 85, 247, 0.15)"
                : documents.length > 0
                ? "rgba(16, 185, 129, 0.06)"
                : "rgba(255, 255, 255, 0.03)",
              boxShadow: isDragging ? "0 0 32px rgba(168, 85, 247, 0.3)" : "none",
              transition: "all 0.2s ease",
              textAlign: "center",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFilesChange(e.target.files)}
            />

            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: documents.length > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(168, 85, 247, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              {uploading ? "⏳" : documents.length > 0 ? "✅" : "📁"}
            </div>

            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                {uploading
                  ? "Indexing documents into vector store..."
                  : documents.length > 0
                  ? `${documents.length} Document${documents.length !== 1 ? "s" : ""} Loaded`
                  : "Upload Knowledge Base"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Click or drag &amp; drop PDFs, DOCX, MD, or TXT
              </p>
            </div>
          </div>

          {/* Active Knowledge Scope Selector */}
          {documents.length > 0 && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Active Scope ({selectedDocIds.length}/{documents.length})
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setSelectedDocIds(documents.map((d) => d.id))}
                    style={{ background: "transparent", border: "none", color: "#c084fc", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <button
                    onClick={() => setSelectedDocIds([])}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "110px", overflowY: "auto" }}>
                {documents.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() =>
                        setSelectedDocIds((prev) =>
                          prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                        )
                      }
                      style={{
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        background: isSelected ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.04)",
                        color: isSelected ? "#ffffff" : "var(--text-secondary)",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: isSelected ? 600 : 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>{isSelected ? "✓" : "+"}</span>
                      <span>{doc.filename}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Run Configuration Pill Grid */}
          <div style={{ background: "rgba(0, 0, 0, 0.25)", borderRadius: "20px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "10px" }}>
              Active Configuration
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              <SummaryItem label="Model" value={labelMap[model] ?? model} />
              <SummaryItem label="Chunker" value={labelMap[chunker] ?? chunker} />
              <SummaryItem label="Embedding" value={embeddingModel} />
              <SummaryItem label="Retriever" value={labelMap[retrievalMethod] ?? retrievalMethod} />
              <SummaryItem label="Reranker" value={labelMap[reranker] ?? reranker} />
              <SummaryItem label="Enhance" value={buildEnhancementLabel(selectedEnhancements)} />
              <SummaryItem label="Scope" value={`${selectedDocIds.length} docs selected`} />
            </div>
          </div>
        </div>

        {/* Right Column: Evaluation Questions & Launch */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "24px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Evaluation Benchmark Prompts
              </span>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                {questionList.length} evaluation prompt{questionList.length !== 1 ? "s" : ""} loaded
              </p>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {quickPromptTemplates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => setQuestions((prev) => (prev ? `${prev}\n${tpl.text}` : tpl.text))}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={8}
            placeholder="Type or paste evaluation questions (one question per line)..."
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            style={{
              width: "100%",
              flex: 1,
              minHeight: "180px",
              padding: "16px",
              borderRadius: "16px",
              border: "none",
              background: "rgba(0, 0, 0, 0.25)",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "'Inter', monospace",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#fca5a5",
                fontSize: "12px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Electric Launch Benchmark Button */}
          <button
            onClick={handleRun}
            disabled={!canRun}
            onMouseEnter={() => setIsHoveringRun(true)}
            onMouseLeave={() => setIsHoveringRun(false)}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "9999px",
              border: "none",
              background: canRun
                ? "linear-gradient(135deg, #a855f7, #6366f1)"
                : "rgba(255, 255, 255, 0.06)",
              color: canRun ? "white" : "var(--text-muted)",
              fontSize: "15px",
              fontWeight: 700,
              cursor: canRun ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: canRun
                ? isHoveringRun
                  ? "0 12px 32px rgba(168, 85, 247, 0.5)"
                  : "0 6px 20px rgba(168, 85, 247, 0.35)"
                : "none",
              transform: canRun && isHoveringRun ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "pilot-spin 0.8s linear infinite",
                  }}
                />
                Running Pipeline Evaluation…
              </>
            ) : (
              <>⚡ Launch Benchmark Experiment</>
            )}
          </button>
        </div>
      </div>

      {/* ── Leaderboard Section ── */}
      <div style={{ marginTop: "32px" }}>
        <Leaderboards leaderboard={displayedLeaderboard} />
      </div>

      {/* ── Visualizations Section ── */}
      <div id="visualizations" style={{ marginTop: "32px" }}>
        <Visualizations leaderboard={displayedLeaderboard} />
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, icon, color }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "18px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "19px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
          {label}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>
          {value}
        </p>
        {sub && (
          <p style={{ margin: "1px 0 0", fontSize: "10px", color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={{ padding: "4px 0" }}>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
        {value}
      </span>
    </div>
  );
}