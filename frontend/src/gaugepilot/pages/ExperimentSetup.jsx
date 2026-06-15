import { useState, useRef } from "react";
import { useBenchmark } from "../hooks/useBenchmark";
import Leaderboards from "./Leaderboards";
import ExperimentSelector from "../components/ExperimentSelector";
import {
  runBenchmark,
  uploadDocument,
} from "../api";
/*const SAMPLE_QUESTIONS = [
  "What is the main contribution of this paper?",
  "How does the proposed method compare to baselines?",
  "What datasets were used for evaluation?",
  "What are the limitations acknowledged by the authors?",
  "What future work do the authors suggest?",
];*/

export default function ExperimentSetup() {
  const { loading, results, error, executeBenchmark } = useBenchmark();
  const [questions, setQuestions] = useState("");
  const [model, setModel] = useState("llama-3.1-8b");
  const [retrievalMethod, setRetrievalMethod] = useState("hybrid");
  const [reranker, setReranker] = useState("minilm");
  const [enhancement, setEnhancement] = useState("default");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringUpload, setIsHoveringUpload] = useState(false);
  const [isHoveringRun, setIsHoveringRun] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [benchmarkRuns, setBenchmarkRuns] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const fileInputRef = useRef(null);

  const questionList = questions.split("\n").map((q) => q.trim()).filter(Boolean);
  const canRun = questionList.length > 0 && !loading;

  const handleRun = async () => {
    const payload = {
      model,
      retrieval_method: retrievalMethod,
      reranker,
      enhancement,
      questions: questionList,
    };
    const token = localStorage.getItem("token");
    setBenchmarkRuns((r) => r + 1);
    const res = await executeBenchmark(payload, token);
    if (res?.leaderboard?.overall?.[0]?.avg_rank) {
      setBestScore((prev) => {
        const s = res.leaderboard.overall[0].avg_rank;
        return prev === null ? s : Math.min(prev, s);
      });
    }
  };

  const handleFileChange = async (file) => {
  if (!file) return;

  try {
    setUploading(true);

    const token = localStorage.getItem("token");

    await uploadDocument(
      file,
      token
    );

    setUploadedFile(file);

    console.log(
      "GaugePilot upload successful"
    );
  } catch (err) {
    console.error(
      "GaugePilot upload failed",
      err
    );
  } finally {
    setUploading(false);
  }
};



  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const labelMap = {
    "llama-3.1-8b": "Llama 3.1 8B", hybrid: "Hybrid", vector: "Vector",
    lexical: "BM25", minilm: "MiniLM", default: "Default",
  };

  // ── Design tokens ────────────────────────────────────────────────────────────
  const accent = "#4f6ef7";
  const accentPurple = "#6a4ff7";
  const green = "#22c55e";

  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
  };

  const sectionLabel = {
    fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "14px",
  };

  const chip = (color = accent) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "3px 10px", borderRadius: "999px",
    background: `${color}22`, border: `1px solid ${color}44`,
    color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
  });

  // ── KPI Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Questions Added", value: questionList.length, icon: "❓", color: accent },
    { label: "Uploaded Files", value: uploadedFile ? 1 : 0, icon: "📄", color: "#a78bfa" },
    { label: "Benchmark Runs", value: benchmarkRuns, icon: "🚀", color: green },
    { label: "Best Score", value: bestScore !== null ? bestScore.toFixed(2) : "—", icon: "🏆", color: "#f59e0b" },
  ];

  return (
    <div id="experiment-setup" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "30px", lineHeight: 1 }}>🧪</span>
            <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 700, letterSpacing: "-0.5px", color: "white" }}>
              Experiment Setup
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Configure your RAG pipeline, upload a source document, and define evaluation questions.
          </p>
        </div>
        <div style={chip(results ? green : accent)}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: results ? green : accent,
            boxShadow: `0 0 6px ${results ? green : accent}`,
            display: "inline-block",
          }} />
          {loading ? "Running…" : results ? "Complete" : "Ready"}
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} style={{
            ...card, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "14px",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
              background: `${color}18`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "18px",
            }}>{icon}</div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "white", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "3px" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Configuration Panel ──────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <p style={sectionLabel}>Pipeline Configuration</p>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <ExperimentSelector label="Active Model" value={model} onChange={setModel}
            options={[{ value: "llama-3.1-8b", label: "Llama 3.1 8B", description: "Fast & Efficient" }]} />
          <ExperimentSelector label="Retrieval Strategy" value={retrievalMethod} onChange={setRetrievalMethod}
            options={[
              { value: "hybrid", label: "Hybrid", description: "Vector + BM25" },
              { value: "vector", label: "Vector", description: "Embedding Search" },
              { value: "lexical", label: "BM25", description: "Keyword Search" },
            ]} />
          <ExperimentSelector label="Reranker" value={reranker} onChange={setReranker}
            options={[{ value: "minilm", label: "MiniLM", description: "Fast balanced baseline" }]} />
          <ExperimentSelector label="Enhancements" value={enhancement} onChange={setEnhancement}
            options={[{ value: "default", label: "Default", description: "Standard pipeline" }]} />
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "16px", alignItems: "start" }}>

        {/* ── Left Column ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Upload Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHoveringUpload(true)}
            onMouseLeave={() => setIsHoveringUpload(false)}
            style={{
              borderRadius: "20px",
              minHeight: "240px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "14px",
              cursor: "pointer",
              position: "relative", overflow: "hidden",
              transition: "all 0.25s ease",
              background: isDragging
                ? `rgba(79,110,247,0.1)`
                : uploadedFile
                ? `rgba(34,197,94,0.06)`
                : `rgba(255,255,255,0.025)`,
              border: `1.5px ${isDragging ? "solid" : "dashed"} ${
                isDragging ? accent
                : uploadedFile ? `${green}66`
                : isHoveringUpload ? "rgba(79,110,247,0.5)"
                : "rgba(255,255,255,0.1)"
              }`,
              boxShadow: isDragging
                ? `0 0 32px rgba(79,110,247,0.2), inset 0 0 32px rgba(79,110,247,0.05)`
                : isHoveringUpload
                ? `0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(79,110,247,0.1)`
                : uploadedFile
                ? `0 0 20px rgba(34,197,94,0.1)`
                : "none",
              transform: isHoveringUpload && !isDragging ? "translateY(-2px)" : "none",
            }}
          >
            <input ref={fileInputRef} type="file" style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files[0])} />

            {/* Ambient glow blob */}
            <div style={{
              position: "absolute", width: "200px", height: "200px",
              borderRadius: "50%", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: uploadedFile
                ? `radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)`
                : `radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            {uploading ? (
  <>
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "16px",
        background: "rgba(79,110,247,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        boxShadow: "0 0 20px rgba(79,110,247,0.2)",
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
          color: "#4f6ef7",
        }}
      >
        Uploading & Indexing...
      </p>

      <p
        style={{
          margin: "4px 0 0",
          fontSize: "12px",
          color: "rgba(255,255,255,0.35)",
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
        background: "rgba(34,197,94,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        boxShadow: "0 0 20px rgba(34,197,94,0.2)",
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
          color: "rgba(255,255,255,0.35)",
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
          ? `rgba(79,110,247,0.2)`
          : "rgba(79,110,247,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        zIndex: 1,
        boxShadow: isDragging
          ? `0 0 24px rgba(79,110,247,0.3)`
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
        {isDragging
          ? "Drop to upload"
          : "Upload Document"}
      </p>

      <p
        style={{
          margin: "5px 0 0",
          fontSize: "12px",
          color: "rgba(255,255,255,0.35)",
          lineHeight: 1.6,
        }}
      >
        Drag & drop or click to browse
        <br />
        
      </p>
    </div>
  </>
)}
          </div>

          {/* Benchmark Summary */}
          <div style={{ ...card, padding: "16px 20px" }}>
            <p style={{ ...sectionLabel, marginBottom: "10px" }}>Benchmark Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              {[
                { label: "Model", value: labelMap[model] ?? model },
                { label: "Retrieval", value: labelMap[retrievalMethod] ?? retrievalMethod },
                { label: "Reranker", value: labelMap[reranker] ?? reranker },
                { label: "Enhancement", value: labelMap[enhancement] ?? enhancement },
                { label: "Questions", value: questionList.length === 0 ? "None" : `${questionList.length}` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{value}</span>
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
              width: "100%", padding: "18px", borderRadius: "16px", border: "none",
              background: canRun
                ? `linear-gradient(135deg, ${accent} 0%, ${accentPurple} 100%)`
                : "rgba(255,255,255,0.05)",
              color: canRun ? "white" : "rgba(255,255,255,0.2)",
              fontSize: "16px", fontWeight: 700, letterSpacing: "0.03em",
              cursor: canRun ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
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
                <span style={{
                  width: 15, height: 15,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Running Benchmark…
              </>
            ) : <>▶ Run Benchmark</>}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {!canRun && !loading && (
            <p style={{ margin: "-4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
              Add at least one question to run
            </p>
          )}
        </div>

        {/* ── Right Column: Questions ─────────────────────────────────────── */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Questions header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ ...sectionLabel, marginBottom: "3px", color: "rgba(255,255,255,0.72)" }}>Evaluation Questions</p>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>One question per line</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {questionList.length > 0 && (
                <>
                  <div style={chip(green)}>✓ {questionList.length} question{questionList.length !== 1 ? "s" : ""}</div>
                  <button
                    onClick={() => setQuestions("")}
                    style={{
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "8px", color: "#f87171", fontSize: "12px", fontWeight: 600,
                      padding: "4px 10px", cursor: "pointer",
                    }}
                  >Clear</button>
                </>
              )}
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>{questions.length} chars</span>
            </div>
          </div>

        

          

          <div style={{ position: "relative", display: "flex", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Line numbers */}
            <div style={{
              background: "rgba(0,0,0,0.25)", padding: "18px 10px",
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              gap: 0, userSelect: "none", minWidth: "36px", borderRight: "1px solid rgba(255,255,255,0.05)",
            }}>
              {(questions || " ").split("\n").map((_, i) => (
                <div key={i} style={{ fontSize: "12px", color: "rgba(255,255,255,0.18)", lineHeight: "1.8", fontFamily: "'Courier New', monospace", height: "21.6px" }}>
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
                flex: 1, minHeight: "300px", padding: "18px 16px",
                border: "none", background: "rgba(0,0,0,0.2)",
                color: "white", fontSize: "13px", resize: "vertical",
                lineHeight: "1.8", fontFamily: "'Courier New', Courier, monospace",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: "14px", padding: "13px 18px", borderRadius: "12px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171", fontSize: "13px",
        }}>⚠️ {error}</div>
      )}

      <div style={{ marginTop: "24px" }}>
        <Leaderboards
          leaderboard={results?.leaderboard || {
            overall: [], faithfulness: [], grounding: [],
            retrieval_quality: [], query_coverage: [], latency: [],
          }}
        />
      </div>
    </div>
  );
}