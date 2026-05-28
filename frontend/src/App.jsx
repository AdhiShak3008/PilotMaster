import { useEffect, useState } from "react";
import { apiRequest, loginRequest } from "./docpilot/api.js";
import DocPilotDashboard from "./docpilot/pages/Dashboard.jsx";
import TraceExplorer from "./tracepilot/TraceExplorer.jsx";

export default function App() {
    const [auth, setAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [screen, setScreen] = useState("login");
    const [username, setUsername] = useState("");
    const [plan, setPlan] = useState("free");

    useEffect(() => {
        const validate = async () => {
            const token = localStorage.getItem("token");
            if (!token) { setLoading(false); return; }
            try {
                const data = await apiRequest("/auth/me");
                if (data.email) {
                    setAuth(true);
                    setUsername(data.username);
                    setPlan(data.plan);
                    setScreen("home");
                } else {
                    localStorage.removeItem("token");
                }
            } catch {
                localStorage.removeItem("token");
            }
            setLoading(false);
        };
        validate();
    }, []); // runs once only on mount

    const logout = () => {
        localStorage.removeItem("token");
        setAuth(false);
        setScreen("login");
        setUsername("");
    };

    const onLogin = async () => {
        const data = await apiRequest("/auth/me");
        setUsername(data.username);
        setPlan(data.plan);
        setAuth(true);
        setScreen("home");
    };

    if (loading) return <Splash />;

    if (!auth) {
        if (screen === "signup") return <Signup goToLogin={() => setScreen("login")} />;
        if (screen === "forgot") return <ForgotPassword goBack={() => setScreen("login")} />;
        return <Login onLogin={onLogin} goToSignup={() => setScreen("signup")} goToForgot={() => setScreen("forgot")} />;
    }

    if (screen === "docpilot") return (
        <DocPilotDashboard
            onLogout={logout}
            onHome={() => setScreen("home")}
            onTracePilot={() => setScreen("tracepilot")}
        />
    );

    if (screen === "tracepilot") return (
        <TraceExplorer
            onHome={() => setScreen("home")}
            onDocPilot={() => setScreen("docpilot")}
        />
    );

    return <PilotMasterHome username={username} plan={plan} onOpen={setScreen} onLogout={logout} />;
}

// ─── HOME ────────────────────────────────────────────────────────────────────

function PilotMasterHome({ username, plan, onOpen, onLogout }) {
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
        <div className="pilot-home" style={{
            background: "#0d0d0d", color: "white", fontFamily: "Arial",
            width: "100vw", height: "100vh", boxSizing: "border-box",
            display: "grid", gridTemplateRows: "auto 1fr auto", overflow: "hidden",
        }}>
            {/* TOP BAR */}
            <div className="pilot-home-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid #1a1a1a" }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "34px", fontFamily: "Georgia, serif", fontWeight: "600", letterSpacing: "-1.5px", color: "white" }}>PilotMaster</h1>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#999", letterSpacing: "0.05em" }}>observable AI execution ecosystem</p>
                </div>
                <div className="pilot-home-actions" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#aaa" }}>{username}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>{currentPlan}</p>
                    </div>
                    {currentPlan === "free" ? (
                        <button onClick={upgradePlan} disabled={planLoading} style={{ ...btnStyle, color: "#ccc", borderColor: "#555", ...disabledStyle(planLoading) }}>
                            {planLoading ? <ButtonContent text="Loading..." /> : "Upgrade to Pro"}
                        </button>
                    ) : (
                        <button onClick={downgradePlan} disabled={planLoading} style={{ ...btnStyle, color: "#888", ...disabledStyle(planLoading) }}>
                            {planLoading ? <ButtonContent text="Loading..." /> : "Downgrade"}
                        </button>
                    )}
                    <button onClick={onLogout} style={btnStyle}>Logout</button>
                </div>
            </div>

            {/* CENTER */}
            <div className="pilot-home-center" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "28px" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase" }}>select a workspace</p>
                <div className="pilot-home-grid" style={{ display: "flex", gap: "20px" }}>
                    <ProductCard
                        name="DocPilot"
                        description="Upload documents. Chat with them. Manage your knowledge base."
                        tags={["RAG", "Chat", "Documents", "Auth"]}
                        onClick={() => onOpen("docpilot")}
                        accent="#cccccc"
                    />
                    <ProductCard
                        name="TracePilot"
                        description="Observe every execution. Inspect traces, chunks, evaluation scores and spans."
                        tags={["Traces", "Evaluation", "Observability", "Replay"]}
                        onClick={() => onOpen("tracepilot")}
                        accent="#cccccc"
                    />
                </div>
            </div>

            {/* FOOTER */}
            <div className="pilot-home-footer" style={{ padding: "14px 48px", borderTop: "1px solid #161616", display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>PilotMaster · execution kernel: PilotCore</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>llama-3.1-8b-instant · all-mpnet-base-v2</p>
            </div>
        </div>
    );
}

function ProductCard({ name, description, tags, onClick, accent }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="pilot-product-card"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "320px", padding: "28px", borderRadius: "14px", cursor: "pointer",
                background: hovered ? "#171717" : "#101010",
                border: `1px solid ${hovered ? "#313131" : "#232323"}`,
                transition: "all 0.15s ease",
                display: "flex", flexDirection: "column", gap: "14px",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "600", letterSpacing: "-1px", color: "white" }}>{name}</h2>
                <span style={{ fontSize: "18px", color: hovered ? accent : "#2a2a2a", transition: "color 0.15s" }}>→</span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#bbb", lineHeight: 1.6 }}>{description}</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {tags.map(tag => (
                    <span key={tag} style={{
                        fontSize: "10px", padding: "3px 8px", borderRadius: "4px",
                        background: accent + "15", color: accent, border: `1px solid ${accent}25`,
                        letterSpacing: "0.05em", textTransform: "uppercase",
                    }}>{tag}</span>
                ))}
            </div>
        </div>
    );
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

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
            <h1 className="auth-title" style={authTitleStyle}>PilotMaster</h1>
            <p style={{ margin: "0 0 36px", color: "#3a3a3a", fontSize: "14px", textAlign: "center" }}>observable AI execution ecosystem</p>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()} style={inputStyle} />
            <button onClick={login} disabled={loading} style={{ ...primaryBtnStyle, ...disabledStyle(loading) }}>
                {loading ? <ButtonContent text="Loading..." /> : "Login"}
            </button>
            <p onClick={goToSignup} style={linkStyle}>Don't have an account? Sign up</p>
            <p onClick={goToForgot} style={{ ...linkStyle, color: "#3a3a3a", marginTop: "10px" }}>Forgot password?</p>
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
            alert("Account created. Please login.");
            goToLogin();
        } catch { alert("Signup failed"); }
        finally { setLoading(false); }
    };

    return (
        <AuthShell>
            <h1 className="auth-title" style={authTitleStyle}>PilotMaster</h1>
            <p style={{ margin: "0 0 36px", color: "#3a3a3a", fontSize: "14px", textAlign: "center" }}>create your account</p>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            <button onClick={signup} disabled={loading} style={{ ...primaryBtnStyle, ...disabledStyle(loading) }}>
                {loading ? <ButtonContent text="Loading..." /> : "Sign Up"}
            </button>
            <p onClick={goToLogin} style={linkStyle}>Already have an account? Login</p>
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
        try { const d = await apiRequest("/auth/forgot-password", "POST", { email }); setGeneratedToken(d.reset_token); }
        catch { alert("Email not found"); }
        finally { setTokenLoading(false); }
    };

    const resetPassword = async () => {
        if (resetLoading) return;
        setResetLoading(true);
        try { await apiRequest("/auth/reset-password", "POST", { token, new_password: newPassword }); alert("Password reset"); goBack(); }
        catch { alert("Invalid token"); }
        finally { setResetLoading(false); }
    };

    return (
        <AuthShell>
            <h1 className="auth-title" style={{ ...authTitleStyle, fontSize: "42px", marginBottom: "32px" }}>Reset Password</h1>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <button onClick={generateResetToken} disabled={tokenLoading} style={{ ...primaryBtnStyle, ...disabledStyle(tokenLoading) }}>
                {tokenLoading ? <ButtonContent text="Loading..." /> : "Generate Reset Token"}
            </button>
            {generatedToken && (
                <div style={{ background: "#141414", border: "1px solid #222", borderRadius: "10px", padding: "12px", fontSize: "12px", color: "#666", wordBreak: "break-all", marginBottom: "14px" }}>
                    Token: {generatedToken}
                </div>
            )}
            <input placeholder="Paste Token" value={token} onChange={e => setToken(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
            <button onClick={resetPassword} disabled={resetLoading} style={{ ...primaryBtnStyle, ...disabledStyle(resetLoading) }}>
                {resetLoading ? <ButtonContent text="Loading..." /> : "Reset Password"}
            </button>
            <p onClick={goBack} style={linkStyle}>Back to Login</p>
        </AuthShell>
    );
}

function AuthShell({ children }) {
    return (
        <div className="auth-shell" style={{ background: "#0d0d0d", width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Arial", boxSizing: "border-box", overflow: "hidden" }}>
            <div className="auth-panel" style={{ width: "500px", display: "flex", flexDirection: "column" }}>
                {children}
            </div>
        </div>
    );
}

function Splash() {
    return (
        <div style={{ background: "#0d0d0d", color: "#555", width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Arial", fontSize: "14px", gap: "10px" }}>
            <Spinner /> Loading...
        </div>
    );
}

function Spinner({ size = 16 }) {
    return (
        <span style={{
            width: `${size}px`, height: `${size}px`, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "999px", display: "inline-block",
            animation: "pilot-spin 0.8s linear infinite",
        }} />
    );
}

function ButtonContent({ text }) {
    return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><Spinner />{text}</span>;
}

function disabledStyle(disabled) {
    return disabled ? { cursor: "not-allowed", opacity: 0.7, transition: "opacity 0.15s" } : { transition: "opacity 0.15s" };
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const inputStyle = {
    width: "100%", padding: "20px 22px", marginBottom: "16px", borderRadius: "14px",
    border: "1px solid #1e1e1e", background: "#141414", color: "white",
    fontSize: "17px", outline: "none", boxSizing: "border-box",
};

const primaryBtnStyle = {
    width: "100%", padding: "20px", borderRadius: "14px", border: "1px solid #2a2a2a",
    background: "#1a1a1a", color: "white", fontSize: "17px", cursor: "pointer",
    fontWeight: "600", marginBottom: "8px", boxSizing: "border-box",
};

const authTitleStyle = {
    margin: "0 0 8px", fontSize: "64px", fontFamily: "Georgia, serif",
    fontWeight: "600", letterSpacing: "-3px", color: "white", textAlign: "center", lineHeight: 1,
};

const linkStyle = {
    margin: "14px 0 0", color: "#555", textAlign: "center", cursor: "pointer", fontSize: "15px",
};

const btnStyle = {
    padding: "10px 20px", background: "#141414", color: "#888",
    border: "1px solid #222", borderRadius: "10px", cursor: "pointer", fontSize: "13px",
};
