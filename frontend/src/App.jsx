import { useEffect, useState } from "react";
import { apiRequest, loginRequest } from "./docpilot/api.js";
import DocPilotDashboard from "./docpilot/pages/Dashboard.jsx";
import TraceExplorer from "./tracepilot/TraceExplorer.jsx";
import { useTheme } from "./ThemeContext.jsx";
import GaugePilot from "./gaugepilot/GaugePilot.jsx";
import OpeningLanding from "./components/OpeningLanding.jsx";
import LoadingOverlay from "./components/LoadingOverlay.jsx";

// ─── THEME HELPER ─────────────────────────────────────────────────────────────
// Must be called INSIDE components so it re-evaluates on every render
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

// Style factories — take theme as arg so they're always fresh
const getInputStyle = (theme) => ({
    width: "100%", padding: "20px 22px", marginBottom: "16px", borderRadius: "14px",
    border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary,
    fontSize: "17px", outline: "none", boxSizing: "border-box",
});

const getPrimaryBtnStyle = (theme) => ({
    width: "100%", padding: "20px", borderRadius: "14px", border: `1px solid ${theme.border}`,
    background: theme.surfaceHover, color: theme.textPrimary, fontSize: "17px", cursor: "pointer",
    fontWeight: "600", marginBottom: "8px", boxSizing: "border-box",
});

const getBtnStyle = (theme) => ({
    padding: "10px 20px", background: theme.surface, color: theme.textSecondary,
    border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", fontSize: "13px",
});

const getLinkStyle = (theme) => ({
    margin: "14px 0 0", color: theme.textSecondary, textAlign: "center", cursor: "pointer", fontSize: "15px",
});

const authTitleStyle = {
    margin: "0 0 8px", fontSize: "64px", fontFamily: "Georgia, serif",
    fontWeight: "600", letterSpacing: "-3px", color: "white", textAlign: "center", lineHeight: 1,
};

function disabledStyle(disabled) {
    return disabled ? { cursor: "not-allowed", opacity: 0.7, transition: "opacity 0.15s" } : { transition: "opacity 0.15s" };
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

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("pilotmaster_mode");
        document.documentElement.classList.remove("experimental-mode");
        setAuth(false);
        setUsername("");
        navigate("/login");
    };

    const onLogin = async () => {
        const data = await apiRequest("/auth/me");
        setUsername(data.username);
        setPlan(data.plan);
        setAuth(true);
        navigate("/home");
    };

    if (loading) {
        const loadingText = currentPath.includes("tracepilot")
            ? "Loading TracePilot workspace..."
            : currentPath.includes("gaugepilot")
            ? "Loading GaugePilot workspace..."
            : currentPath.includes("docpilot")
            ? "Loading DocPilot workspace..."
            : "Loading PilotMaster workspace...";
        return <LoadingOverlay text={loadingText} />;
    }

    if (!auth) {
        return (
            <OpeningLanding
                onLogin={onLogin}
                initialMode={currentPath === "/signup" ? "signup" : currentPath === "/forgot" ? "forgot" : "login"}
            />
        );
    }

    const isExperimental =

        currentPath.includes("experimental") ||
        (experimentMode && !currentPath.includes("production"));

    // Authenticated routes
    if (currentPath.includes("docpilot")) {
        return (
            <DocPilotDashboard
                experimentMode={isExperimental}
                onLogout={logout}
                onHome={() => navigate("/home")}
                onTracePilot={() => navigate(isExperimental ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot")}
                onGaugePilot={() => navigate("/experimentalmode/gaugepilot", true)}
                onToggleMode={(exp) => navigate(exp ? "/experimentalmode/docpilot" : "/productionmode/docpilot", exp)}
            />
        );
    }

    if (currentPath.includes("tracepilot")) {
        return (
            <TraceExplorer
                experimentMode={isExperimental}
                onHome={() => navigate("/home")}
                onDocPilot={() => navigate(isExperimental ? "/experimentalmode/docpilot" : "/productionmode/docpilot")}
                onGaugePilot={() => navigate("/experimentalmode/gaugepilot", true)}
                onToggleMode={(exp) => navigate(exp ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot", exp)}
            />
        );
    }


    if (currentPath.includes("gaugepilot")) {
        return (
            <GaugePilot
                onHome={() => navigate("/home")}
                onDocPilot={() => navigate("/experimentalmode/docpilot")}
                onTracePilot={() => navigate("/experimentalmode/tracepilot")}
            />
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
            style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                width: "100vw",
                height: "100vh",
                boxSizing: "border-box",
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                overflow: "hidden",
            }}
        >
            {/* TOP BAR */}
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 48px",
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

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

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
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "32px", padding: "0 24px" }}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={toggleMode}
                        style={{
                            padding: "8px 20px",
                            borderRadius: "9999px",
                            border: "none",
                            background: experimentMode ? "rgba(168, 85, 247, 0.18)" : "rgba(66, 133, 244, 0.14)",
                            color: experimentMode ? "#c084fc" : "#60a5fa",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.18s ease",
                        }}
                    >
                        {experimentMode ? "← Return to Production Mode" : "🧪 Enter Experimentation Mode"}
                    </button>

                    <h2
                        style={{
                            margin: "12px 0 0",
                            fontSize: "36px",
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

                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
                    <ProductCard
                        name="DocPilot"
                        description="Upload multi-format documents, ask complex questions, and receive grounded answers with citations."
                        tags={["RAG", "Chat", "Document Indexing"]}
                        href={experimentMode ? "/experimentalmode/docpilot" : "/productionmode/docpilot"}
                        onClick={() => onOpen("docpilot")}
                        accent={experimentMode ? "#c084fc" : "#60a5fa"}
                    />
                    <ProductCard
                        name="TracePilot"
                        description="Inspect full execution lifecycles, chunk relevance logits, grounding confidence, and replay traces."
                        tags={["Observability", "Telemetry", "Spans", "Replay"]}
                        href={experimentMode ? "/experimentalmode/tracepilot" : "/productionmode/tracepilot"}
                        onClick={() => onOpen("tracepilot")}
                        accent={experimentMode ? "#c084fc" : "#60a5fa"}
                    />
                    {experimentMode && (
                        <ProductCard
                            name="GaugePilot"
                            description="Benchmark end-to-end RAG pipelines against custom evaluation questions and rank models."
                            tags={["Benchmarking", "Leaderboards", "AI Insights"]}
                            href="/experimentalmode/gaugepilot"
                            onClick={() => onOpen("gaugepilot")}
                            accent="#c084fc"
                        />
                    )}
                </div>

            </div>

            {/* FOOTER */}
            <footer style={{ padding: "18px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    PilotMaster · Powered by PilotCore Kernel
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    GPT-OSS 120B · all-mpnet-base-v2
                </p>

            </footer>
        </div>
    );
}

// ─── PRODUCT CARD (Google Material 3 Elevation Style) ─────────────────────────

function ProductCard({ name, icon, description, tags, href, onClick, accent }) {
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
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "320px",
                padding: "28px 24px",
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
                <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: accent, letterSpacing: "-0.6px", transition: "color 0.15s ease" }}>
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

// ─── AUTH (Google Account Style) ──────────────────────────────────────────────

function Login({ onLogin, goToSignup, goToForgot }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await loginRequest(email, password);
            if (!data.access_token) { alert("Invalid credentials"); return; }
            localStorage.setItem("token", data.access_token);
            await onLogin();
        } catch { alert("Wrong email or password"); }
        finally { setLoading(false); }
    };

    return (
        <AuthShell>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "800", color: "#60a5fa", letterSpacing: "-0.8px" }}>
                    PilotMaster
                </h1>
                <p style={{ margin: "8px 0 2px", fontSize: "16px", fontWeight: "600", color: "#ffffff" }}>
                    Sign in
                </p>
                <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Observable AI Execution Ecosystem
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <input
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={authInputStyle}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && login()}
                    style={authInputStyle}
                />
                <button
                    onClick={login}
                    disabled={loading}
                    style={authButtonStyle}
                >
                    {loading ? <ButtonContent text="Signing in..." /> : "Continue"}
                </button>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                <p onClick={goToSignup} style={authLinkStyle}>
                    Don't have an account? <span style={{ color: "#60a5fa", fontWeight: 600 }}>Create account</span>
                </p>
                <p onClick={goToForgot} style={{ ...authLinkStyle, fontSize: "12px", opacity: 0.7 }}>
                    Forgot password?
                </p>
            </div>
        </AuthShell>
    );
}

function Signup({ goToLogin }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const signup = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await apiRequest("/auth/signup", "POST", { username, email, password });
            alert("Account created. Please sign in.");
            goToLogin();
        } catch { alert("Signup failed"); }
        finally { setLoading(false); }
    };

    return (
        <AuthShell>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "800", color: "#60a5fa", letterSpacing: "-0.8px" }}>
                    PilotMaster
                </h1>
                <p style={{ margin: "8px 0 2px", fontSize: "16px", fontWeight: "600", color: "#ffffff" }}>
                    Create account
                </p>
                <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Get started with PilotMaster AI
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={authInputStyle}
                />
                <input
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={authInputStyle}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={authInputStyle}
                />
                <button
                    onClick={signup}
                    disabled={loading}
                    style={authButtonStyle}
                >
                    {loading ? <ButtonContent text="Creating account..." /> : "Sign Up"}
                </button>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
                <p onClick={goToLogin} style={authLinkStyle}>
                    Already have an account? <span style={{ color: "#60a5fa", fontWeight: 600 }}>Sign in</span>
                </p>
            </div>
        </AuthShell>
    );
}

function ForgotPassword({ goBack }) {
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");
    const [tokenLoading, setTokenLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const generateResetToken = async () => {
        if (tokenLoading) return;
        setTokenLoading(true);
        try {
            const d = await apiRequest("/auth/forgot-password", "POST", { email });
            setGeneratedToken(d.reset_token);
        } catch { alert("Email not found"); }
        finally { setTokenLoading(false); }
    };

    const resetPassword = async () => {
        if (resetLoading) return;
        setResetLoading(true);
        try {
            await apiRequest("/auth/reset-password", "POST", { token, new_password: newPassword });
            alert("Password successfully reset.");
            goBack();
        } catch { alert("Invalid token"); }
        finally { setResetLoading(false); }
    };

    return (
        <AuthShell>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "800", color: "#60a5fa", letterSpacing: "-0.8px" }}>
                    PilotMaster
                </h1>
                <p style={{ margin: "8px 0 2px", fontSize: "16px", fontWeight: "600", color: "#ffffff" }}>
                    Reset password
                </p>
                <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Enter your email to generate a reset token
                </p>
            </div>


            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <input
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={authInputStyle}
                />
                <button
                    onClick={generateResetToken}
                    disabled={tokenLoading}
                    style={{ ...authButtonStyle, background: "rgba(255, 255, 255, 0.08)" }}
                >
                    {tokenLoading ? <ButtonContent text="Generating token..." /> : "Generate Reset Token"}
                </button>

                {generatedToken && (
                    <div style={{ background: "rgba(99, 102, 241, 0.15)", borderRadius: "14px", padding: "12px 16px", fontSize: "12px", color: "#c7d2fe", wordBreak: "break-all" }}>
                        Token: {generatedToken}
                    </div>
                )}

                <input
                    placeholder="Paste Reset Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={authInputStyle}
                />
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={authInputStyle}
                />
                <button
                    onClick={resetPassword}
                    disabled={resetLoading}
                    style={authButtonStyle}
                >
                    {resetLoading ? <ButtonContent text="Resetting..." /> : "Update Password"}
                </button>
            </div>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
                <p onClick={goBack} style={authLinkStyle}>
                    ← Back to Sign in
                </p>
            </div>
        </AuthShell>
    );
}

function AuthShell({ children }) {
    return (
        <div
            style={{
                background: "var(--bg-primary)",
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                boxSizing: "border-box",
                padding: "24px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "28px",
                    background: "rgba(255, 255, 255, 0.03)",
                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
                    padding: "36px 32px",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                }}
            >
                {children}
            </div>
        </div>
    );
}

const authInputStyle = {
    width: "100%",
    padding: "12px 18px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "none",
    borderRadius: "9999px",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
};

const authButtonStyle = {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    color: "white",
    border: "none",
    borderRadius: "9999px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "4px",
    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
    transition: "all 0.15s ease",
};

const authLinkStyle = {
    margin: 0,
    fontSize: "13px",
    color: "var(--text-muted)",
    cursor: "pointer",
    transition: "color 0.15s ease",
};

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────

function Splash({ text = "Loading PilotMaster workspace..." }) {
    return <LoadingOverlay text={text} />;
}


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

