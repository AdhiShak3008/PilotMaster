import { useState, useMemo } from "react";
import { generateAnalysis } from "../api";
import ConfigBadge from "../components/ConfigBadge";
import { buildConfigLabelMap } from "../utils/configUtils";

// ── Design tokens ──────────────────────────────────────────────────────────
const accent      = "#8b5cf6";
const purple      = "#a855f7";
const green       = "#10b981";
const amber       = "#f59e0b";
const red         = "#ef4444";
const cyan        = "#06b6d4";

const card = {
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: "20px",
  padding: "24px",
};

const chip = (color = accent) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 12px",
  borderRadius: "9999px",
  background: `${color}18`,
  border: `1px solid ${color}30`,
  color,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.02em",
});

function Dot({ color, glow = false }) {
  return (
    <span style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: color,
      boxShadow: glow ? `0 0 8px ${color}` : "none",
      display: "inline-block",
      flexShrink: 0,
    }} />
  );
}

/**
 * Parses raw text and replaces config names (e.g. "Config 1", "gpt-oss-120b_vector_none_Default")
 * with interactive inline ConfigBadge chips without splitting text fragments.
 */
function SmartText({ text, labelMap }) {
  if (!text) return null;

  const CONFIG_REGEX = /(Config\s+\d+|(?:llama|gpt|gemini|mixtral)[a-zA-Z0-9._+-]+(?:_[a-zA-Z0-9._+-]+)*|\b[a-zA-Z0-9]+_[a-zA-Z0-9_+-]+\b)/gi;
  const parts = text.split(CONFIG_REGEX);

  return (
    <span style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (/^Config\s+\d+$/i.test(part.trim())) {
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 2px",
              }}
            >
              <ConfigBadge configName={part.trim()} label={part.trim()} fontSize="11px" placement="top" />
            </span>
          );
        }
        const lower = part.toLowerCase();
        if (
          part.includes("_") &&
          (lower.includes("gpt") ||
            lower.includes("llama") ||
            lower.includes("hybrid") ||
            lower.includes("vector") ||
            lower.includes("lexical") ||
            lower.includes("minilm") ||
            lower.includes("tinybert"))
        ) {
          const cleanLabel = labelMap?.get(part) || "Config";
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 2px",
              }}
            >
              <ConfigBadge configName={part} label={cleanLabel} fontSize="11px" placement="top" />
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ── Enterprise Collapsible Section ─────────────────────────────────────────
function CollapsibleSection({
  title,
  icon,
  color,
  badgeText,
  count,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <div
      style={{
        borderRadius: "14px",
        border: `1px solid ${isOpen ? color + "35" : "rgba(255, 255, 255, 0.08)"}`,
        background: isOpen
          ? `linear-gradient(145deg, ${color}0a 0%, rgba(255, 255, 255, 0.015) 100%)`
          : "rgba(255, 255, 255, 0.02)",
        overflow: "hidden",
      }}
    >
      {/* Header clickable bar */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          outline: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
          {icon && <span style={{ fontSize: "14px", flexShrink: 0 }}>{icon}</span>}
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: isOpen ? color : "rgba(255, 255, 255, 0.85)",
            }}
          >
            {title}
          </span>
          {count !== undefined && count !== null && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "9999px",
                background: `${color}20`,
                color: color,
              }}
            >
              {count}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {badgeText && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                background: `${color}20`,
                color: color,
                textTransform: "uppercase",
              }}
            >
              {badgeText}
            </span>
          )}
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.45)",
              display: "inline-block",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${color}15` }}>
          <div style={{ paddingTop: "12px" }}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ── Enterprise Item Cards ──────────────────────────────────────────────────
function InsightItemCard({ icon, title, text, color, labelMap }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: `linear-gradient(135deg, ${color}0c 0%, rgba(255,255,255,0.015) 100%)`,
        border: `1px solid ${color}25`,
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}25`;
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "8px",
          background: `${color}20`,
          border: `1px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color,
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {title}
          </div>
        )}
        <SmartText text={text} labelMap={labelMap} />
      </div>
    </div>
  );
}

function PriorityActionCard({ priority, text, labelMap }) {
  const isP0 = priority === 0;
  const isP1 = priority === 1;
  const pColor = isP0 ? red : isP1 ? amber : cyan;
  const pLabel = isP0 ? "P0 · Immediate" : isP1 ? "P1 · High Priority" : "P2 · Optimization";

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderLeft: `4px solid ${pColor}`,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "9999px",
            background: `${pColor}20`,
            color: pColor,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {pLabel}
        </span>
      </div>
      <SmartText text={text} labelMap={labelMap} />
    </div>
  );
}

// ── Master Report Card Shell ───────────────────────────────────────────────
function ReportShell({ icon, title, subtitle, accentColor, onToggleAll, allOpen, children }) {
  return (
    <div
      style={{
        ...card,
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        border: `1px solid ${accentColor}25`,
        background: "linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)",
        boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${accentColor}08`,
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "16.5px", fontWeight: 700, color: "white", letterSpacing: "-0.2px" }}>
              {title}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onToggleAll && (
            <button
              onClick={onToggleAll}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.7)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
              }}
            >
              {allOpen ? "Collapse All" : "Expand All"}
            </button>
          )}

          <div style={chip(accentColor)}>
            <Dot color={accentColor} glow />
            Verified
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Main AI Analysis Page ──────────────────────────────────────────────────
export default function AIAnalysis({ selectedRun, onRunRefresh }) {
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState(null);
  const [copied,     setCopied]     = useState(false);

  // Collapsible section state for Insight Report
  const [insightSections, setInsightSections] = useState({
    executive: true,
    strengths: false,
    weaknesses: false,
    observations: false,
    takeaway: false,
  });

  // Collapsible section state for Recommendation Report
  const [recSections, setRecSections] = useState({
    readiness: true,
    executive: false,
    actions: false,
    optimizations: false,
    blueprint: false,
  });

  const toggleInsight = (key) => setInsightSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleRec = (key) => setRecSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const allInsightOpen = Object.values(insightSections).every(Boolean);
  const allRecOpen = Object.values(recSections).every(Boolean);

  const toggleAllInsight = () => {
    const nextState = !allInsightOpen;
    setInsightSections({
      executive: nextState,
      strengths: nextState,
      weaknesses: nextState,
      observations: nextState,
      takeaway: nextState,
    });
  };

  const toggleAllRec = () => {
    const nextState = !allRecOpen;
    setRecSections({
      readiness: nextState,
      executive: nextState,
      actions: nextState,
      optimizations: nextState,
      blueprint: nextState,
    });
  };

  const hasRun = !!selectedRun;
  const insightReport        = selectedRun?.analysis?.insight_report        ?? selectedRun?.insight_report        ?? null;
  const recommendationReport = selectedRun?.analysis?.recommendation_report ?? selectedRun?.recommendation_report ?? null;
  const hasReports           = !!(insightReport && recommendationReport);

  const labelMap = useMemo(() => {
    return buildConfigLabelMap(selectedRun?.leaderboard || selectedRun?.results || []);
  }, [selectedRun]);

  const handleGenerate = async () => {
    if (!selectedRun) return;
    setGenerating(true);
    setGenError(null);
    try {
      const token = localStorage.getItem("token");
      await generateAnalysis(selectedRun.id, token);
      if (onRunRefresh) await onRunRefresh();
    } catch (err) {
      console.error("Analysis generation failed", err);
      setGenError(err?.response?.data?.detail ?? "Analysis generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopySummary = () => {
    if (!insightReport || !recommendationReport) return;
    const text = [
      `# AI Benchmark Synthesis & Engineering Reports`,
      `Benchmark Run: ${selectedRun?.name || "Run #" + selectedRun?.id}`,
      `\n## Executive Insight`,
      insightReport.executive_insight,
      `\n## Key Strengths`,
      ...(insightReport.strengths || []).map((s) => `- ${s}`),
      `\n## Identified Bottlenecks & Weaknesses`,
      ...(insightReport.weaknesses || []).map((w) => `- ${w}`),
      `\n## Engineering Tradeoff Observations`,
      ...(insightReport.engineering_observations || []).map((o) => `- ${o}`),
      `\n## Executive Recommendation`,
      recommendationReport.executive_recommendation,
      `\n## Priority Actions`,
      ...(recommendationReport.priority_actions || []).map((p) => `- ${p}`),
      `\n## Production Readiness Verdict`,
      recommendationReport.production_readiness,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Empty State ──
  if (!hasRun) {
    return (
      <div id="ai-analysis" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}>
        <div style={{ ...card, minHeight: "340px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "18px", background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
            🤖
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>No Benchmark Run Selected</p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)", maxWidth: "380px", lineHeight: 1.6 }}>
              Execute a benchmark evaluation from Experiment Setup to unlock automated AI engineering reports and production recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="ai-analysis" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Page Header & Action Controls ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", letterSpacing: "-0.8px", color: "#c084fc" }}>
              AI Benchmark Synthesis &amp; Engineering Reports
            </h1>
            <span style={chip(hasReports ? green : amber)}>
              <Dot color={hasReports ? green : amber} glow />
              {hasReports ? "Intelligence Ready" : "Awaiting Synthesis"}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Autonomous architectural evaluation, latency analysis, and production deployment recommendations.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {hasReports && (
            <button
              onClick={handleCopySummary}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: copied ? green : "rgba(255, 255, 255, 0.85)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
            >
              <span>{copied ? "✓ Copied" : "📋 Copy Synthesis"}</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: "9px 20px",
              borderRadius: "12px",
              background: generating ? "rgba(139, 92, 246, 0.3)" : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: generating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: generating ? "none" : "0 4px 18px rgba(139, 92, 246, 0.4)",
            }}
          >
            {generating ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</span>
                <span>Generating AI Synthesis...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>{hasReports ? "Regenerate Reports" : "Generate AI Reports"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {genError && (
        <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "12.5px", marginBottom: "20px" }}>
          ⚠️ {genError}
        </div>
      )}

      {/* ── Pre-generation Banner ── */}
      {!hasReports && !generating && (
        <div style={{
          ...card,
          marginBottom: "20px",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "white" }}>
              Ready to Synthesize Benchmark Results
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "rgba(255,255,255,0.6)", maxWidth: "600px", lineHeight: 1.5 }}>
              Click Generate to run the autonomous evaluation model over all ranked configurations, extracting architectural strengths, latency bottlenecks, and production deployment recommendations.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              background: "#8b5cf6",
              border: "none",
              color: "white",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Start Analysis
          </button>
        </div>
      )}

      {/* ── Master 2-Column Enterprise Report Layout ── */}
      {hasReports && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))", gap: "24px" }}>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* COLUMN 1: ARCHITECTURAL INSIGHT REPORT                           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <ReportShell
            icon="🔬"
            title="Architectural Insight Report"
            subtitle="Quantitative capability evaluation & empirical tradeoffs"
            accentColor={accent}
            allOpen={allInsightOpen}
            onToggleAll={toggleAllInsight}
          >
            {/* 1. Executive Synthesis */}
            <CollapsibleSection
              title="Executive Synthesis"
              icon="💡"
              color="#c4b5fd"
              isOpen={insightSections.executive}
              onToggle={() => toggleInsight("executive")}
            >
              <SmartText text={insightReport.executive_insight} labelMap={labelMap} />
            </CollapsibleSection>

            {/* 2. Proven Strengths */}
            <CollapsibleSection
              title="Proven Strengths & Capabilities"
              icon="✅"
              color={green}
              count={(insightReport.strengths || []).length}
              isOpen={insightSections.strengths}
              onToggle={() => toggleInsight("strengths")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(insightReport.strengths || []).map((s, idx) => (
                  <InsightItemCard
                    key={idx}
                    icon="✓"
                    text={s}
                    color={green}
                    labelMap={labelMap}
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* 3. Weaknesses & Bottlenecks */}
            <CollapsibleSection
              title="Identified Bottlenecks & Vulnerabilities"
              icon="⚠️"
              color={red}
              count={(insightReport.weaknesses || []).length}
              isOpen={insightSections.weaknesses}
              onToggle={() => toggleInsight("weaknesses")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(insightReport.weaknesses || []).map((w, idx) => (
                  <InsightItemCard
                    key={idx}
                    icon="!"
                    text={w}
                    color={red}
                    labelMap={labelMap}
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* 4. Engineering Observations */}
            <CollapsibleSection
              title="Architectural Tradeoff Observations"
              icon="📐"
              color={purple}
              count={(insightReport.engineering_observations || []).length}
              isOpen={insightSections.observations}
              onToggle={() => toggleInsight("observations")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(insightReport.engineering_observations || []).map((o, idx) => (
                  <InsightItemCard
                    key={idx}
                    icon="⚡"
                    text={o}
                    color={purple}
                    labelMap={labelMap}
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* 5. Strategic Benchmark Takeaway */}
            <CollapsibleSection
              title="Strategic Benchmark Takeaway"
              icon="🎯"
              color="#c4b5fd"
              isOpen={insightSections.takeaway}
              onToggle={() => toggleInsight("takeaway")}
            >
              <SmartText text={insightReport.benchmark_takeaway} labelMap={labelMap} />
            </CollapsibleSection>
          </ReportShell>


          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* COLUMN 2: ENGINEERING RECOMMENDATIONS & ROADMAP                  */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <ReportShell
            icon="⭐"
            title="Engineering Recommendation Report"
            subtitle="Actionable production blueprint & deployment guidance"
            accentColor={amber}
            allOpen={allRecOpen}
            onToggleAll={toggleAllRec}
          >
            {/* 1. Production Readiness Scorecard */}
            <CollapsibleSection
              title="Production Readiness Scorecard"
              icon="🛡️"
              color={recommendationReport.production_readiness?.includes("PRODUCTION READY") ? green : amber}
              badgeText={recommendationReport.production_readiness?.includes("PRODUCTION READY") ? "SLA Verified (<800ms)" : "Review Required"}
              isOpen={recSections.readiness}
              onToggle={() => toggleRec("readiness")}
            >
              <SmartText text={recommendationReport.production_readiness} labelMap={labelMap} />
            </CollapsibleSection>

            {/* 2. Executive Recommendation */}
            <CollapsibleSection
              title="Executive Recommendation"
              icon="💡"
              color={amber}
              isOpen={recSections.executive}
              onToggle={() => toggleRec("executive")}
            >
              <SmartText text={recommendationReport.executive_recommendation} labelMap={labelMap} />
            </CollapsibleSection>

            {/* 3. Actionable Engineering Roadmap */}
            <CollapsibleSection
              title="Actionable Engineering Roadmap"
              icon="🎯"
              color={amber}
              count={(recommendationReport.priority_actions || []).length}
              isOpen={recSections.actions}
              onToggle={() => toggleRec("actions")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(recommendationReport.priority_actions || []).map((action, idx) => (
                  <PriorityActionCard
                    key={idx}
                    priority={idx}
                    text={action}
                    labelMap={labelMap}
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* 4. Pipeline Tuning & Algorithmic Optimizations */}
            <CollapsibleSection
              title="Pipeline Tuning & Algorithmic Optimizations"
              icon="🛠️"
              color={cyan}
              count={(recommendationReport.pipeline_optimizations || []).length}
              isOpen={recSections.optimizations}
              onToggle={() => toggleRec("optimizations")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(recommendationReport.pipeline_optimizations || []).map((opt, idx) => (
                  <InsightItemCard
                    key={idx}
                    icon="⚙️"
                    text={opt}
                    color={cyan}
                    labelMap={labelMap}
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* 5. Next Benchmark Blueprint */}
            <CollapsibleSection
              title="Next Benchmark Blueprint"
              icon="🧪"
              color="#a5b4fc"
              isOpen={recSections.blueprint}
              onToggle={() => toggleRec("blueprint")}
            >
              <SmartText text={recommendationReport.next_experiment} labelMap={labelMap} />
            </CollapsibleSection>
          </ReportShell>

        </div>
      )}
    </div>
  );
}