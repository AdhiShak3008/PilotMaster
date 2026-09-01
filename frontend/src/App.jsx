import { useEffect, useState, lazy, Suspense } from "react";
import { apiRequest, loginRequest } from "./docpilot/api.js";
import { useTheme } from "./ThemeContext.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import GlossaryButton from "./components/GlossaryButton.jsx";

// ─── LAZY LOADED ROUTE CHUNKS FOR FAST PAGE LOADS ──────────────────────────────
const DocPilotDashboard = lazy(() => import("./docpilot/pages/Dashboard.jsx"));
const TraceExplorer = lazy(() => import("./tracepilot/TraceExplorer.jsx"));
const GaugePilot = lazy(() => import("./gaugepilot/GaugePilot.jsx"));
const OpeningLanding = lazy(() => import("./components/OpeningLanding.jsx"));
const GlossaryDrawer = lazy(() => import("./components/GlossaryDrawer.jsx"));

// Preload utilities to preload chunks on intent (hover / touch)
const preloadDocPilot = () => import("./docpilot/pages/Dashboard.jsx");
const preloadTracePilot = () => import("./tracepilot/TraceExplorer.jsx");
const preloadGaugePilot = () => import("./gaugepilot/GaugePilot.jsx");
const preloadGlossary = () => import("./components/GlossaryDrawer.jsx");

// ─── THEME HELPER ─────────────────────────────────────────────────────────────
function getTheme() {
    return {
        bgPrimary: "var(--bg-primary)",
        bgSecondary: "var(--bg-secondary)",
        surface: "var(--surface)",
        surfaceHover: "var(--surface-hover)",
        surfaceStrong: "var(--surface-strong)",
        border: "var(--border)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        success: "var(--success)",
        purple: "var(--purple)",
        danger: "var(--danger)",
    };
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
    const { experimentMode, setExperimentMode } = useTheme();
    const [auth, setAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(window.location.pathname || "/");
    const [username, setUsername] = useState("");
    const [plan, setPlan] = useState("free");

    const navigate = (path, overrideMode = null) => {
        if (overrideMode !== null) {
            setExperimentMode(overrideMode);
        } else if (path.includes("/experimental") || path.includes("/experimentalmode")) {
            setExperimentMode(true);
        } else if (path.includes("/production") || path.includes("/productionmode")) {
            setExperimentMode(false);
        }
        window.history.pushState({}, "", path);
        setCurrentPath(path);
    };

    useEffect(() => {
        const onPopState = () => {
            const path = window.location.pathname;
            if (path.includes("/experimental") || path.includes("/experimentalmode")) {
                setExperimentMode(true);
            } else if (path.includes("/production") || path.includes("/productionmode")) {
                setExperimentMode(false);
            }
            setCurrentPath(path);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [setExperimentMode]);

    useEffect(() => {
        const validate = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                if (currentPath !== "/signup" && currentPath !== "/forgot") {
                    navigate("/login");
                }
                return;
            }
            try {
                const data = await apiRequest("/auth/me");
                if (data.email) {
                    setAuth(true);
                    setUsername(data.username);
                    setPlan(data.plan);
                    if (currentPath === "/login" || currentPath === "/signup" || currentPath === "/forgot" || currentPath === "/") {
                        navigate("/home");
                    }
                } else {
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            } catch {
                localStorage.removeItem("token");
                navigate("/login");
            }
            setLoading(false);
        };
        validate();
    }, []);

    const [pageLoading, setPageLoading] = useState(false);
    const [pageLoadingText, setPageLoadingText] = useState("Loading workspace...");
    const [pageLoadingSubtext, setPageLoadingSubtext] = useState("Observable AI Execution Ecosystem");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("pilotmaster_mode");
        document.documentElement.classList.remove("experimental-mode");
        setAuth(false);
        setUsername("");
        navigate("/login");
    };

    const onLogin = async (customMessage = "Entering PilotMaster Workspace...", customSubtext = "Observable AI Execution Ecosystem") => {
        setPageLoadingText(customMessage);
        setPageLoadingSubtext(customSubtext);
        setPageLoading(true);
        try {
            const data = await apiRequest("/auth/me");
            if (data?.email) {
                setUsername(data.username);
                setPlan(data.plan);
                setAuth(true);
                navigate("/home");
            }
        } catch (err) {
            console.error("Login sync failed", err);
        } finally {
            // Keep the rotating wheel visible for a smooth, high-fidelity transition into the Home workspace
            setTimeout(() => {
                setPageLoading(false);
            }, 600);
        }
    };

    if (loading || pageLoading) {
        const loadingText = pageLoading
            ? pageLoadingText
            : currentPath.includes("tracepilot")
            ? "Loading TracePilot workspace..."
            : currentPath.includes("gaugepilot")
            ? "Loading GaugePilot workspace..."
            : currentPath.includes("docpilot")
            ? "Loading DocPilot workspace..."
            : "Loading PilotMaster workspace...";
        const loadingSub = pageLoading
            ? pageLoadingSubtext
            : "Observable AI Execution Ecosystem";
        return <LoadingOverlay text={loadingText} subtext={loadingSub} />;
    }

    if (!auth) {
        return (
            <Suspense fallback={<LoadingOverlay text="Loading login portal..." />}>
                <OpeningLanding
                    onLogin={onLogin}
                    initialMode={currentPath === "/signup" ? "signup" : currentPath === "/forgot" ? "forgot" : "login"}
                />
            </Suspense>
        );
    }

    const isExperimental =
        currentPath.includes("experimental") ||
        (experimentMode && !currentPath.includes("production"));

    // Authenticated routes with Suspense
    if (currentPath.includes("docpilot")) {
        return (
            <Suspense fallback={<LoadingOverlay text={isExperimental ? "Loading Experimental DocPilot..." : "Loading Production DocPilot..."} />}>
                <DocPilotDashboard
                    experimentMode={isExperimental}
                    onLogout={logout}
                    onHome={() => navigate("/home")}
                    onTracePilot={() => navigate(isExperimental ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot")}
                    onGaugePilot={() => navigate("/experimentalmode/gaugepilot", true)}
                    onToggleMode={(exp) => navigate(exp ? "/experimentalmode/docpilot" : "/productionmode/docpilot", exp)}
                />
            </Suspense>
        );
    }

    if (currentPath.includes("tracepilot")) {
        return (
            <Suspense fallback={<LoadingOverlay text={isExperimental ? "Loading Experimental TracePilot..." : "Loading Production TracePilot..."} />}>
                <TraceExplorer
                    experimentMode={isExperimental}
                    onHome={() => navigate("/home")}
                    onDocPilot={() => navigate(isExperimental ? "/experimentalmode/docpilot" : "/productionmode/docpilot")}
                    onGaugePilot={() => navigate("/experimentalmode/gaugepilot", true)}
                    onToggleMode={(exp) => navigate(exp ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot", exp)}
                />
            </Suspense>
        );
    }

    if (currentPath.includes("gaugepilot")) {
        return (
            <Suspense fallback={<LoadingOverlay text="Loading GaugePilot Benchmark Studio..." />}>
                <GaugePilot
                    onHome={() => navigate("/home")}
                    onDocPilot={() => navigate("/experimentalmode/docpilot")}
                    onTracePilot={() => navigate("/experimentalmode/tracepilot")}
                />
            </Suspense>
        );
    }

    return (
        <PilotMasterHome
            username={username}
            plan={plan}
            onOpen={(screen) => {
                const target = experimentMode ? `/experimentalmode/${screen}` : `/productionmode/${screen}`;
                navigate(target);
            }}
            onLogout={logout}
        />
    );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function PilotMasterHome({ username, plan, onOpen, onLogout }) {
    const { experimentMode, toggleMode } = useTheme();
    const [currentPlan, setCurrentPlan] = useState(plan);
    const [planLoading, setPlanLoading] = useState(false);
    const [showGlossary, setShowGlossary] = useState(false);

    // Warm-up preload in idle time
    useEffect(() => {
        preloadDocPilot();
        preloadTracePilot();
        if (experimentMode) preloadGaugePilot();
        preloadGlossary();
    }, [experimentMode]);

    const upgradePlan = async () => {
        if (planLoading) return;
        setPlanLoading(true);
        try {
            const data = await apiRequest("/billing/upgrade", "POST");
            setCurrentPlan(data.plan);
        } catch { alert("Upgrade failed"); }
        finally { setPlanLoading(false); }
    };

    const downgradePlan = async () => {
        if (planLoading) return;
        setPlanLoading(true);
        try {
            const data = await apiRequest("/billing/downgrade", "POST");
            setCurrentPlan(data.plan);
        } catch { alert("Downgrade failed"); }
        finally { setPlanLoading(false); }
    };

    return (
        <div
            key={experimentMode ? "exp" : "prod"}
            className="pilot-home"
            style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                width: "100vw",
                minHeight: "100dvh",
                boxSizing: "border-box",
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
            }}
        >
            {/* TOP BAR */}
            <header
                className="pilot-home-topbar"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 48px",
                    flexWrap: "wrap",
                    gap: "14px",
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "30px",
                            fontWeight: "800",
                            letterSpacing: "-0.8px",
                            color: experimentMode ? "#c084fc" : "#60a5fa",
                        }}
                    >
                        PilotMaster
                    </h1>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                        Observable AI Execution Ecosystem
                    </p>
                </div>

                <div className="pilot-home-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <GlossaryButton
                        onClick={() => setShowGlossary(true)}
                        experimentMode={experimentMode}
                    />

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 14px",
                            borderRadius: "9999px",
                            background: "rgba(255, 255, 255, 0.04)",
                            fontSize: "12px",
                        }}
                    >
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>@{username}</span>
                        <span style={{ color: "var(--text-muted)" }}>·</span>
                        <span style={{ color: currentPlan === "pro" ? "#34d399" : "#60a5fa", fontWeight: 700, textTransform: "uppercase", fontSize: "10px" }}>
                            {currentPlan}
                        </span>
                    </div>

                    {currentPlan === "free" ? (
                        <button
                            onClick={upgradePlan}
                            disabled={planLoading}
                            style={{
                                padding: "7px 16px",
                                borderRadius: "9999px",
                                background: "rgba(255, 255, 255, 0.08)",
                                color: "var(--text-primary)",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 600,
                                transition: "all 0.15s ease",
                            }}
                        >
                            {planLoading ? <ButtonContent text="Upgrading..." /> : "Upgrade to Pro"}
                        </button>
                    ) : (
                        <button
                            onClick={downgradePlan}
                            disabled={planLoading}
                            style={{
                                padding: "7px 16px",
                                borderRadius: "9999px",
                                background: "rgba(255, 255, 255, 0.05)",
                                color: "var(--text-muted)",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                            }}
                        >
                            {planLoading ? <ButtonContent text="Downgrading..." /> : "Downgrade"}
                        </button>
                    )}

                    <button
                        onClick={onLogout}
                        style={{
                            padding: "7px 16px",
                            borderRadius: "9999px",
                            background: "transparent",
                            color: "var(--text-muted)",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* CENTER */}
            <div className="pilot-home-center" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "28px", padding: "20px 24px" }}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={toggleMode}
                        className="interactive-mode-btn"
                        style={{
                            padding: "10px 22px",
                            borderRadius: "9999px",
                            border: experimentMode
                                ? "1px solid rgba(192, 132, 252, 0.55)"
                                : "1px solid rgba(96, 165, 250, 0.55)",
                            background: experimentMode
                                ? "linear-gradient(135deg, rgba(88, 28, 135, 0.35) 0%, rgba(147, 51, 234, 0.25) 50%, rgba(219, 39, 119, 0.25) 100%)"
                                : "linear-gradient(135deg, rgba(29, 78, 216, 0.3) 0%, rgba(99, 102, 241, 0.3) 50%, rgba(168, 85, 247, 0.3) 100%)",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontSize: "13.5px",
                            fontWeight: "700",
                            letterSpacing: "-0.2px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            animation: experimentMode
                                ? "pilot-mode-pulse-exp 3.2s infinite ease-in-out"
                                : "pilot-mode-pulse-prod 3.2s infinite ease-in-out",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        {experimentMode ? (
                            <>
                                <span style={{ fontSize: "14px", opacity: 0.9 }}>←</span>
                                <span>Return to Production Mode</span>
                                <span
                                    style={{
                                        background: "rgba(59, 130, 246, 0.22)",
                                        border: "1px solid rgba(147, 197, 253, 0.4)",
                                        borderRadius: "9999px",
                                        padding: "2px 8px",
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        color: "#93c5fd",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: "#60a5fa",
                                            display: "inline-block",
                                            animation: "pilot-beacon-ping-blue 1.8s infinite",
                                        }}
                                    />
                                    PROD
                                </span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: "16px", display: "inline-block", animation: "icon-float 2.5s infinite ease-in-out" }}>
                                    🧪
                                </span>
                                <span>Enter Experimentation Mode</span>
                                <span
                                    style={{
                                        background: "rgba(236, 72, 153, 0.22)",
                                        border: "1px solid rgba(244, 114, 182, 0.45)",
                                        borderRadius: "9999px",
                                        padding: "2px 8px",
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        color: "#f472b6",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: "#f472b6",
                                            display: "inline-block",
                                            animation: "pilot-beacon-ping 1.8s infinite",
                                        }}
                                    />
                                    LAB
                                </span>
                                <span style={{ fontSize: "14px", opacity: 0.8 }}>→</span>
                            </>
                        )}
                    </button>

                    <h2
                        style={{
                            margin: "12px 0 0",
                            fontSize: "clamp(24px, 4vw, 36px)",
                            fontWeight: "700",
                            letterSpacing: "-1px",
                            color: "#ffffff",
                        }}
                    >
                        Select a Workspace
                    </h2>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px" }}>
                        {experimentMode
                            ? "Advanced RAG laboratory with configurable chunking, embeddings, and benchmarking."
                            : "Production-grade document Q&A, knowledge search, and real-time execution observability."}
                    </p>
                </div>

                <div className="pilot-home-grid" style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: "1100px" }}>
                    <ProductCard
                        name="DocPilot"
                        description="Upload multi-format documents, ask complex questions, and receive grounded answers with citations."
                        tags={["RAG", "Chat", "Document Indexing"]}
                        href={experimentMode ? "/experimentalmode/docpilot" : "/productionmode/docpilot"}
                        onClick={() => onOpen("docpilot")}
                        onPreload={preloadDocPilot}
                        accent={experimentMode ? "#c084fc" : "#60a5fa"}
                    />
                    <ProductCard
                        name="TracePilot"
                        description="Inspect full execution lifecycles, chunk relevance logits, grounding confidence, and replay traces."
                        tags={["Observability", "Telemetry", "Spans", "Replay"]}
                        href={experimentMode ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot"}
                        onClick={() => onOpen("tracepilot")}
                        onPreload={preloadTracePilot}
                        accent={experimentMode ? "#c084fc" : "#60a5fa"}
                    />
                    {experimentMode && (
                        <ProductCard
                            name="GaugePilot"
                            description="Benchmark end-to-end RAG pipelines against custom evaluation questions and rank models."
                            tags={["Benchmarking", "Leaderboards", "AI Insights"]}
                            href="/experimentalmode/gaugepilot"
                            onClick={() => onOpen("gaugepilot")}
                            onPreload={preloadGaugePilot}
                            accent="#c084fc"
                        />
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <footer className="pilot-home-footer" style={{ padding: "18px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    PilotMaster · Powered by PilotCore Kernel
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    GPT-OSS 120B · all-mpnet-base-v2
                </p>
            </footer>

            {/* CONTEXT-AWARE GLOSSARY DRAWER */}
            <Suspense fallback={null}>
                <GlossaryDrawer
                    isOpen={showGlossary}
                    onClose={() => setShowGlossary(false)}
                    page="home"
                    mode={experimentMode ? "exp" : "prod"}
                />
            </Suspense>
        </div>
    );
}

// ─── PRODUCT CARD (Elevation & Preload Optimized) ─────────────────────────────

function ProductCard({ name, description, tags, href, onClick, onPreload, accent }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={href}
            className="pilot-product-card"
            onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onClick();
                }
            }}
            onMouseEnter={() => {
                setHovered(true);
                onPreload?.();
            }}
            onTouchStart={() => {
                onPreload?.();
            }}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "100%",
                maxWidth: "340px",
                padding: "26px 22px",
                borderRadius: "24px",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
                background: hovered ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.03)",
                boxShadow: hovered ? "0 16px 40px rgba(0, 0, 0, 0.3)" : "none",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: accent, letterSpacing: "-0.6px", transition: "color 0.15s ease" }}>
                    {name}
                </h3>
                <span style={{ fontSize: "18px", color: hovered ? "#ffffff" : accent, transition: "color 0.15s" }}>
                    →
                </span>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {description}
            </p>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "auto" }}>
                {tags.map((tag) => (
                    <span
                        key={tag}
                        style={{
                            fontSize: "10px",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            background: "rgba(255, 255, 255, 0.04)",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                        }}
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </a>
    );
}

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────

function Spinner({ size = 16 }) {
    return (
        <span style={{
            width: `${size}px`, height: `${size}px`, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "9999px", display: "inline-block",
            animation: "pilot-spin 0.8s linear infinite",
        }} />
    );
}

function ButtonContent({ text }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Spinner />{text}
        </span>
    );
}
