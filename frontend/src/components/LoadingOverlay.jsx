import React from "react";

export default function LoadingOverlay({
  text = "Loading workspace...",
  subtext = "Observable AI Execution Ecosystem",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, rgba(15, 23, 42, 0.96) 0%, rgba(5, 8, 17, 0.99) 100%)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        gap: "20px",
        padding: "24px",
        boxSizing: "border-box",
        animation: "pilot-fade-in 0.2s ease-out",
      }}
    >
      {/* GLOWING ROTATING WHEEL COMPONENT */}
      <div
        style={{
          position: "relative",
          width: "72px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ambient Glow Aura */}
        <div
          style={{
            position: "absolute",
            inset: "-8px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(168, 85, 247, 0.2) 60%, transparent 80%)",
            filter: "blur(8px)",
            animation: "pilot-orbit-glow 2s infinite ease-in-out",
          }}
        />

        {/* Outer Rotating Wheel Ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3.5px solid transparent",
            borderTopColor: "#60a5fa",
            borderRightColor: "#a855f7",
            borderBottomColor: "rgba(59, 130, 246, 0.2)",
            borderLeftColor: "transparent",
            animation: "pilot-spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite",
            boxShadow: "0 0 16px rgba(96, 165, 250, 0.4)",
          }}
        />

        {/* Inner Counter-Rotating Wheel Ring */}
        <div
          style={{
            position: "absolute",
            inset: "9px",
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "#c084fc",
            borderLeftColor: "#38bdf8",
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            animation: "pilot-spin-reverse 1.2s linear infinite",
          }}
        />

        {/* Core Center Pulse Dot */}
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)",
            boxShadow: "0 0 12px rgba(192, 132, 252, 0.8)",
            animation: "pilot-orbit-glow 1.5s infinite ease-in-out",
          }}
        />
      </div>

      {/* STATUS & LOADING TEXT */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px", maxWidth: "360px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.3px",
            background: "linear-gradient(135deg, #ffffff 30%, #93c5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {text}
        </h2>
        {subtext && (
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 500,
              color: "#94a3b8",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
