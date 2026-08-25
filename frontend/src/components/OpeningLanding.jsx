import React, { useState } from "react";
import { loginRequest, apiRequest } from "../docpilot/api.js";
import GlossaryDrawer from "./GlossaryDrawer.jsx";
import GlossaryButton from "./GlossaryButton.jsx";

const ARCHITECTURE_DESCRIPTIONS = {
  ecosystem: {
    title: "PilotCore Shared Execution Framework",
    badge: "Core Orchestrator",
    badgeColor: "#38bdf8",
    description:
      "The platform follows a modular architecture centered around PilotCore, a shared execution framework responsible for orchestrating the complete retrieval pipeline. Instead of implementing retrieval logic separately for different applications, PilotCore provides reusable services for document ingestion, retrieval execution, prompt construction, response generation, evaluation, telemetry collection, execution tracing, and benchmark orchestration. This shared framework ensures that every application built on PilotMaster executes the same underlying retrieval pipeline, maintaining consistency between operational usage and experimental evaluation.",
    highlights: [
      "Unified retrieval kernel & deterministic pipeline",
      "11 selectable multi-select query enhancements",
      "FAISS Dense Vector + BM25 Lexical + Reciprocal Rank Fusion",
    ],
  },
  docpilot: {
    title: "DocPilot — Document Intelligence Studio",
    badge: "Interactive Research",
    badgeColor: "#60a5fa",
    description:
      "DocPilot serves as the document intelligence interface through which users upload documents and interact with them using natural language. It supports heterogeneous document ingestion, semantic search, grounded question answering, and conversational document exploration. The application is designed for day-to-day interaction with private knowledge bases while delegating all retrieval and generation tasks to PilotCore.",
    highlights: [
      "Conversation-scoped document indexing & staging",
      "Parent-child chunking & rich GFM table synthesis",
      "ChatGPT-style inline editing & answer regeneration",
    ],
  },
  tracepilot: {
    title: "TracePilot — Full-Stack RAG Observability",
    badge: "Execution Telemetry",
    badgeColor: "#34d399",
    description:
      "TracePilot provides the observability layer of the platform. Every query executed through DocPilot automatically produces an execution trace containing retrieval metadata, ranking information, latency measurements, evaluation metrics, retrieved context, and generation details. These traces are stored and presented through an interactive dashboard that enables retrieval engineers to inspect pipeline behavior, diagnose failures, analyze retrieval quality, and understand the reasoning behind generated responses.",
    highlights: [
      "Real-time step-by-step pipeline execution tracing",
      "Chunk ranking scores, latency profiler & replay engine",
      "Groundedness, faithfulness & semantic coverage metrics",
    ],
  },
  gaugepilot: {
    title: "GaugePilot — Benchmarking & AI Matrix Studio",
    badge: "Evaluation Suite",
    badgeColor: "#c084fc",
    description:
      "GaugePilot extends the platform beyond operational document intelligence by providing a dedicated experimentation and benchmarking environment. Users can evaluate multiple retrieval configurations by combining different retrieval strategies, rerankers, query enhancement techniques, and language models. Benchmark results are aggregated into comparative leaderboards and visualized through analytical charts (scatter plots, radar charts, heatmaps, correlation matrices, Pareto frontiers, and Performance profiles) with deterministic AI-assisted engineering recommendations.",
    highlights: [
      "Automated multi-configuration pipeline benchmarking",
      "Comparative leaderboards & statistical boxplot analytics",
      "Deterministic AI-assisted engineering insight reports",
    ],
  },
};

export default function OpeningLanding({ onLogin, initialMode = "login" }) {
  const [authMode, setAuthMode] = useState(initialMode); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("ecosystem"); // "ecosystem" | "docpilot" | "tracepilot" | "gaugepilot"
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);

  // Forgot password flow states
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      if (!data || !data.access_token) {
        setErrorMessage(typeof data?.detail === "string" ? data.detail : "Invalid credentials. Please check your email and password.");
        return;
      }
      localStorage.setItem("token", data.access_token);
      await onLogin();
    } catch (err) {
      setErrorMessage("Wrong email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      let data = await loginRequest("demo@pilotmaster.ai", "demo12345");
      if (!data || !data.access_token) {
        // Create demo account if not exists
        await apiRequest("/auth/signup", "POST", {
          username: "demo_pilot",
          email: "demo@pilotmaster.ai",
          password: "demo12345",
        });
        data = await loginRequest("demo@pilotmaster.ai", "demo12345");
      }

      if (data && data.access_token) {
        localStorage.setItem("token", data.access_token);
        await onLogin();
      } else {
        setEmail("demo@pilotmaster.ai");
        setPassword("demo12345");
        setErrorMessage("Demo initialized. Click 'Continue to Workspace' below to enter.");
      }
    } catch (err) {
      setEmail("demo@pilotmaster.ai");
      setPassword("demo12345");
      setErrorMessage("Demo initialized. Click 'Continue to Workspace' below to enter.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      const res = await apiRequest("/auth/signup", "POST", { username, email, password });
      if (res?.detail) {
        setErrorMessage(typeof res.detail === "string" ? res.detail : "Signup failed. Username or email might already exist.");
        return;
      }
      const data = await loginRequest(email, password);
      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
        await onLogin();
      } else {
        setSuccessMessage("Account created! Please sign in.");
        setAuthMode("login");
      }
    } catch (err) {
      setErrorMessage("Signup failed. Username or email might already exist.");
    } finally {
      setLoading(false);
    }
  };


  const handleGenerateResetToken = async () => {
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/forgot-password", "POST", { email });
      setResetToken(data.token);
      setSuccessMessage("Reset token generated! Enter your new password below.");
    } catch (err) {
      setErrorMessage("Email address not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", "POST", {
        token: resetToken,
        new_password: newPassword,
      });
      setSuccessMessage("Password reset successfully! You can now sign in.");
      setAuthMode("login");
      setPassword("");
    } catch (err) {
      setErrorMessage("Reset failed. Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  const currentDesc = ARCHITECTURE_DESCRIPTIONS[activeTab] || ARCHITECTURE_DESCRIPTIONS.ecosystem;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#040711",
        color: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* AMBIENT BACKGROUND GLOW EFFECTS */}
      <div
        style={{
          position: "fixed",
          top: "-15%",
          left: "10%",
          width: "650px",
          height: "650px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-10%",
          right: "5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* TOP STATUS HEADER BAR */}
      <header
        style={{
          width: "100%",
          padding: "14px clamp(16px, 4vw, 36px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(4, 7, 17, 0.85)",
          backdropFilter: "blur(20px)",
          zIndex: 10,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 800,
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.5px", color: "#ffffff" }}>
              PilotMaster
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
              Observable AI Ecosystem
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <GlossaryButton onClick={() => setShowGlossary(true)} />
          <button
            onClick={handleQuickDemo}
            title="Instant one-click access with sample data and live Groq inference"
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))",
              border: "1px solid rgba(147, 197, 253, 0.3)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(168, 85, 247, 0.35))";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ⚡ Quick Demo
          </button>
        </div>
      </header>

      {/* MAIN HERO SPLIT VIEW (RESPONSIVE STACK ON MOBILE) */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          padding: "clamp(16px, 3vw, 28px) clamp(16px, 4vw, 40px)",
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          zIndex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
            gap: "28px",
            alignItems: "center",
            width: "100%",
          }}
        >
        {/* LEFT COLUMN: ARCHITECTURE TOPOLOGY & DEEP DIVE DESCRIPTION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%", minWidth: 0 }}>
          {/* Main Title & Ecosystem Subtitle */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "9999px",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                fontSize: "12px",
                color: "#93c5fd",
                fontWeight: 600,
                marginBottom: "8px",
                maxWidth: "100%",
              }}
            >
              <span>🔬 Next-Gen RAG Orchestration & Observability</span>
            </div>
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 900,
                letterSpacing: "-1px",
                background: "linear-gradient(135deg, #ffffff 30%, #93c5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.15,
              }}
            >
              Enterprise-Grade Multi-Doc RAG & Evaluation
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "#94a3b8",
                lineHeight: 1.6,
                maxWidth: "540px",
              }}
            >
              Unified runtime pairing conversational knowledge synthesis, fine-grained telemetry tracing, and reproducible benchmark evaluations.
            </p>
          </div>

          {/* INTERACTIVE ARCHITECTURE TOPOLOGY MAP (RESPONSIVE) */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.65)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "16px",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                paddingBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentDesc.badgeColor, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentDesc.title}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px", overflowX: "auto", maxWidth: "100%", paddingBottom: "2px" }}>
                {["ecosystem", "docpilot", "tracepilot", "gaugepilot"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: "6px",
                      background: activeTab === tab ? "rgba(255, 255, 255, 0.12)" : "transparent",
                      border: activeTab === tab ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid transparent",
                      color: activeTab === tab ? "#ffffff" : "#94a3b8",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* TOPOLOGY NODES GRID (RESPONSIVE WRAP) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                gap: "10px",
                alignItems: "stretch",
                marginBottom: "14px",
              }}
            >
              {/* PILLAR 1: DOCPILOT */}
              <div
                onClick={() => setActiveTab("docpilot")}
                onMouseEnter={() => setHoveredNode("docpilot")}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background:
                    activeTab === "docpilot" || hoveredNode === "docpilot"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(255, 255, 255, 0.03)",
                  border:
                    activeTab === "docpilot" || hoveredNode === "docpilot"
                      ? "1px solid #60a5fa"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  transform: hoveredNode === "docpilot" ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "15px" }}>📄</span>
                  <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#60a5fa" }}>DocPilot</h3>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
                  Document intelligence & grounded natural language synthesis.
                </p>
              </div>

              {/* CENTRAL KERNEL: PILOTCORE */}
              <div
                onClick={() => setActiveTab("ecosystem")}
                onMouseEnter={() => setHoveredNode("pilotcore")}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  padding: "14px 10px",
                  borderRadius: "16px",
                  background:
                    activeTab === "ecosystem" || hoveredNode === "pilotcore"
                      ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))"
                      : "rgba(15, 23, 42, 0.8)",
                  border: "2px solid #38bdf8",
                  boxShadow: "0 0 24px rgba(56, 189, 248, 0.25)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-9px",
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "9999px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Core Kernel
                </div>
                <div style={{ fontSize: "18px" }}>⚡</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "#38bdf8" }}>PilotCore</h3>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Hybrid Vector + Lexical RRF
                  </div>
                </div>
                <div style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "4px", background: "rgba(56, 189, 248, 0.12)", color: "#7dd3fc", fontWeight: 600 }}>
                  11 Enhancements · Tracing
                </div>
              </div>

              {/* RIGHT PILLARS: TRACEPILOT & GAUGEPILOT */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  onClick={() => setActiveTab("tracepilot")}
                  onMouseEnter={() => setHoveredNode("tracepilot")}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background:
                      activeTab === "tracepilot" || hoveredNode === "tracepilot"
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                    border:
                      activeTab === "tracepilot" || hoveredNode === "tracepilot"
                        ? "1px solid #34d399"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px" }}>🔍</span>
                    <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "#34d399" }}>TracePilot</h4>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Execution telemetry & latency profiler.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("gaugepilot")}
                  onMouseEnter={() => setHoveredNode("gaugepilot")}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background:
                      activeTab === "gaugepilot" || hoveredNode === "gaugepilot"
                        ? "rgba(168, 85, 247, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                    border:
                      activeTab === "gaugepilot" || hoveredNode === "gaugepilot"
                        ? "1px solid #c084fc"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px" }}>🧪</span>
                    <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "#c084fc" }}>GaugePilot</h4>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    RAG benchmarking & AI matrix evaluation.
                  </p>
                </div>
              </div>
            </div>

            {/* AUTHORITATIVE ECOSYSTEM TEXT & HIGHLIGHTS */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <p style={{ margin: "0 0 10px", fontSize: "12.5px", lineHeight: 1.6, color: "#cbd5e1" }}>
                {currentDesc.description}
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {currentDesc.highlights.map((h, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "12px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#93c5fd",
                      fontWeight: 500,
                    }}
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAANG-GRADE BALANCED AUTHENTICATION CARD */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              borderRadius: "24px",
              background: "rgba(13, 19, 33, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(30px)",
              padding: "clamp(20px, 4vw, 30px) clamp(16px, 3.5vw, 28px)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.08)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            {/* BRAND TITLE */}
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#60a5fa",
                  letterSpacing: "-0.6px",
                }}
              >
                PilotMaster
              </h2>
              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "12.5px" }}>
                {authMode === "login"
                  ? "Sign in to access your intelligence workspace"
                  : authMode === "signup"
                  ? "Create your enterprise research account"
                  : "Reset your workspace password"}
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "3px",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "7px",
                  borderRadius: "7px",
                  border: "none",
                  background: authMode === "login" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                  color: authMode === "login" ? "#ffffff" : "#94a3b8",
                  fontWeight: authMode === "login" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "7px",
                  borderRadius: "7px",
                  border: "none",
                  background: authMode === "signup" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                  color: authMode === "signup" ? "#ffffff" : "#94a3b8",
                  fontWeight: authMode === "signup" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Create Account
              </button>
            </div>

            {/* ALERTS */}
            {errorMessage && (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  fontSize: "12px",
                  marginBottom: "14px",
                  lineHeight: 1.4,
                }}
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#86efac",
                  fontSize: "12px",
                  marginBottom: "14px",
                  lineHeight: 1.4,
                }}
              >
                {successMessage}
              </div>
            )}

            {/* AUTH FORMS */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <label style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: 600 }}>Password</label>
                    <span
                      onClick={() => {
                        setAuthMode("forgot");
                        setErrorMessage("");
                      }}
                      style={{ fontSize: "11.5px", color: "#60a5fa", cursor: "pointer" }}
                    >
                      Forgot?
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={primaryBtnStyle}
                >
                  {loading ? "Authenticating..." : "Continue to Workspace →"}
                </button>

                <div style={{ position: "relative", textAlign: "center", margin: "6px 0" }}>
                  <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", position: "absolute", top: "50%", width: "100%" }} />
                  <span style={{ position: "relative", background: "#0d1321", padding: "0 8px", fontSize: "10.5px", color: "#64748b", textTransform: "uppercase" }}>
                    Instant Guest Access
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemo}
                  disabled={loading}
                  title="One-click sandbox access with active Groq models"
                  style={{
                    ...primaryBtnStyle,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    boxShadow: "none",
                    padding: "10px",
                  }}
                >
                  ⚡ One-Click Demo Mode
                </button>
              </form>
            )}

            {authMode === "signup" && (
              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pilot_analyst"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={primaryBtnStyle}
                >
                  {loading ? "Creating Account..." : "Create Account →"}
                </button>
              </form>
            )}

            {authMode === "forgot" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {!resetToken ? (
                  <button
                    type="button"
                    onClick={handleGenerateResetToken}
                    disabled={loading || !email}
                    style={primaryBtnStyle}
                  >
                    {loading ? "Generating..." : "Generate Reset Token"}
                  </button>
                ) : (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                        Reset Token
                      </label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", color: "#94a3b8", marginBottom: "5px", fontWeight: 600 }}>
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={loading || !newPassword}
                      style={primaryBtnStyle}
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "12px",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>

      {/* FOOTER BAR */}
      <footer
        style={{
          padding: "14px clamp(16px, 4vw, 36px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "11px",
          color: "#64748b",
          boxSizing: "border-box",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div>PilotMaster Intelligence Platform © 2026. Powered by PilotCore Kernel.</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span>Dual Mode (Production & Lab)</span>
          <span>Active Groq Models</span>
          <span>PostgreSQL Observability</span>
        </div>
      </footer>

      {/* CONTEXT-AWARE GLOSSARY DRAWER */}
      <GlossaryDrawer
        isOpen={showGlossary}
        onClose={() => setShowGlossary(false)}
        page="landing"
        mode="all"
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#ffffff",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.15s ease",
};

const primaryBtnStyle = {
  width: "100%",
  padding: "11px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
  color: "#ffffff",
  border: "none",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
  transition: "all 0.15s ease",
};
