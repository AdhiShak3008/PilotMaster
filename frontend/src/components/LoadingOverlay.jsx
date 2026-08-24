import React from "react";

export default function LoadingOverlay({ text = "Loading workspace..." }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 8, 17, 0.85)",
        backdropFilter: "blur(14px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "2px solid rgba(255, 255, 255, 0.15)",
          borderTopColor: "#ffffff",
          borderRadius: "50%",
          animation: "pilot-spin 0.8s linear infinite",
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary, #f1f5f9)",
          letterSpacing: "-0.2px",
        }}
      >
        {text}
      </p>
    </div>
  );
}
