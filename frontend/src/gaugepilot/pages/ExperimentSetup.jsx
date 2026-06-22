import { useState, useRef, useEffect } from "react";
import { useBenchmark } from "../hooks/useBenchmark";
import Leaderboards from "./Leaderboards";
import ExperimentSelector from "../components/ExperimentSelector";
import {
  runBenchmark,
  uploadDocument,
  getBenchmarkRuns,
  deleteBenchmarkRun,
  resetBenchmarkRuns,
  getDocuments,
  resetDocuments,
} from "../api";
import Visualizations from "./Visualizations";
const ENHANCEMENT_OPTIONS = [
  {
    id: "Default",
    label: "Default",
    subtitle:
      "Run the normal retrieval pipeline.",
  },
  {
    id: "Query Rewrite",
    label: "Query Rewrite",
    subtitle:
      "Rewrite the user's question.",
  },
  {
    id: "HyDE",
    label: "HyDE",
    subtitle:
      "Generate hypothetical answer embeddings.",
  },
  {
    id: "Multi Query",
    label: "Multi Query",
    subtitle:
      "Generate multiple query variants.",
  },
  {
    id: "Query Expansion",
    label: "Query Expansion",
    subtitle:
      "Expand the query.",
  },
  {
    id: "All",
    label: "All",
    subtitle:
      "Enable every enhancement.",
  },
];

const ALL_ENHANCEMENT_IDS = [
  "Query Rewrite",
  "HyDE",
  "Multi Query",
  "Query Expansion",
];

function toggleEnhancement(current, id) {
  if (id === "Default") {
    return ["Default"];
  }

  if (id === "All") {
    return [...ALL_ENHANCEMENT_IDS];
  }

  let next = current.filter(
    (e) => e !== "Default"
  );

  if (next.includes(id)) {
    next = next.filter((e) => e !== id);
  } else {
    next.push(id);
  }

  return next.length
    ? next
    : ["Default"];
}
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
top: "100%",
            left: 0,
            marginTop: "10px",
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
function buildEnhancementLabel(selected) {
  if (selected.includes("Default") || selected.length === 0)
    return "Default";

  if (
    ALL_ENHANCEMENT_IDS.every((id) =>
      selected.includes(id)
    ) &&
    selected.length === ALL_ENHANCEMENT_IDS.length
  ) {
    return "All";
  }

  return selected.join(" + ");
}

export default function ExperimentSetup() {
  const { loading, results, error, executeBenchmark } = useBenchmark();
  const [questions, setQuestions] = useState("");
  const [model, setModel] = useState("llama-3.1-8b");
  const [retrievalMethod, setRetrievalMethod] = useState("Hybrid");
  const [reranker, setReranker] = useState("minilm");
  const [selectedEnhancements, setSelectedEnhancements] =
  useState(["Default"]);

const [showEnhancements, setShowEnhancements] =
  useState(false);
  //const [enhancement, setEnhancement] = useState("Default");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringUpload, setIsHoveringUpload] = useState(false);
  const [isHoveringRun, setIsHoveringRun] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [benchmarkRuns, setBenchmarkRuns] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [allRuns, setAllRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);

  // Holds the leaderboard the user is currently viewing in the dropdown.
  // This is separate from `results` (which comes from useBenchmark and only
  // reflects the most recently executed run) so that selecting an older run
  // from history doesn't require touching the hook's internals.
  const [selectedLeaderboard, setSelectedLeaderboard] = useState(null);

  const fileInputRef = useRef(null);
  const enhancementRef = useRef(null);
  useEffect(() => {
  const handleClick = (e) => {
    if (
      enhancementRef.current &&
      !enhancementRef.current.contains(e.target)
    ) {
      setShowEnhancements(false);
    }
  };

  document.addEventListener(
    "pointerdown",
    handleClick
  );

  return () =>
    document.removeEventListener(
      "pointerdown",
      handleClick
    );
}, []);
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const runs = await getBenchmarkRuns(token);
        const docs = await getDocuments(token);

        setBenchmarkRuns(runs.length);
        setAllRuns(runs);

        const sorted = [...runs].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        if (sorted.length) {
          setSelectedRun(sorted[0]);
          const leaderboard = JSON.parse(sorted[0].leaderboard_json);
          setSelectedLeaderboard(leaderboard);

          const score =
            leaderboard.overall?.[0]?.average_rank ??
            leaderboard.overall?.[0]?.avg_rank;
          if (score != null) setBestScore(score);
        }

        if (docs.length) {
          setUploadedFile({
            name: docs[0].filename,
            size: docs[0].file_size || 0,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadDashboardData();
  }, []);

  const questionList = questions
    .split("\n")
    .map((q) => q.trim())
    .filter(Boolean);
  const canRun = questionList.length > 0 && !loading;

  const handleRun = async () => {
    const retrievalMap = {
  FAISS: "vector",
  BM25: "lexical",
  Hybrid: "hybrid",
};
    const payload = {
      model,
      retrieval_method:
  retrievalMap[retrievalMethod],
      reranker,
       enhancements: selectedEnhancements,
      questions: questionList,
    };
    const token = localStorage.getItem("token");
    setBenchmarkRuns((r) => r + 1);
    console.log("retrievalMethod state:", retrievalMethod);
console.log("mapped value:", retrievalMap[retrievalMethod]);
console.log("payload:", payload);
    const res = await executeBenchmark(payload, token);
    
    // Backend returns `average_rank`, not `avg_rank` — support both so this
    // doesn't silently break again if the field name changes either way.
    const newScore =
      res?.leaderboard?.overall?.[0]?.average_rank ??
      res?.leaderboard?.overall?.[0]?.avg_rank;

    if (newScore != null) {
      setBestScore((prev) => (prev === null ? newScore : Math.min(prev, newScore)));
    }

    // Refresh the run list unconditionally after a run completes, regardless
    // of whether a score was present, so history/dropdown/count never go stale.
    try {
      const updatedRuns = await getBenchmarkRuns(token);
      const sorted = [...updatedRuns].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setAllRuns(updatedRuns);
      setBenchmarkRuns(updatedRuns.length);

      if (sorted.length) {
        setSelectedRun(sorted[0]);
        // New run becomes the active view in the dropdown/leaderboard.
        setSelectedLeaderboard(
          res?.leaderboard ?? JSON.parse(sorted[0].leaderboard_json)
        );
      }
    } catch (err) {
      console.error("Failed to refresh runs", err);
    }
  };

  const handleFileChange = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      await uploadDocument(file, token);
      setUploadedFile(file);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectRun = (runId) => {
    const run = allRuns.find((r) => String(r.id) === runId) ?? null;
    setSelectedRun(run);

    if (run?.leaderboard_json) {
      try {
        setSelectedLeaderboard(JSON.parse(run.leaderboard_json));
      } catch (err) {
        console.error("Failed to parse leaderboard for run", err);
        setSelectedLeaderboard(null);
      }
    } else {
      setSelectedLeaderboard(null);
    }
  };

  const handleDeleteRun = async () => {
    if (!selectedRun) return;
    const token = localStorage.getItem("token");
    try {
      await deleteBenchmarkRun(selectedRun.id, token);
      const updated = allRuns.filter((r) => r.id !== selectedRun.id);
      const sorted = [...updated].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setAllRuns(updated);
      setBenchmarkRuns(updated.length);

      if (sorted.length) {
        setSelectedRun(sorted[0]);
        try {
          setSelectedLeaderboard(JSON.parse(sorted[0].leaderboard_json));
        } catch {
          setSelectedLeaderboard(null);
        }
      } else {
        setSelectedRun(null);
        setSelectedLeaderboard(null);
        setBestScore(null);
      }
    } catch (err) {
      console.error("Delete run failed", err);
    }
  };

  const handleResetRuns = async () => {
    const token = localStorage.getItem("token");
    try {
      await resetBenchmarkRuns(token);
      setAllRuns([]);
      setBenchmarkRuns(0);
      setSelectedRun(null);
      setSelectedLeaderboard(null);
      setBestScore(null);
    } catch (err) {
      console.error("Reset runs failed", err);
    }
  };

  const handleResetDocuments = async () => {
    const token = localStorage.getItem("token");
    try {
      await resetDocuments(token);
      setUploadedFile(null);
    } catch (err) {
      console.error("Reset documents failed", err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const labelMap = {
    "llama-3.1-8b": "Llama 3.1 8B",
    "llama-3.3-70b": "Llama 3.3 70B",
    "llama-4-scout": "Llama 4 Scout",
    "qwen-3-32b": "Qwen 3 32B",
    "gpt-oss-20b": "GPT OSS 20B",
    "gpt-oss-120b": "GPT OSS 120B",
    minilm: "MiniLM",
    tinybert: "TinyBERT",
    "bge-large": "BGE Large",
    "bge-m3": "BGE M3",
    none: "None",
  };

  // ── Design tokens ──────────────────────────────────────────────────────────
  const accent = "#4f6ef7";
  const accentPurple = "#6a4ff7";
  const green = "#22c55e";

  const card = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "20px",
    padding: "24px",
  };

  const sectionLabel = {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
    marginBottom: "14px",
  };

  const chip = (color = accent) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 10px",
    borderRadius: "999px",
    background: `${color}33`,
    border: `1px solid ${color}66`,
    color,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
  });

  const dangerBtn = {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid rgba(239,68,68,0.45)",
    background: "rgba(239,68,68,0.14)",
    color: "#fca5a5",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: "0.02em",
  };

  // ── KPI Stats ──────────────────────────────────────────────────────────────
  const stats = [
    { label: "Questions Added", value: questionList.length, icon: "❓", color: accent },
    { label: "Uploaded Files", value: uploadedFile ? 1 : 0, icon: "📄", color: "#a78bfa" },
    { label: "Benchmark Runs", value: benchmarkRuns, icon: "🚀", color: green },
    {
      label: "Best Score",
      value: bestScore !== null ? bestScore.toFixed(2) : "—",
      icon: "🏆",
      color: "#f59e0b",
    },
  ];
  const activeEnhancementLabel =
  buildEnhancementLabel(selectedEnhancements);
  // The leaderboard actually rendered: prefer whatever is currently selected
  // in history (covers both "just ran" and "picked an old run" cases), and
  // fall back to the hook's results only if nothing has been selected yet.
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
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "28px 24px",
        fontFamily: "inherit",
      }}
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "30px", lineHeight: 1 }}>🧪</span>
            <h1
              style={{
                margin: 0,
                fontSize: "34px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "white",
              }}
            >
              Experiment Setup
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.6,
            }}
          >
            Configure your RAG pipeline, upload a source document, and define
            evaluation questions.
          </p>
        </div>
        <div style={chip(results ? green : accent)}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: results ? green : accent,
              boxShadow: `0 0 6px ${results ? green : accent}`,
              display: "inline-block",
            }}
          />
          {loading ? "Running…" : results ? "Complete" : "Ready"}
        </div>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {stats.map(({ label, value, icon, color }) => (
          <div
            key={label}
            style={{
              ...card,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                flexShrink: 0,
                background: `${color}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              {icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.55)",
                  marginTop: "3px",
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
{/* ── Benchmark History ─────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <p style={sectionLabel}>Benchmark History</p>

        {allRuns.length === 0 ? (
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            No benchmark runs yet. Run your first benchmark above.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            {/* Run selector dropdown */}
            <select
              value={selectedRun?.id ?? ""}
              onChange={(e) => handleSelectRun(e.target.value)}
              style={{
                flex: "1 1 260px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
                appearance: "auto",
              }}
            >
              {[...allRuns]
                .sort(
                  (a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                )
                .map((run) => (
                  <option
                    key={run.id}
                    value={run.id}
                    style={{ background: "#1a1a2e", color: "white" }}
                  >
                    {run.name}
                  </option>
                ))}
            </select>

            {/* Delete selected run */}
            <button
              onClick={handleDeleteRun}
              disabled={!selectedRun}
              title="Delete selected run"
              style={{
                ...dangerBtn,
                opacity: selectedRun ? 1 : 0.4,
                cursor: selectedRun ? "pointer" : "not-allowed",
              }}
            >
              ❌ Delete Selected
            </button>
          </div>
        )}

        {/* Destructive actions row */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            paddingTop: allRuns.length > 0 ? "14px" : "0",
            borderTop:
              allRuns.length > 0
                ? "1px solid rgba(255,255,255,0.08)"
                : "none",
          }}
        >
          <button onClick={handleResetRuns} style={dangerBtn}>
            🗑 Delete All Benchmarks
          </button>
          <button onClick={handleResetDocuments} style={dangerBtn}>
            📂 Delete Documents &amp; Vector Store
          </button>
        </div>
      </div>
      {/* ── Configuration Panel ───────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <p style={sectionLabel}>Pipeline Configuration</p>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <ExperimentSelector
            label="Active Model"
            value={model}
            onChange={setModel}
            options={[
              {
                value: "llama-3.1-8b",
                label: "Llama 3.1 8B",
                description: "Fast & Efficient",
              },
              {
                value: "llama-3.3-70b",
                label: "Llama 3.3 70B",
                description: "Best Overall",
              },
              {
                value: "llama-4-scout",
                label: "Llama 4 Scout",
                description: "Large Context Window",
              },
              {
                value: "qwen-3-32b",
                label: "Qwen 3 32B",
                description: "Reasoning & Analysis",
              },
              {
                value: "gpt-oss-20b",
                label: "GPT OSS 20B",
                description: "Fast Reasoning",
              },
              {
                value: "gpt-oss-120b",
                label: "GPT OSS 120B",
                description: "Deep Reasoning",
              },
            ]}
          />
          <ExperimentSelector
            label="Retrieval Strategy"
            value={retrievalMethod}
            onChange={setRetrievalMethod}
            options={[
              {
                value: "FAISS",
                label: "FAISS",
                description: "Dense vector retrieval",
              },
              {
                value: "BM25",
                label: "BM25",
                description: "Sparse keyword retrieval",
              },
              {
                value: "Hybrid",
                label: "Hybrid",
                description: "Dense + sparse retrieval",
              },
            ]}
          />
          <ExperimentSelector
            label="Reranker"
            value={reranker}
            onChange={setReranker}
            options={[
              {
                value: "none",
                label: "None",
                description: "No reranking",
              },
              {
                value: "minilm",
                label: "MiniLM",
                description: "Fast balanced baseline",
              },
              {
                value: "tinybert",
                label: "TinyBERT",
                description: "Ultra-fast lightweight",
              },
              {
                value: "bge-large",
                label: "BGE Large",
                description: "High-quality semantic ranking",
              },
              {
                value: "bge-m3",
                label: "BGE M3",
                description: "Modern retrieval-focused reranker",
              },
            ]}
          />
          <CustomSelector
  label={activeEnhancementLabel}
  sublabel="Enhancements"
  open={showEnhancements}
  onToggle={() =>
    setShowEnhancements((v) => !v)
  }
  selectorRef={enhancementRef}
>
  {ENHANCEMENT_OPTIONS.map((opt) => (
    <SelectorItem
      key={opt.id}
      label={opt.label}
      subtitle={opt.subtitle}
      multiSelect
      active={
        opt.id === "All"
          ? ALL_ENHANCEMENT_IDS.every((e) =>
              selectedEnhancements.includes(e)
            )
          : selectedEnhancements.includes(opt.id)
      }
      onClick={() => {
        setSelectedEnhancements((prev) =>
          toggleEnhancement(prev, opt.id)
        );
      }}
    />
  ))}
</CustomSelector>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Upload Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHoveringUpload(true)}
            onMouseLeave={() => setIsHoveringUpload(false)}
            style={{
              borderRadius: "20px",
              minHeight: "240px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.25s ease",
              background: isDragging
                ? `rgba(79,110,247,0.12)`
                : uploadedFile
                ? `rgba(34,197,94,0.08)`
                : `rgba(255,255,255,0.05)`,
              border: `1.5px ${isDragging ? "solid" : "dashed"} ${
                isDragging
                  ? accent
                  : uploadedFile
                  ? `${green}88`
                  : isHoveringUpload
                  ? "rgba(79,110,247,0.6)"
                  : "rgba(255,255,255,0.2)"
              }`,
              boxShadow: isDragging
                ? `0 0 32px rgba(79,110,247,0.2), inset 0 0 32px rgba(79,110,247,0.05)`
                : isHoveringUpload
                ? `0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(79,110,247,0.1)`
                : uploadedFile
                ? `0 0 20px rgba(34,197,94,0.12)`
                : "none",
              transform:
                isHoveringUpload && !isDragging ? "translateY(-2px)" : "none",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />

            {/* Ambient glow blob */}
            <div
              style={{
                position: "absolute",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: uploadedFile
                  ? `radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)`
                  : `radial-gradient(circle, rgba(79,110,247,0.1) 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {uploading ? (
              <>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "16px",
                    background: "rgba(79,110,247,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    boxShadow: "0 0 20px rgba(79,110,247,0.25)",
                  }}
                >
                  ⏳
                </div>
                <div style={{ textAlign: "center", zIndex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "#7b96ff",
                    }}
                  >
                    Uploading & Indexing...
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Processing document
                  </p>
                </div>
              </>
            ) : uploadedFile ? (
              <>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "16px",
                    background: "rgba(34,197,94,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    boxShadow: "0 0 20px rgba(34,197,94,0.25)",
                  }}
                >
                  ✅
                </div>
                <div style={{ textAlign: "center", zIndex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "15px",
                      color: green,
                    }}
                  >
                    {uploadedFile.name}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {(uploadedFile.size / 1024).toFixed(1)} KB · Click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "18px",
                    background: isDragging
                      ? `rgba(79,110,247,0.25)`
                      : "rgba(79,110,247,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    zIndex: 1,
                    boxShadow: isDragging
                      ? `0 0 24px rgba(79,110,247,0.35)`
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  ⬆️
                </div>
                <div style={{ textAlign: "center", zIndex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "white",
                    }}
                  >
                    {isDragging ? "Drop to upload" : "Upload Document"}
                  </p>
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.6,
                    }}
                  >
                    Drag & drop or click to browse
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Benchmark Summary */}
          <div style={{ ...card, padding: "16px 20px" }}>
            <p style={{ ...sectionLabel, marginBottom: "10px" }}>
              Benchmark Summary
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              {[
                { label: "Model", value: labelMap[model] ?? model },
                {
                  label: "Retrieval",
                  value: labelMap[retrievalMethod] ?? retrievalMethod,
                },
                { label: "Reranker", value: labelMap[reranker] ?? reranker },
                {
  label: "Enhancements",
  value: selectedEnhancements.join(", "),
},
                {
                  label: "Questions",
                  value:
                    questionList.length === 0
                      ? "None"
                      : `${questionList.length}`,
                },
              ].map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 0",
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "none",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={!canRun}
            onMouseEnter={() => setIsHoveringRun(true)}
            onMouseLeave={() => setIsHoveringRun(false)}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "16px",
              border: "none",
              background: canRun
                ? `linear-gradient(135deg, ${accent} 0%, ${accentPurple} 100%)`
                : "rgba(255,255,255,0.07)",
              color: canRun ? "white" : "rgba(255,255,255,0.3)",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.03em",
              cursor: canRun ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: canRun
                ? isHoveringRun
                  ? `0 0 40px rgba(79,110,247,0.6), 0 8px 24px rgba(0,0,0,0.4)`
                  : `0 0 24px rgba(79,110,247,0.35), 0 4px 12px rgba(0,0,0,0.3)`
                : "none",
              transform: canRun && isHoveringRun ? "translateY(-1px)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 15,
                    height: 15,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Running Benchmark…
              </>
            ) : (
              <>▶ Run Benchmark</>
            )}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {!canRun && !loading && (
            <p
              style={{
                margin: "-4px 0 0",
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                textAlign: "center",
              }}
            >
              Add at least one question to run
            </p>
          )}
        </div>

        {/* ── Right Column: Questions ───────────────────────────────────── */}
        <div
          style={{
            ...card,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Questions header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  ...sectionLabel,
                  marginBottom: "3px",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                Evaluation Questions
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                One question per line
              </p>
            </div>
            <div
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              {questionList.length > 0 && (
                <>
                  <div style={chip(green)}>
                    ✓ {questionList.length} question
                    {questionList.length !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={() => setQuestions("")}
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      color: "#fca5a5",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </>
              )}
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {questions.length} chars
              </span>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {/* Line numbers */}
            <div
              style={{
                background: "rgba(0,0,0,0.25)",
                padding: "18px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 0,
                userSelect: "none",
                minWidth: "36px",
                borderRight: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {(questions || " ").split("\n").map((_, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.3)",
                    lineHeight: "1.8",
                    fontFamily: "'Courier New', monospace",
                    height: "21.6px",
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              rows={14}
              placeholder={"Type your evaluation questions here…"}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              style={{
                flex: 1,
                minHeight: "300px",
                padding: "18px 16px",
                border: "none",
                background: "rgba(0,0,0,0.2)",
                color: "white",
                fontSize: "13px",
                resize: "vertical",
                lineHeight: "1.8",
                fontFamily: "'Courier New', Courier, monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: "14px",
            padding: "13px 18px",
            borderRadius: "12px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            fontSize: "13px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      

      <div style={{ marginTop: "24px" }}>
        <Leaderboards leaderboard={displayedLeaderboard} />
      </div>
      <div
  id="visualizations"
  style={{ marginTop: "24px" }}
>
  <Visualizations
    leaderboard={displayedLeaderboard}
  />
</div>
    </div>
  );
}