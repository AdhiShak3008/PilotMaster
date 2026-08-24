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
  placement = "auto",
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, placeAbove: false, maxHeight: 320 });
  const badgeRef = useRef(null);

  const displayLabel = label || configName || "Config";
  const details = parseConfigDetails(configName);

  const updatePosition = () => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const popoverEstimatedHeight = 260;
    const popoverWidth = 320;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    // If badge is off screen, hide popover
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setHovered(false);
      return;
    }

    let placeAbove = false;
    if (placement === "top") {
      placeAbove = spaceAbove >= 160;
    } else if (placement === "bottom") {
      placeAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
    } else {
      // Intelligent Auto:
      // If element is in upper viewport (< 250px from top), open below
      // If element is in lower viewport (< 260px from bottom), open above
      if (spaceAbove < popoverEstimatedHeight && spaceBelow >= 180) {
        placeAbove = false;
      } else if (spaceBelow < popoverEstimatedHeight && spaceAbove >= 180) {
        placeAbove = true;
      } else {
        placeAbove = spaceAbove >= spaceBelow;
      }
    }

    let top = 0;
    let maxHeight = 340;
    if (placeAbove) {
      top = rect.top - 8;
      maxHeight = Math.min(340, Math.max(140, rect.top - 16));
    } else {
      top = rect.bottom + 8;
      maxHeight = Math.min(340, Math.max(140, window.innerHeight - rect.bottom - 16));
    }

    const idealLeft = rect.left + rect.width / 2;
    const minLeft = popoverWidth / 2 + 16;
    const maxLeft = window.innerWidth - popoverWidth / 2 - 16;
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));

    setPopoverPos({
      top,
      left: clampedLeft,
      placeAbove,
      maxHeight,
    });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setHovered(true);
  };

  useEffect(() => {
    if (!hovered) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [hovered]);

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
          padding: "4px 10px",
          height: "26px",
          borderRadius: "8px",
          background: hovered ? "rgba(168, 85, 247, 0.22)" : "rgba(255, 255, 255, 0.05)",
          border: hovered ? "1px solid rgba(168, 85, 247, 0.45)" : "1px solid rgba(255, 255, 255, 0.08)",
          color: hovered ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
          fontWeight: isBest ? 700 : 600,
          fontSize,
          letterSpacing: "-0.2px",
          boxShadow: hovered ? "0 4px 16px rgba(168, 85, 247, 0.2)" : "none",
          boxSizing: "border-box",
        }}
      >
        <span>{displayLabel}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: hovered ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.12)",
            fontSize: "9px",
            fontWeight: 700,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: hovered ? "#d8b4fe" : "rgba(255, 255, 255, 0.65)",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          i
        </span>
      </span>

      {/* Floating Hover Card / Tooltip Popover */}
      {hovered && (
        <div
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            transform: popoverPos.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            zIndex: 99999,
            width: "min(320px, calc(100vw - 32px))",
            maxHeight: "min(320px, calc(100vh - 40px))",
            overflowY: "auto",
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(15, 20, 36, 0.98)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(168, 85, 247, 0.15)",
            pointerEvents: "none",
            boxSizing: "border-box",
            userSelect: "none",
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
