import React from "react";

export default function GlossaryButton({
  onClick,
  label = "Glossary",
  experimentMode = false,
  variant = "pill", // "pill" | "floating" | "sidebar"
  title = "Open terminology & concepts glossary",
}) {
  const isExp = Boolean(experimentMode);

  if (variant === "floating") {
    return (
      <button
        onClick={onClick}
        title={title}
        aria-label="Open page glossary"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "9999px",
          background: isExp
            ? "linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(126, 34, 206, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.95) 100%)",
          color: "#ffffff",
          border: isExp
            ? "1px solid rgba(216, 180, 254, 0.4)"
            : "1px solid rgba(147, 197, 253, 0.4)",
          boxShadow: isExp
            ? "0 8px 24px rgba(168, 85, 247, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)"
            : "0 8px 24px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
          e.currentTarget.style.boxShadow = isExp
            ? "0 12px 28px rgba(168, 85, 247, 0.55)"
            : "0 12px 28px rgba(59, 130, 246, 0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = isExp
            ? "0 8px 24px rgba(168, 85, 247, 0.4)"
            : "0 8px 24px rgba(59, 130, 246, 0.4)";
        }}
      >
        <span style={{ fontSize: "15px", lineHeight: 1 }}>📖</span>
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={onClick}
        title={title}
        style={{
          width: "100%",
          padding: "9px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: isExp ? "rgba(168, 85, 247, 0.12)" : "rgba(59, 130, 246, 0.1)",
          border: isExp ? "1px solid rgba(168, 85, 247, 0.25)" : "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "9999px",
          color: isExp ? "#d8b4fe" : "#93c5fd",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          transition: "all 0.15s ease",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isExp ? "rgba(168, 85, 247, 0.22)" : "rgba(59, 130, 246, 0.2)";
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isExp ? "rgba(168, 85, 247, 0.12)" : "rgba(59, 130, 246, 0.1)";
          e.currentTarget.style.color = isExp ? "#d8b4fe" : "#93c5fd";
        }}
      >
        <span style={{ fontSize: "15px" }}>📖</span>
        <span>{label}</span>
      </button>
    );
  }

  // Standard Google Pill Toolbar Button
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "6px 14px",
        background: isExp ? "rgba(168, 85, 247, 0.14)" : "rgba(59, 130, 246, 0.12)",
        color: isExp ? "#c084fc" : "#60a5fa",
        border: isExp ? "1px solid rgba(168, 85, 247, 0.28)" : "1px solid rgba(59, 130, 246, 0.25)",
        borderRadius: "9999px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isExp
          ? "rgba(168, 85, 247, 0.25)"
          : "rgba(59, 130, 246, 0.22)";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isExp
          ? "rgba(168, 85, 247, 0.14)"
          : "rgba(59, 130, 246, 0.12)";
        e.currentTarget.style.color = isExp ? "#c084fc" : "#60a5fa";
      }}
    >
      <span style={{ fontSize: "13px" }}>📖</span>
      <span>{label}</span>
    </button>
  );
}
