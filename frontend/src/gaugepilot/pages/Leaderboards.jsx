import { useState, useMemo } from "react";
import OverallTable from "../components/leaderboards/OverallTable";
import ExperimentSelector from "../components/ExperimentSelector";
import ConfigBadge from "../components/ConfigBadge";
import { buildConfigLabelMap } from "../utils/configUtils";

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

  const accent = "#a855f7";
  const green  = "#10b981";

  const card = {
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "20px",
    padding: "24px",
  };

  const sectionLabel = {
    fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px",
  };

  const chip = (color = accent) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "4px 12px", borderRadius: "9999px",
    background: `${color}18`,
    color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em",
  });

  const labelMap = useMemo(() => buildConfigLabelMap(leaderboard), [leaderboard]);

  // ── Derived KPI values ─────────────────────────────────────────────────────
  const overall = leaderboard?.overall ?? [];
  const faithfulness = leaderboard?.faithfulness ?? [];
  const latency = leaderboard?.latency ?? [];
  const totalConfigs = overall.length;
  const bestConfig   = overall[0]?.config_name ?? null;
  const fastestConfig = [...latency].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0]?.config_name ?? null;
  const topFaithfulness = faithfulness[0]?.config_name ?? null;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!leaderboard || overall.length === 0) {
    return (
      <div id="leaderboards" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", letterSpacing: "-0.8px", color: "#c084fc" }}>
              Leaderboard Rankings
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Compare benchmark performance across evaluation metrics and configurations.
            </p>
          </div>
          <div style={chip("rgba(255,255,255,0.3)")}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "inline-block" }} />
            Awaiting Results
          </div>
        </div>

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
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>No Benchmark Results Yet</p>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.35)", maxWidth: "340px", lineHeight: 1.6 }}>
              Run a benchmark above to populate the leaderboards with metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const meta = METRIC_META[selectedMetric] ?? METRIC_META.overall;

  return (
    <div id="leaderboards" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}>

      {/* ── Section Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", letterSpacing: "-0.8px", color: "#c084fc" }}>
            Leaderboard Rankings
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Rank and compare configurations across all core retrieval and generation metrics.
          </p>
        </div>
        <div style={chip(green)}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: green, boxShadow: `0 0 6px ${green}`, display: "inline-block" }} />
          {totalConfigs} Configuration{totalConfigs !== 1 ? "s" : ""} Ranked
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Best Overall",      configName: bestConfig,      icon: "🥇", color: "#f59e0b" },
          { label: "Fastest Config",    configName: fastestConfig,   icon: "⚡", color: "#22c55e" },
          { label: "Top Faithfulness",  configName: topFaithfulness, icon: "📋", color: accent    },
          { label: "Configs Evaluated", count: totalConfigs,         icon: "🔬", color: "#a78bfa" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              ...card,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                flexShrink: 0,
                background: `${item.color}18`,
                border: `1px solid ${item.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              {item.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              {item.configName ? (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <ConfigBadge
                    configName={item.configName}
                    label={labelMap.get(item.configName) || "Config"}
                    placement="bottom"
                  />
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1.2,
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.count ?? "—"}
                </div>
              )}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Metric Selector Card ─────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", flexWrap: "wrap", gap: "24px" }}>
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

        <OverallTable data={leaderboard[selectedMetric]} labelMap={labelMap} />
      </div>

    </div>
  );
}