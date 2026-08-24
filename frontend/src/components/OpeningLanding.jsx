import React, { useState } from "react";
import { loginRequest, apiRequest } from "../docpilot/api.js";

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
      if (!data.access_token) {
        setErrorMessage("Invalid credentials. Please check your email and password.");
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
      // Try logging in with demo account or create one
      try {
        const data = await loginRequest("demo@pilotmaster.ai", "demo12345");
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          await onLogin();
          return;
        }
      } catch {
        // If demo user doesn't exist, create it
        await apiRequest("/auth/signup", "POST", {
          username: "demo_pilot",
          email: "demo@pilotmaster.ai",
          password: "demo12345",
        });
        const loginData = await loginRequest("demo@pilotmaster.ai", "demo12345");
        localStorage.setItem("token", loginData.access_token);
        await onLogin();
      }
    } catch (err) {
      // Fallback: regular login with demo credentials
      setEmail("demo@pilotmaster.ai");
      setPassword("demo12345");
      setErrorMessage("Demo initialized. Click Continue to enter.");
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
      await apiRequest("/auth/signup", "POST", { username, email, password });
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.access_token);
      await onLogin();
    } catch (err) {
      setErrorMessage("Signup failed. User or email might already exist.");
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
      setErrorMessage("Email not found.");
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
      setSuccessMessage("Password reset successfully! Please sign in.");
      setAuthMode("login");
      setPassword("");
    } catch (err) {
      setErrorMessage("Reset failed. Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#050811",
        color: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* AMBIENT BACKGROUND GLOW FX */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "15%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-15%",
          right: "10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.04) 50%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "40%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* TOP STATUS HEADER BAR */}
      <header
        style={{
          width: "100%",
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(5, 8, 17, 0.8)",
          backdropFilter: "blur(20px)",
          zIndex: 10,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px", color: "#ffffff" }}>
              PilotMaster
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
              Observable AI Execution Ecosystem
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              fontSize: "12px",
              color: "#4ade80",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            Kernel v2.0 Active
          </div>

          <button
            onClick={handleQuickDemo}
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))",
              border: "1px solid rgba(147, 197, 253, 0.3)",
              color: "#ffffff",
              fontSize: "13px",
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
            ⚡ Quick Demo Access
          </button>
        </div>
      </header>

      {/* MAIN HERO SPLIT VIEW */}
      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "40px",
          padding: "40px 50px",
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          zIndex: 1,
          alignItems: "center",
        }}
      >
        {/* LEFT COLUMN: MAANG-GRADE ARCHITECTURE SHOWCASE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Badge & Title */}
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
                marginBottom: "16px",
              }}
            >
              <span>🔬 Next-Gen RAG Orchestration & Observability</span>
            </div>
            <h1
              style={{
                margin: "0 0 16px",
                fontSize: "44px",
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "-1.2px",
                background: "linear-gradient(135deg, #ffffff 40%, #93c5fd 80%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Enterprise-Grade AI Architecture. Fully Observable.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: 1.65,
                color: "#94a3b8",
                maxWidth: "600px",
              }}
            >
              PilotMaster fuses deep execution tracing, multi-technique query enhancements, and automated benchmarking into a unified, high-throughput intelligence kernel.
            </p>
          </div>

          {/* INTERACTIVE ARCHITECTURE DIAGRAM */}
          <div
            style={{
              borderRadius: "24px",
              background: "rgba(11, 16, 27, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* DIAGRAM HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                paddingBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60a5fa" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ecosystem Topology
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["ecosystem", "docpilot", "tracepilot", "gaugepilot"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: activeTab === tab ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      border: "none",
                      color: activeTab === tab ? "#ffffff" : "#94a3b8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* DIAGRAM CANVAS WITH THREE PILLARS & CENTRAL KERNEL */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 1fr",
                gap: "16px",
                alignItems: "center",
                position: "relative",
                minHeight: "220px",
              }}
            >
              {/* PILLAR 1: DOCPILOT */}
              <div
                onMouseEnter={() => setHoveredNode("docpilot")}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  background:
                    activeTab === "docpilot" || hoveredNode === "docpilot"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(255, 255, 255, 0.03)",
                  border:
                    activeTab === "docpilot" || hoveredNode === "docpilot"
                      ? "1px solid #60a5fa"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: hoveredNode === "docpilot" ? "translateY(-3px)" : "none",
                  boxShadow: hoveredNode === "docpilot" ? "0 8px 24px rgba(59, 130, 246, 0.25)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>📄</span>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#60a5fa" }}>DocPilot</h3>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>
                  Knowledge synthesis, conversation-scoped docs & parent-child chunking.
                </p>
                <div style={{ marginTop: "10px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd" }}>
                    Multi-Turn RAG
                  </span>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.05)", color: "#94a3b8" }}>
                    GFM Tables
                  </span>
                </div>
              </div>

              {/* CENTRAL KERNEL: PILOTCORE */}
              <div
                onMouseEnter={() => setHoveredNode("pilotcore")}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  padding: "20px 16px",
                  borderRadius: "20px",
                  background:
                    activeTab === "ecosystem" || hoveredNode === "pilotcore"
                      ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))"
                      : "rgba(15, 23, 42, 0.8)",
                  border: "2px solid #38bdf8",
                  boxShadow: "0 0 30px rgba(56, 189, 248, 0.25)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Core Execution Kernel
                </div>
                <div style={{ fontSize: "24px", marginTop: "4px" }}>⚡</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#38bdf8" }}>PilotCore</h3>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                    Hybrid Vector + Lexical RRF
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                  <div style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "6px", background: "rgba(56, 189, 248, 0.1)", color: "#7dd3fc", fontWeight: 600 }}>
                    11 Enhancement Techniques
                  </div>
                  <div style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "6px", background: "rgba(168, 85, 247, 0.1)", color: "#d8b4fe", fontWeight: 600 }}>
                    Deterministic Tracing
                  </div>
                </div>
              </div>

              {/* RIGHT PILLARS: TRACEPILOT & GAUGEPILOT */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* PILLAR 2: TRACEPILOT */}
                <div
                  onMouseEnter={() => setHoveredNode("tracepilot")}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    background:
                      activeTab === "tracepilot" || hoveredNode === "tracepilot"
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                    border:
                      activeTab === "tracepilot" || hoveredNode === "tracepilot"
                        ? "1px solid #34d399"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: hoveredNode === "tracepilot" ? "translateX(3px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px" }}>🔍</span>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#34d399" }}>TracePilot</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#cbd5e1", lineHeight: 1.4 }}>
                    Execution telemetry, chunk scores & latency profiler.
                  </p>
                </div>

                {/* PILLAR 3: GAUGEPILOT */}
                <div
                  onMouseEnter={() => setHoveredNode("gaugepilot")}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    background:
                      activeTab === "gaugepilot" || hoveredNode === "gaugepilot"
                        ? "rgba(168, 85, 247, 0.15)"
                        : "rgba(255, 255, 255, 0.03)",
                    border:
                      activeTab === "gaugepilot" || hoveredNode === "gaugepilot"
                        ? "1px solid #c084fc"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: hoveredNode === "gaugepilot" ? "translateX(3px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px" }}>🧪</span>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#c084fc" }}>GaugePilot</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#cbd5e1", lineHeight: 1.4 }}>
                    RAG benchmarking, precision matrices & AI evaluation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* METRIC SPECS ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Query Enhancements", val: "11 Techniques", desc: "Multi-select orchestration" },
              { label: "Retrieval Latency", val: "< 45ms", desc: "FAISS + BM25 RRF fusion" },
              { label: "LLM Synthesizers", val: "Multi-Model", desc: "GPT-OSS-120B / Fast-20B" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "4px 0 2px" }}>
                  {stat.val}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: MAANG-GRADE AUTHENTICATION CARD */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              borderRadius: "28px",
              background: "rgba(13, 19, 33, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(30px)",
              padding: "36px 32px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.1)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            {/* CARD TOP BRAND */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#60a5fa",
                  letterSpacing: "-0.8px",
                }}
              >
                PilotMaster
              </h2>
              <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "13px" }}>
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
                padding: "4px",
                borderRadius: "12px",
                marginBottom: "22px",
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
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: authMode === "login" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                  color: authMode === "login" ? "#ffffff" : "#94a3b8",
                  fontWeight: authMode === "login" ? 700 : 500,
                  fontSize: "13px",
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
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: authMode === "signup" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                  color: authMode === "signup" ? "#ffffff" : "#94a3b8",
                  fontWeight: authMode === "signup" ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Create Account
              </button>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {errorMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginBottom: "16px",
                  lineHeight: 1.4,
                }}
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#86efac",
                  fontSize: "13px",
                  marginBottom: "16px",
                  lineHeight: 1.4,
                }}
              >
                {successMessage}
              </div>
            )}

            {/* FORM BODY */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Password</label>
                    <span
                      onClick={() => {
                        setAuthMode("forgot");
                        setErrorMessage("");
                      }}
                      style={{ fontSize: "12px", color: "#60a5fa", cursor: "pointer" }}
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

                <div style={{ position: "relative", textAlign: "center", margin: "10px 0" }}>
                  <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", position: "absolute", top: "50%", width: "100%" }} />
                  <span style={{ position: "relative", background: "#0d1321", padding: "0 10px", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                    Or Instant Access
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemo}
                  disabled={loading}
                  style={{
                    ...primaryBtnStyle,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    boxShadow: "none",
                  }}
                >
                  ⚡ One-Click Demo Mode
                </button>
              </form>
            )}

            {authMode === "signup" && (
              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
                      <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
                      <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
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
                    fontSize: "13px",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER SPECS */}
      <footer
        style={{
          padding: "20px 50px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#64748b",
          boxSizing: "border-box",
          zIndex: 10,
        }}
      >
        <div>PilotMaster Intelligence Platform © 2026. Built with PilotCore Engine.</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <span>Production & Experimental Dual Mode</span>
          <span>OpenAI / Groq LLM Inference</span>
          <span>Neon Distributed PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.15s ease",
};

const primaryBtnStyle = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
  color: "#ffffff",
  border: "none",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.35)",
  transition: "all 0.15s ease",
};
