import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";

const style = document.createElement("style");
style.textContent = `
  :root {
    --bg-primary: #0e121a;
    --bg-secondary: #131824;
    --surface: #1a2030;
    --surface-hover: #222b3e;
    --surface-strong: #2a354c;
    --border: rgba(255, 255, 255, 0.08);
    --border-subtle: rgba(255, 255, 255, 0.04);
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent: #3b82f6;
    --accent-glow: rgba(59, 130, 246, 0.15);
    --success: #10b981;
    --danger: #ef4444;
    --purple: #8b5cf6;
  }

  .experimental-mode {
    --bg-primary: #080c18;
    --bg-secondary: #0d1222;
    --surface: #141b30;
    --surface-hover: #1c2542;
    --surface-strong: #253156;
    --border: rgba(139, 92, 246, 0.15);
    --border-subtle: rgba(255, 255, 255, 0.04);
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #7c8ba1;
    --accent: #8b5cf6;
    --accent-glow: rgba(139, 92, 246, 0.2);
    --success: #10b981;
    --danger: #ef4444;
    --purple: #8b5cf6;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; overflow: hidden; background: var(--bg-primary); color: var(--text-primary); }
  body { min-width: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
  button, input, textarea { font: inherit; color: inherit; }
  
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 9999px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.22); }

  button, input { font: inherit; color: inherit; }
  @keyframes pilot-spin { to { transform: rotate(360deg); } }

  .mobile-menu-button { display: none; }
  .mobile-drawer-backdrop { display: none; }

  .text-wrap-safe,
  .text-wrap-safe * {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  @media (max-width: 900px) {
    .pilot-home {
      width: 100% !important;
      min-height: 100dvh !important;
      height: 100dvh !important;
      overflow-y: auto !important;
    }

    .pilot-home-topbar {
      padding: 18px 18px !important;
      align-items: flex-start !important;
      gap: 14px !important;
      flex-direction: column !important;
    }

    .pilot-home-actions {
      width: 100% !important;
      gap: 8px !important;
      flex-wrap: wrap !important;
      justify-content: flex-start !important;
    }

    .pilot-home-center {
      justify-content: flex-start !important;
      padding: 28px 16px !important;
      gap: 18px !important;
    }

    .pilot-home-grid {
      width: 100% !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    .pilot-product-card {
      width: 100% !important;
      padding: 20px !important;
      border-radius: 12px !important;
    }

    .pilot-home-footer {
      padding: 12px 18px !important;
      flex-direction: column !important;
      gap: 5px !important;
    }

    .auth-shell {
      width: 100% !important;
      min-height: 100dvh !important;
      height: 100dvh !important;
      padding: 18px !important;
      overflow-y: auto !important;
      align-items: center !important;
    }

    .auth-panel {
      width: 100% !important;
      max-width: 500px !important;
    }

    .auth-title {
      font-size: 46px !important;
      letter-spacing: -2px !important;
    }

    .docpilot-root,
    .trace-root {
      width: 100% !important;
      height: 100dvh !important;
      min-width: 0 !important;
      position: relative !important;
    }

    .mobile-menu-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 36px !important;
      height: 36px !important;
      padding: 0 !important;
      background: var(--surface) !important;
      color: var(--text-secondary) !important;
      border: 1px solid var(--border) !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
    }

    .mobile-drawer-backdrop {
      display: block !important;
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.52) !important;
      border: 0 !important;
      padding: 0 !important;
      z-index: 19 !important;
    }

    .docpilot-sidebar,
    .trace-sidebar {
      position: fixed !important;
      inset: 0 auto 0 0 !important;
      width: min(86vw, 320px) !important;
      max-width: 320px !important;
      height: 100dvh !important;
      z-index: 20 !important;
      transform: translateX(-105%) !important;
      transition: transform 0.2s ease !important;
      box-shadow: 24px 0 60px rgba(0, 0, 0, 0.35) !important;
    }

    .docpilot-sidebar.is-open,
    .trace-sidebar.is-open {
      transform: translateX(0) !important;
    }

    .docpilot-main,
    .trace-detail-panel {
      width: 100% !important;
      min-width: 0 !important;
    }

    .docpilot-topbar {
      padding: 10px 12px !important;
      gap: 10px !important;
      align-items: flex-start !important;
      flex-wrap: wrap !important;
    }

    .docpilot-active-document {
      min-width: 0 !important;
      flex: 1 1 180px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .docpilot-actions {
      width: 100% !important;
      gap: 6px !important;
      overflow-x: auto !important;
      padding-bottom: 2px !important;
    }

    .docpilot-actions button {
      padding: 8px 10px !important;
      white-space: nowrap !important;
    }

    .docpilot-chat-area {
      padding: 20px 14px !important;
    }

    .docpilot-message-user,
    .docpilot-message-assistant {
      max-width: 100% !important;
      font-size: 15px !important;
    }

    .docpilot-message-user {
      padding: 12px 14px !important;
    }

    .docpilot-input-bar {
      padding: 12px !important;
    }

    .docpilot-input-row {
      gap: 8px !important;
    }

    .docpilot-input-row input {
      min-width: 0 !important;
      padding: 13px 14px !important;
      font-size: 14px !important;
    }

    .docpilot-input-row button {
      padding: 13px 14px !important;
      min-width: 78px !important;
    }

    .trace-header {
      padding: 20px 16px 14px !important;
    }

    .trace-title {
      font-size: 34px !important;
      letter-spacing: -1px !important;
    }

    .trace-body {
      display: block !important;
      overflow: hidden !important;
      min-width: 0 !important;
    }

    .trace-detail-panel {
      height: 100% !important;
      padding: 1rem !important;
    }

    .trace-empty-state {
      text-align: left !important;
      color: #444 !important;
    }

    .trace-mobile-list-button {
      display: inline-flex !important;
      margin-top: 12px !important;
    }

    .trace-detail-header {
      flex-direction: column !important;
      gap: 10px !important;
    }

    .trace-detail-header > div {
      width: 100% !important;
      margin-right: 0 !important;
    }

    .trace-detail-header button {
      width: 100% !important;
      justify-content: center !important;
    }

    .trace-eval-row,
    .trace-metrics-row,
    .trace-stat-row,
    .trace-chunk-tags,
    .trace-spans-row {
      width: 100% !important;
      align-items: stretch !important;
    }

    .trace-metrics-row > *,
    .trace-stat-row > * {
      width: 100% !important;
      min-width: 0 !important;
    }

    .trace-meta {
      width: 100% !important;
      margin-left: 0 !important;
      overflow-wrap: anywhere !important;
    }
  }

  @media (max-width: 430px) {
    .pilot-home-topbar h1 {
      font-size: 30px !important;
    }

    .pilot-home-actions button,
    .docpilot-actions button {
      font-size: 12px !important;
    }

    .auth-title {
      font-size: 40px !important;
    }

    .docpilot-input-row {
      flex-direction: column !important;
    }

    .docpilot-input-row button {
      width: 100% !important;
    }

    .trace-header {
      padding: 18px 14px 12px !important;
    }

    .trace-title {
      font-size: 30px !important;
    }
  }.gauge-root {
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--bg-primary);
}

.gauge-sidebar {
  width: 260px;
  border-right: 1px solid var(--border);
  padding: 24px;
  background: var(--bg-secondary);
}

.gauge-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.gauge-title {
  font-size: 38px;
  font-weight: 700;
  margin-bottom: 24px;
}

.gauge-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gauge-nav-button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-primary);
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
}

.gauge-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
}
  .gauge-input {
  width: 100%;
  max-width: 400px;

  background: var(--bg-primary);
  color: var(--text-primary);

  border: 1px solid var(--border);
  border-radius: 12px;

  padding: 12px 16px;
}

.gauge-textarea {
  width: 100%;
  min-height: 220px;

  background: var(--bg-primary);
  color: var(--text-primary);

  border: 1px solid var(--border);
  border-radius: 12px;

  padding: 16px;

  resize: vertical;
}

.gauge-button {
  background: var(--surface-strong);
  color: var(--text-primary);

  border: 1px solid var(--border);
  border-radius: 12px;

  padding: 12px 18px;

  cursor: pointer;
}
`;
document.head.appendChild(style);

class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("PilotMaster React ErrorBoundary caught:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: "100vw", height: "100vh", background: "#0c112a", color: "#f5f7ff",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    padding: "32px", boxSizing: "border-box", fontFamily: "monospace", textAlign: "center"
                }}>
                    <h2 style={{ fontSize: "28px", color: "#ff6b6b", marginBottom: "12px" }}>⚠️ Application Error</h2>
                    <p style={{ maxWidth: "600px", color: "rgba(255,255,255,0.7)", marginBottom: "20px", fontSize: "14px" }}>
                        {this.state.error?.message || "An unexpected error occurred while rendering the page."}
                    </p>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={() => {
                                window.history.pushState({}, "", "/home");
                                window.location.href = "/home";
                            }}
                            style={{
                                padding: "10px 20px", background: "#4f6ef7", color: "white",
                                border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600
                            }}
                        >
                            Return to Home
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: "10px 20px", background: "rgba(255,255,255,0.1)", color: "white",
                                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </ErrorBoundary>
);

