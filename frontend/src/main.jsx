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
  html, body, #root { 
    width: 100%; 
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--bg-primary); 
    color: var(--text-primary); 
    -webkit-text-size-adjust: 100%;
  }
  body { 
    min-width: 0; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    -webkit-font-smoothing: antialiased; 
    overflow-x: hidden;
  }
  button, input, textarea, select { font: inherit; color: inherit; }
  
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 9999px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.22); }

  @keyframes pilot-spin { to { transform: rotate(360deg); } }
  @keyframes pilot-spin-reverse { to { transform: rotate(-360deg); } }
  @keyframes pilot-orbit-glow {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @keyframes pilot-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pilot-mode-pulse-exp {
    0%, 100% {
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.45), 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 0 8px rgba(168, 85, 247, 0.2);
      border-color: rgba(192, 132, 252, 0.55);
    }
    50% {
      box-shadow: 0 0 28px rgba(168, 85, 247, 0.75), 0 0 48px rgba(216, 180, 254, 0.35), inset 0 0 16px rgba(168, 85, 247, 0.4);
      border-color: rgba(233, 213, 255, 0.95);
    }
  }

  @keyframes pilot-mode-pulse-prod {
    0%, 100% {
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.4), 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 0 8px rgba(59, 130, 246, 0.2);
      border-color: rgba(96, 165, 250, 0.55);
    }
    50% {
      box-shadow: 0 0 28px rgba(59, 130, 246, 0.75), 0 0 48px rgba(147, 197, 253, 0.35), inset 0 0 16px rgba(59, 130, 246, 0.4);
      border-color: rgba(191, 219, 254, 0.95);
    }
  }

  @keyframes pilot-shimmer-sweep {
    0% {
      transform: translateX(-150%) skewX(-20deg);
    }
    50%, 100% {
      transform: translateX(250%) skewX(-20deg);
    }
  }

  @keyframes pilot-beacon-ping {
    0% {
      transform: scale(0.9);
      box-shadow: 0 0 0 0 rgba(244, 114, 182, 0.8);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 8px rgba(244, 114, 182, 0);
    }
    100% {
      transform: scale(0.9);
      box-shadow: 0 0 0 0 rgba(244, 114, 182, 0);
    }
  }

  @keyframes pilot-beacon-ping-blue {
    0% {
      transform: scale(0.9);
      box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.8);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 8px rgba(96, 165, 250, 0);
    }
    100% {
      transform: scale(0.9);
      box-shadow: 0 0 0 0 rgba(96, 165, 250, 0);
    }
  }

  @keyframes icon-float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-2px) rotate(6deg);
    }
  }

  .interactive-mode-btn {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .interactive-mode-btn:hover {
    transform: translateY(-2px) scale(1.03);
  }

  .interactive-mode-btn:active {
    transform: translateY(1px) scale(0.97);
  }

  .interactive-mode-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.25),
      transparent
    );
    pointer-events: none;
    animation: pilot-shimmer-sweep 3.5s infinite ease-in-out;
  }

  .mobile-menu-button { display: none; }
  .mobile-drawer-backdrop { display: none; }

  .text-wrap-safe,
  .text-wrap-safe * {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .pill-scroll-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    max-width: 100%;
    padding-bottom: 2px;
  }
  .pill-scroll-bar::-webkit-scrollbar {
    display: none;
  }

  .table-scroll-container {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Responsive Breakpoints */
  @media (max-width: 960px) {
    .pilot-home {
      width: 100% !important;
      min-height: 100dvh !important;
      height: auto !important;
      overflow-y: auto !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .pilot-home-topbar {
      padding: 16px 20px !important;
      align-items: flex-start !important;
      gap: 12px !important;
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
      padding: 24px 16px !important;
      gap: 20px !important;
    }

    .pilot-home-grid {
      width: 100% !important;
      flex-direction: column !important;
      gap: 14px !important;
      align-items: center !important;
    }

    .pilot-product-card {
      width: 100% !important;
      max-width: 100% !important;
      padding: 20px !important;
      border-radius: 18px !important;
    }

    .pilot-home-footer {
      padding: 16px 20px !important;
      flex-direction: column !important;
      gap: 6px !important;
      text-align: center !important;
    }

    .auth-shell {
      width: 100% !important;
      min-height: 100dvh !important;
      padding: 16px !important;
      overflow-y: auto !important;
      align-items: center !important;
    }

    .auth-panel {
      width: 100% !important;
      max-width: 440px !important;
      padding: 28px 20px !important;
    }

    .auth-title {
      font-size: 38px !important;
      letter-spacing: -1.5px !important;
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
      min-width: 38px !important;
      min-height: 38px !important;
      padding: 6px 12px !important;
      background: var(--surface) !important;
      color: var(--text-primary) !important;
      border: 1px solid var(--border) !important;
      border-radius: 9999px !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
      font-size: 15px !important;
    }

    .mobile-drawer-backdrop {
      display: block !important;
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.55) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: 0 !important;
      padding: 0 !important;
      z-index: 998 !important;
    }

    .docpilot-sidebar,
    .trace-sidebar {
      position: fixed !important;
      inset: 0 auto 0 0 !important;
      width: min(85vw, 320px) !important;
      max-width: 320px !important;
      height: 100dvh !important;
      z-index: 999 !important;
      transform: translateX(-105%) !important;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 24px 0 60px rgba(0, 0, 0, 0.5) !important;
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
      padding: 10px 14px !important;
      gap: 8px !important;
      align-items: center !important;
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }
    .docpilot-topbar::-webkit-scrollbar {
      display: none !important;
    }

    .docpilot-active-document {
      min-width: 0 !important;
      flex: 1 1 auto !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .docpilot-actions {
      display: flex !important;
      gap: 6px !important;
      flex-wrap: nowrap !important;
      flex-shrink: 0 !important;
    }

    .docpilot-actions button,
    .docpilot-actions a {
      padding: 6px 12px !important;
      white-space: nowrap !important;
      font-size: 11px !important;
    }

    .docpilot-chat-area {
      padding: 16px 12px !important;
    }

    .docpilot-message-user,
    .docpilot-message-assistant {
      max-width: 100% !important;
      font-size: 14px !important;
    }

    .docpilot-message-user {
      padding: 10px 14px !important;
    }

    .docpilot-input-bar {
      padding: 8px 10px !important;
    }

    .pill-scroll-bar {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
      flex-wrap: nowrap !important;
    }

    .docpilot-selector-popup {
      position: fixed !important;
      bottom: 84px !important;
      left: 12px !important;
      right: 12px !important;
      width: auto !important;
      max-width: 440px !important;
      margin: 0 auto !important;
      max-height: min(480px, 62vh) !important;
      z-index: 9999999 !important;
      background: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid rgba(255, 255, 255, 0.22) !important;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      opacity: 1 !important;
      animation: pilot-fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .trace-root {
      height: 100% !important;
      min-height: 100dvh !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .trace-header {
      padding: 14px 16px !important;
      flex-shrink: 0 !important;
      height: auto !important;
    }

    .trace-title {
      font-size: 26px !important;
      letter-spacing: -0.8px !important;
    }

    .trace-body {
      display: block !important;
      overflow: visible !important;
      flex: 1 0 auto !important;
      min-width: 0 !important;
      height: auto !important;
    }

    .trace-detail-panel {
      height: auto !important;
      overflow-y: visible !important;
      min-height: calc(100vh - 120px) !important;
      padding: 14px 12px 64px !important;
    }

    .trace-sidebar {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      bottom: 0 !important;
      width: min(340px, 88vw) !important;
      height: 100dvh !important;
      z-index: 99999 !important;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.8) !important;
    }

    .trace-sidebar.is-open {
      transform: translateX(0) !important;
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

  @media (max-width: 640px) {
    .pilot-home-topbar h1 {
      font-size: 22px !important;
    }

    .pilot-home-actions button,
    .pilot-home-actions a,
    .docpilot-actions button,
    .docpilot-actions a {
      font-size: 11px !important;
      padding: 6px 11px !important;
    }

    .auth-title {
      font-size: 28px !important;
    }

    .trace-header {
      padding: 12px 14px !important;
    }

    .trace-title {
      font-size: 22px !important;
    }

    .docpilot-topbar {
      padding: 8px 10px !important;
    }

    .docpilot-chat-area {
      padding: 12px 8px 130px !important;
    }
  }

  /* Universal touch improvements for mobile demo */
  @media (pointer: coarse) {
    button, [role="button"], a {
      min-height: 38px;
    }
    input, textarea, select {
      font-size: 16px !important; /* Prevents auto-zoom on iOS safari */
    }
  }

  .gauge-root {
    display: flex;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
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

