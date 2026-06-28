import { useState } from "react";
import { generateAnalysis } from "../api";

// ── Design tokens ──────────────────────────────────────────────────────────
const accent      = "#4f6ef7";
const accentLight = "#a0baff";
const purple      = "#a78bfa";
const green       = "#22c55e";
const amber       = "#f59e0b";
const red         = "#ef4444";

// ── Base styles ────────────────────────────────────────────────────────────
const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  padding: "28px",
};

const sectionLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "10px",
};

const chip = (color = accent) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "3px 10px",
  borderRadius: "999px",
  background: `${color}22`,
  border: `1px solid ${color}44`,
  color,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.04em",
});

// ── Dot indicator ──────────────────────────────────────────────────────────
function Dot({ color, glow = false }) {
  return (
    <span style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: color,
      boxShadow: glow ? `0 0 6px ${color}` : "none",
      display: "inline-block",
      flexShrink: 0,
    }} />
  );
}

// ── Reusable section block inside a report card ───────────────────────────
function SectionBlock({ label, color = accentLight, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ ...sectionLabel, color: `${color}88` }}>{label}</p>
      {children}
    </div>
  );
}

// ── Plain text value ───────────────────────────────────────────────────────
function TextValue({ text }) {
  if (!text) return null;
  return (
    <p style={{
      margin: 0,
      fontSize: "13px",
      color: "rgba(255,255,255,0.78)",
      lineHeight: 1.7,
    }}>
      {text}
    </p>
  );
}

// ── Bullet list ────────────────────────────────────────────────────────────
function BulletList({ items, color = accentLight }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
            marginTop: "7px",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Report card shell ──────────────────────────────────────────────────────
function ReportShell({ icon, title, accentColor, children }) {
  return (
    <div style={{
      ...card,
      display: "flex",
      flexDirection: "column",
      gap: "0",
      borderColor: `${accentColor}30`,
      background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "white", letterSpacing: "-0.2px" }}>
            {title}
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
            AI-generated · based on benchmark results
          </p>
        </div>
        <div style={chip(accentColor)}>
          <Dot color={accentColor} glow />
          Ready
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{
        background: "rgba(0,0,0,0.2)",
        borderRadius: "12px",
        padding: "20px 22px",
        border: "1px solid rgba(255,255,255,0.06)",
        maxHeight: "560px",
        overflowY: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.12) transparent",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Empty placeholder card ─────────────────────────────────────────────────
function EmptyCard({ icon, title, emptyLabel, accentColor }) {
  return (
    <div style={{
      ...card,
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      background: "rgba(255,255,255,0.02)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "white" }}>{title}</h3>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "40px 20px",
        textAlign: "center",
        color: "rgba(255,255,255,0.28)",
      }}>
        <span style={{ fontSize: "28px", opacity: 0.4 }}>{icon}</span>
        <p style={{ margin: 0, fontSize: "13px" }}>{emptyLabel}</p>
      </div>
    </div>
  );
}

// ── Engineering Insight card ───────────────────────────────────────────────
function InsightCard({ report }) {
  if (!report) return (
    <EmptyCard
      icon="🔬"
      title="Engineering Insight Report"
      accentColor={accent}
      emptyLabel="Generate analysis to see engineering insights."
    />
  );

  return (
    <ReportShell icon="🔬" title="Engineering Insight Report" accentColor={accent}>
      <SectionBlock label="Executive Insight" color={accentLight}>
        <TextValue text={report.executive_insight} />
      </SectionBlock>

      <SectionBlock label="Strengths" color={green}>
        <BulletList items={report.strengths} color={green} />
      </SectionBlock>

      <SectionBlock label="Weaknesses" color={red}>
        <BulletList items={report.weaknesses} color={red} />
      </SectionBlock>

      <SectionBlock label="Engineering Observations" color={accentLight}>
        <BulletList items={report.engineering_observations} color={accentLight} />
      </SectionBlock>

      <SectionBlock label="Benchmark Takeaway" color={purple}>
        <TextValue text={report.benchmark_takeaway} />
      </SectionBlock>
    </ReportShell>
  );
}

// ── Engineering Recommendation card ───────────────────────────────────────
function RecommendationCard({ report }) {
  if (!report) return (
    <EmptyCard
      icon="⭐"
      title="Engineering Recommendation Report"
      accentColor={amber}
      emptyLabel="Generate analysis to see recommendations."
    />
  );

  return (
    <ReportShell icon="⭐" title="Engineering Recommendation Report" accentColor={amber}>
      <SectionBlock label="Executive Recommendation" color={amber}>
        <TextValue text={report.executive_recommendation} />
      </SectionBlock>

      <SectionBlock label="Priority Actions" color={red}>
        <BulletList items={report.priority_actions} color={red} />
      </SectionBlock>

      <SectionBlock label="Pipeline Optimizations" color={accentLight}>
        <BulletList items={report.pipeline_optimizations} color={accentLight} />
      </SectionBlock>

      <SectionBlock label="Next Experiment" color={purple}>
        <TextValue text={report.next_experiment} />
      </SectionBlock>

      <SectionBlock label="Production Readiness" color={green}>
        <TextValue text={report.production_readiness} />
      </SectionBlock>
    </ReportShell>
  );
}

// ── Timestamp formatter ────────────────────────────────────────────────────
function formatTs(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return null;
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AIAnalysis({ selectedRun, onRunRefresh }) {
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState(null);

  const hasRun = !!selectedRun;

  const insightReport        = selectedRun?.analysis?.insight_report        ?? selectedRun?.insight_report        ?? null;
  const recommendationReport = selectedRun?.analysis?.recommendation_report ?? selectedRun?.recommendation_report ?? null;
  const hasReports           = !!(insightReport && recommendationReport);

  const generatedAt = formatTs(
    selectedRun?.analysis_generated_at ?? selectedRun?.updated_at ?? null
  );

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

  // ── Status chip ──────────────────────────────────────────────────────────
  const statusColor = !hasRun ? "rgba(255,255,255,0.3)" : hasReports ? green : accent;
  const statusLabel = !hasRun ? "No run selected" : hasReports ? "Reports available" : "Ready to generate";

  return (
    <div
      id="ai-analysis"
      style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "28px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "30px", lineHeight: 1 }}>🤖</span>
            <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 700, letterSpacing: "-0.5px", color: "white" }}>
              AI Analysis
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            AI-generated engineering insights and recommendations based on your benchmark results.
          </p>
        </div>
        <div style={chip(statusColor)}>
          <Dot color={statusColor} glow={hasRun} />
          {statusLabel}
        </div>
      </div>

      {/* ── No run selected ───────────────────────────────────────────────── */}
      {!hasRun && (
        <div style={{
          ...card,
          minHeight: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            width: "300px", height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,110,247,0.06) 0%, transparent 70%)",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />
          <div style={{
            width: 72, height: 72,
            borderRadius: "20px",
            background: "rgba(79,110,247,0.1)",
            border: "1px solid rgba(79,110,247,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px",
          }}>🤖</div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>
              No Benchmark Selected
            </p>
            <p style={{
              margin: "8px 0 0", fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              maxWidth: "360px", lineHeight: 1.6,
            }}>
              Run a benchmark from Experiment Setup, then return here to generate AI-powered engineering reports.
            </p>
          </div>
          <div style={chip(accent)}>
            <Dot color={accent} />
            Awaiting benchmark
          </div>
        </div>
      )}

      {/* ── Run selected ──────────────────────────────────────────────────── */}
      {hasRun && (
        <>
          {/* Pre-generation panel */}
          {!hasReports && !generating && (
            <div style={{
              ...card,
              marginBottom: "16px",
              borderColor: "rgba(79,110,247,0.18)",
              background: "rgba(79,110,247,0.04)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "20px",
              }}>
                <div style={{ flex: "1 1 380px" }}>
                  <p style={{ ...sectionLabel, color: "rgba(160,186,255,0.5)" }}>
                    Active Benchmark Run · {selectedRun.name ?? `Run #${selectedRun.id}`}
                  </p>
                  <h3 style={{ margin: "0 0 10px", fontSize: "17px", fontWeight: 700, color: "white", letterSpacing: "-0.2px" }}>
                    Engineering reports have not yet been generated for this benchmark.
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: "560px" }}>
                    These reports use the deterministic benchmark findings to produce an engineering insight
                    report and a set of actionable recommendations. Generation takes a few seconds and can
                    be re-run at any time.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <GenerateButton onClick={handleGenerate} />
                </div>
              </div>
            </div>
          )}

          {/* Generating banner */}
          {generating && (
            <div style={{
              ...card,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px 24px",
              background: "rgba(79,110,247,0.06)",
              borderColor: "rgba(79,110,247,0.2)",
            }}>
              <span style={{
                width: 20, height: 20,
                border: "2px solid rgba(79,110,247,0.3)",
                borderTop: `2px solid ${accent}`,
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }} />
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: accentLight }}>
                  Generating AI reports…
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                  Analysing benchmark data and crafting engineering insights. This may take a moment.
                </p>
              </div>
            </div>
          )}

          {/* Post-generation strip */}
          {hasReports && !generating && (
            <div style={{
              ...card,
              marginBottom: "16px",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              borderColor: `${green}28`,
              background: `rgba(34,197,94,0.04)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Dot color={green} glow />
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "white" }}>Generated</p>
                  {generatedAt && (
                    <p style={{ margin: "1px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                      {generatedAt} · {selectedRun.name ?? `Run #${selectedRun.id}`}
                    </p>
                  )}
                </div>
              </div>
              <RegenerateButton onClick={handleGenerate} />
            </div>
          )}

          {/* Error */}
          {genError && (
            <div style={{
              marginBottom: "16px",
              padding: "13px 18px",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              fontSize: "13px",
            }}>
              ⚠️ {genError}
            </div>
          )}

          {/* Report cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <InsightCard report={insightReport} />
            <RecommendationCard report={recommendationReport} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Buttons ────────────────────────────────────────────────────────────────
function GenerateButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "13px 24px",
        borderRadius: "12px",
        border: "none",
        background: `linear-gradient(135deg, ${accent} 0%, ${purple} 100%)`,
        color: "white",
        fontSize: "14px",
        fontWeight: 700,
        letterSpacing: "0.02em",
        cursor: "pointer",
        boxShadow: hovered
          ? `0 0 40px rgba(79,110,247,0.6), 0 8px 24px rgba(0,0,0,0.4)`
          : `0 0 24px rgba(79,110,247,0.35), 0 4px 12px rgba(0,0,0,0.3)`,
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      ✦ Generate AI Analysis
    </button>
  );
}

function RegenerateButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "8px 16px",
        borderRadius: "10px",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)"}`,
        background: hovered ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.06)",
        color: hovered ? "white" : "rgba(255,255,255,0.7)",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      ↺ Regenerate
    </button>
  );
}