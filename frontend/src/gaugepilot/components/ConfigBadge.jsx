import { useState, useRef, useEffect } from "react";
import { parseConfigDetails } from "../utils/configUtils";

/**
 * Interactive Configuration Badge with detailed specification hover card / tooltip.
 */
export default function ConfigBadge({
  configName,
  label = null,
  isBest = false,
  medal = null,
  fontSize = "13px",
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, placeAbove: true });
  const badgeRef = useRef(null);

  const displayLabel = label || configName || "Config";
  const details = parseConfigDetails(configName);

  const handleMouseEnter = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const placeAbove = rect.top > 260; // place above if room, else below
      setPopoverPos({
        top: placeAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        placeAbove,
      });
    }
    setHovered(true);
  };

  return (
    <div
      ref={badgeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      onFocus={handleMouseEnter}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        position: "relative",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {medal && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "6px",
            background: medal.color ? `${medal.color}18` : "rgba(255,255,255,0.04)",
            fontSize: "14px",
            fontWeight: 700,
            color: medal.color || "#ffffff",
          }}
        >
          {medal.label}
        </span>
      )}

      {isBest && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#f59e0b",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Best
        </span>
      )}

      {/* Main Config Badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "8px",
          background: hovered ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.05)",
          border: hovered ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
          color: hovered ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
          fontWeight: isBest ? 700 : 600,
          fontSize,
          letterSpacing: "-0.2px",
          transition: "all 0.15s ease",
          boxShadow: hovered ? "0 4px 16px rgba(168, 85, 247, 0.2)" : "none",
        }}
      >
        <span>{displayLabel}</span>
        <span
          style={{
            fontSize: "10px",
            color: hovered ? "#c084fc" : "rgba(255, 255, 255, 0.4)",
            fontWeight: 400,
          }}
        >
          ℹ
        </span>
      </span>

      {/* Floating Hover Card / Tooltip Popover */}
      {hovered && (
        <div
          style={{
            position: "fixed",
            top: popoverPos.placeAbove ? popoverPos.top : popoverPos.top,
            left: popoverPos.left,
            transform: popoverPos.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            zIndex: 99999,
            width: "min(320px, calc(100vw - 32px))",
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(15, 20, 36, 0.96)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.15)",
            pointerEvents: "none",
            boxSizing: "border-box",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>⚙️</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                {displayLabel} Specifications
              </span>
            </div>
            {isBest && (
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", textTransform: "uppercase" }}>
                Top Rank
              </span>
            )}
          </div>

          {/* Breakdown Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>🤖 LLM Model:</span>
              <span style={{ color: "#ffffff", fontWeight: 600, textAlign: "right" }}>{details.model}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>⚡ Retrieval:</span>
              <span style={{ color: "#38bdf8", fontWeight: 600, textAlign: "right" }}>{details.retrieval}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>🎯 Reranker:</span>
              <span style={{ color: "#c084fc", fontWeight: 600, textAlign: "right" }}>{details.reranker}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>📄 Chunker:</span>
              <span style={{ color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{details.chunker}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>🧬 Embedding:</span>
              <span style={{ color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{details.embedding}</span>
            </div>

            <div style={{ marginTop: "4px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>🧩 Active Enhancements:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {details.enhancements.map((enh, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      background: enh.includes("Default") ? "rgba(255,255,255,0.05)" : "rgba(168, 85, 247, 0.2)",
                      color: enh.includes("Default") ? "rgba(255,255,255,0.6)" : "#d8b4fe",
                      fontWeight: 500,
                    }}
                  >
                    {enh}
                  </span>
                ))}
              </div>
            </div>

            {/* Raw signature */}
            <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", color: "rgba(255,255,255,0.35)", wordBreak: "break-all", fontFamily: "monospace" }}>
              Signature: {details.rawName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
