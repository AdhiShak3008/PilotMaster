import { useState } from "react";
import OverallTable from "../components/leaderboards/OverallTable";
import ExperimentSelector from "../components/ExperimentSelector";
import Insights from "./Insights";

const METRIC_META = {
  overall:          { label: "Overall Rankings",          desc: "Combined benchmark ranking across all evaluation metrics.", icon: "🏆" },
  faithfulness:     { label: "Faithfulness Rankings",     desc: "Ranked by how accurately answers reflect the source document.", icon: "📋" },
  grounding:        { label: "Grounding Rankings",        desc: "Ranked by evidence support and factual grounding.", icon: "⚓" },
  retrieval_quality:{ label: "Retrieval Quality Rankings",desc: "Ranked by retriever precision and recall performance.", icon: "🔍" },
  query_coverage:   { label: "Query Coverage Rankings",   desc: "Ranked by how thoroughly questions are addressed.", icon: "📊" },
  latency:          { label: "Latency Rankings",          desc: "Ranked by response speed — lower is better.", icon: "⚡" },
};

export default function Leaderboards({ leaderboard }) {
  const [selectedMetric, setSelectedMetric] = useState("overall");

  const accent = "#4f6ef7";
  const green  = "#22c55e";

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

  // ── Derived KPI values ─────────────────────────────────────────────────────
  const overall = leaderboard?.overall ?? [];
  const faithfulness = leaderboard?.faithfulness ?? [];
  const latency = leaderboard?.latency ?? [];
  const totalConfigs = overall.length;
  const bestConfig   = overall[0]?.config_name ?? null;
  const fastestConfig = [...latency].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0]?.config_name ?? null;
  const topFaithfulness = faithfulness[0]?.config_name ?? null;

  const formatName = (name) =>
    name?.replaceAll("_", " ").replaceAll("+", " + ")
      .replace("NoRewrite", "(No Rewrite)").replace("NoReranker", "(No Reranker)") ?? "—";

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!leaderboard || overall.length === 0) {
    return (
      <div  id="leaderboards" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "30px", lineHeight: 1 }}>🏆</span>
              <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 700, letterSpacing: "-0.5px", color: "white" }}>Leaderboards</h1>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
              Compare benchmark performance across evaluation metrics and configurations.
            </p>
          </div>
          <div style={chip("rgba(255,255,255,0.3)")}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "inline-block" }} />
            Awaiting Results
          </div>
        </div>

        {/* Empty state card */}
        <div style={{
          ...card, minHeight: "320px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "16px", textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: "300px", height: "300px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,110,247,0.06) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none",
          }} />
          <div style={{
            width: 72, height: 72, borderRadius: "20px",
            background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
          }}>🏆</div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>No Results Yet</p>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.35)", maxWidth: "360px", lineHeight: 1.6 }}>
              Run your first benchmark from Experiment Setup to populate the leaderboard with ranked results.
            </p>
          </div>
          <div style={chip(accent)}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block" }} />
            Ready to benchmark
          </div>
        </div>
      </div>
    );
  }

  const meta = METRIC_META[selectedMetric] ?? METRIC_META.overall;

  return (
    <div  style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "30px", lineHeight: 1 }}>🏆</span>
            <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 700, letterSpacing: "-0.5px", color: "white" }}>Leaderboards</h1>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Compare benchmark performance across evaluation metrics and configurations.
          </p>
        </div>
        <div style={chip(green)}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: green, boxShadow: `0 0 6px ${green}`, display: "inline-block" }} />
          {totalConfigs} Configuration{totalConfigs !== 1 ? "s" : ""} Ranked
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Best Overall",        value: formatName(bestConfig),      icon: "🥇", color: "#f59e0b" },
          { label: "Fastest Config",      value: formatName(fastestConfig),   icon: "⚡", color: "#22c55e" },
          { label: "Top Faithfulness",    value: formatName(topFaithfulness), icon: "📋", color: accent },
          { label: "Configs Evaluated",   value: totalConfigs,                icon: "🔬", color: "#a78bfa" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            ...card, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "14px",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
              background: `${color}18`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "18px",
            }}>{icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: "14px", fontWeight: 700, color: "white", lineHeight: 1.2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{value}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "3px" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Metric Selector Card ─────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={sectionLabel}>Leaderboard View</p>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              Select a metric to re-rank all configurations by that dimension.
            </p>
          </div>
          <ExperimentSelector
            value={selectedMetric}
            onChange={setSelectedMetric}
            options={[
              { value: "overall",           label: "Overall",          description: "Combined ranking"      },
              { value: "faithfulness",      label: "Faithfulness",     description: "Answer accuracy"       },
              { value: "grounding",         label: "Grounding",        description: "Evidence support"      },
              { value: "retrieval_quality", label: "Retrieval Quality",description: "Retriever performance" },
              { value: "query_coverage",    label: "Query Coverage",   description: "Question coverage"     },
              { value: "latency",           label: "Latency",          description: "Response speed"        },
            ]}
          />
        </div>
      </div>

      {/* ── Table Section ────────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: "16px" }}>
        {/* Table header */}
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>{meta.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "white" }}>{meta.label}</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{meta.desc}</p>
            </div>
          </div>
          <div style={chip(accent)}>
            {leaderboard[selectedMetric]?.length ?? 0} entries
          </div>
        </div>

        <OverallTable data={leaderboard[selectedMetric]} />
      </div>

      {/* ── Insights Section ─────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <p style={sectionLabel}>AI Insights</p>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
            Automatically generated observations from your benchmark results.
          </p>
        </div>
        <div style={{ padding: "24px" }}>
          <Insights leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
}