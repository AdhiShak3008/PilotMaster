import { useState } from "react";
import { generateAnalysis, getBenchmarkRuns } from "../api";

// ── Design tokens (mirrors GaugePilot palette) ─────────────────────────────
const accent      = "#4f6ef7";
const accentLight = "#a0baff";
const purple      = "#a78bfa";
const green       = "#22c55e";
const amber       = "#f59e0b";

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
  marginBottom: "14px",
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

// ── Markdown-lite renderer ─────────────────────────────────────────────────
// Converts **bold**, ## headings, and - bullets into styled JSX.
function ReportBody({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const nodes = [];
  let listBuf = [];

  const flushList = (key) => {
    if (!listBuf.length) return;
    nodes.push(
      <ul key={`ul-${key}`} style={{
        margin: "6px 0 14px 0",
        paddingLeft: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}>
        {listBuf.map((item, i) => (
          <li key={i} style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.65,
          }}
            dangerouslySetInnerHTML={{ __html: renderInline(item) }}
          />
        ))}
      </ul>
    );
    listBuf = [];
  };

  const renderInline = (str) =>
    str
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:white;font-weight:700">$1</strong>')
      .replace(/`(.+?)`/g, '<code style="font-family:monospace;background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>');

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // H2
    if (/^#{1,2}\s/.test(trimmed)) {
      flushList(i);
      const text = trimmed.replace(/^#{1,2}\s+/, "");
      nodes.push(
        <h3 key={i} style={{
          margin: "22px 0 8px",
          fontSize: "15px",
          fontWeight: 700,
          color: accentLight,
          letterSpacing: "0.01em",
          borderBottom: "1px solid rgba(160,186,255,0.12)",
          paddingBottom: "6px",
        }}
          dangerouslySetInnerHTML={{ __html: renderInline(text) }}
        />
      );
      return;
    }

    // H3
    if (/^#{3}\s/.test(trimmed)) {
      flushList(i);
      const text = trimmed.replace(/^#{3}\s+/, "");
      nodes.push(
        <h4 key={i} style={{
          margin: "16px 0 6px",
          fontSize: "13px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          letterSpacing: "0.02em",
        }}
          dangerouslySetInnerHTML={{ __html: renderInline(text) }}
        />
      );
      return;
    }

    // Bullet
    if (/^[-*]\s/.test(trimmed)) {
      listBuf.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      listBuf.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushList(i);

    // Empty line
    if (!trimmed) {
      nodes.push(<div key={i} style={{ height: "6px" }} />);
      return;
    }

    // Normal paragraph
    nodes.push(
      <p key={i} style={{
        margin: "0 0 8px",
        fontSize: "13px",
        color: "rgba(255,255,255,0.72)",
        lineHeight: 1.7,
      }}
        dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }}
      />
    );
  });

  flushList("end");
  return <div>{nodes}</div>;
}

// ── Report card ────────────────────────────────────────────────────────────
function ReportCard({ icon, title, accentColor, content, emptyLabel }) {
  const hasContent = typeof content === "string" && content.trim().length > 0;

  return (
    <div style={{
      ...card,
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      borderColor: hasContent ? `${accentColor}30` : "rgba(255,255,255,0.06)",
      background: hasContent
        ? `linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)`
        : "rgba(255,255,255,0.02)",
    }}>
      {/* Card header */}
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
        <div>
          <h3 style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.2px",
          }}>
            {title}
          </h3>
          {hasContent && (
            <p style={{
              margin: "2px 0 0",
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
            }}>
              AI-generated · based on benchmark results
            </p>
          )}
        </div>
        {hasContent && (
          <div style={{ marginLeft: "auto", ...chip(accentColor) }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
              display: "inline-block",
            }} />
            Ready
          </div>
        )}
      </div>

      {/* Report content */}
      {hasContent ? (
        <div style={{
          background: "rgba(0,0,0,0.2)",
          borderRadius: "12px",
          padding: "20px 22px",
          border: "1px solid rgba(255,255,255,0.06)",
          maxHeight: "520px",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.12) transparent",
        }}>
          <ReportBody text={content} />
        </div>
      ) : (
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
      )}
    </div>
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
  const [genError, setGenError]     = useState(null);

  const hasRun = !!selectedRun;

  // Backend returns analysis as a nested object: { insight_report, recommendation_report }.
  // toStr ensures we only ever pass a real string into ReportCard — never an object.
  const toStr = (v) => (typeof v === "string" && v.trim().length > 0 ? v : null);

  const insightText =
    toStr(selectedRun?.insight_report) ??
    toStr(selectedRun?.analysis?.insight_report) ??
    null;

  const recText =
    toStr(selectedRun?.recommendation_report) ??
    toStr(selectedRun?.analysis?.recommendation_report) ??
    null;

  const hasReports = !!(insightText || recText);

  // Prefer a dedicated analysis_generated_at field; fall back to updated_at.
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

      // Refresh the run list AND update selectedRun in-place so reports
      // appear immediately without requiring a manual dropdown change.
      if (onRunRefresh) await onRunRefresh();
    } catch (err) {
      console.error("Analysis generation failed", err);
      setGenError(
        err?.response?.data?.detail ?? "Analysis generation failed. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ── Status chip ────────────────────────────────────────────────────────
  const statusChip = (() => {
    if (!hasRun)     return chip("rgba(255,255,255,0.3)");
    if (hasReports)  return chip(green);
    return chip(accent);
  })();

  const statusDot = (() => {
    if (!hasRun)     return "rgba(255,255,255,0.3)";
    if (hasReports)  return green;
    return accent;
  })();

  const statusLabel = !hasRun
    ? "No run selected"
    : hasReports
    ? "Reports available"
    : "Ready to generate";

  return (
    <div
      id="ai-analysis"
      style={{
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "28px 24px",
        fontFamily: "inherit",
      }}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "28px",
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}>
            <span style={{ fontSize: "30px", lineHeight: 1 }}>🤖</span>
            <h1 style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "white",
            }}>
              AI Analysis
            </h1>
          </div>
          <p style={{
            margin: 0,
            fontSize: "13px",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.6,
          }}>
            AI-generated engineering insights and recommendations based on your benchmark results.
          </p>
        </div>
        <div style={statusChip}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: statusDot,
            boxShadow: hasRun ? `0 0 6px ${statusDot}` : "none",
            display: "inline-block",
          }} />
          {statusLabel}
        </div>
      </div>

      {/* ── No run selected ──────────────────────────────────────────────── */}
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
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,110,247,0.06) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "20px",
            background: "rgba(79,110,247,0.1)",
            border: "1px solid rgba(79,110,247,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
          }}>🤖</div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>
              No Benchmark Selected
            </p>
            <p style={{
              margin: "8px 0 0",
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              maxWidth: "360px",
              lineHeight: 1.6,
            }}>
              Run a benchmark from Experiment Setup, then return here to generate AI-powered engineering reports.
            </p>
          </div>
          <div style={chip(accent)}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: accent,
              display: "inline-block",
            }} />
            Awaiting benchmark
          </div>
        </div>
      )}

      {/* ── Run selected ─────────────────────────────────────────────────── */}
      {hasRun && (
        <>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* ── Pre-generation panel: shown when no reports exist yet ─────── */}
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
                  <h3 style={{
                    margin: "0 0 10px",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: "-0.2px",
                  }}>
                    Engineering reports have not yet been generated for this benchmark.
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.7,
                    maxWidth: "560px",
                  }}>
                    These reports use the deterministic benchmark findings to produce an
                    engineering insight report and a set of actionable recommendations.
                    Generation takes a few seconds and can be re-run at any time.
                  </p>
                </div>

                {/* CTA */}
                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <button
                    onClick={handleGenerate}
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
                      boxShadow: `0 0 24px rgba(79,110,247,0.35), 0 4px 12px rgba(0,0,0,0.3)`,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 40px rgba(79,110,247,0.6), 0 8px 24px rgba(0,0,0,0.4)`;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 24px rgba(79,110,247,0.35), 0 4px 12px rgba(0,0,0,0.3)`;
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    ✦ Generate AI Analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Generation in-progress banner ─────────────────────────────── */}
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
                width: 20,
                height: 20,
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

          {/* ── Post-generation strip: shown once reports exist ───────────── */}
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
                {/* Green pulse dot */}
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: green,
                  boxShadow: `0 0 8px ${green}`,
                  display: "inline-block",
                  flexShrink: 0,
                }} />
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "white" }}>
                    Generated
                  </p>
                  {generatedAt && (
                    <p style={{ margin: "1px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                      {generatedAt} · {selectedRun.name ?? `Run #${selectedRun.id}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Regenerate button — quieter than the primary CTA */}
              <button
                onClick={handleGenerate}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.11)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                }}
              >
                ↺ Regenerate
              </button>
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

          {/* ── Report cards ─────────────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}>
            <ReportCard
              icon="🔬"
              title="Engineering Insight Report"
              accentColor={accent}
              content={insightText}
              emptyLabel="Generate analysis to see engineering insights."
            />
            <ReportCard
              icon="⭐"
              title="Engineering Recommendation Report"
              accentColor={amber}
              content={recText}
              emptyLabel="Generate analysis to see recommendations."
            />
          </div>
        </>
      )}
    </div>
  );
}