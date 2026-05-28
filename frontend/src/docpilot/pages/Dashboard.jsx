import { useState, useEffect, useRef } from "react";
import { apiRequest } from "../api";
import { useDropzone } from "react-dropzone";

function Dashboard({ onLogout, onHome, onTracePilot }) {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState(null);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadDashboard = async () => {
      setInitialLoading(true);
      try {
        const [sessionData, billingData] = await Promise.all([
          apiRequest("/history/sessions"),
          apiRequest("/billing/me"),
        ]);
        setSessions(sessionData);
        setUsername(billingData.username);
      } catch {}
      finally { setInitialLoading(false); }
    };
    loadDashboard();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiRequest("/history/sessions");
      setSessions(data);
    } catch {}
    finally { setLoadingSessions(false); }
  };

  const loadSession = async (sessionId) => {
    if (loadingSessionId || deletingSessionId) return;
    setLoadingSessionId(sessionId);
    try {
      const data = await apiRequest(`/history/${sessionId}`);
      // Align keys directly with your backend metrics payload structure
      setMessages(data.map(m => ({ 
        role: m.role, 
        content: m.content, 
        sources: m.sources,
        timestamp: m.timestamp || m.created_at || new Date().toISOString()
      })));
      setCurrentSessionId(sessionId);
      setSidebarOpen(false);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.length > 0 && setFile(files[0]),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
  });

  const uploadFile = async () => {
    if (!file || uploading) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await apiRequest("/docs/upload", "POST", formData);
      if (data.detail) { alert(data.detail); }
      else { alert(data.message); setSource(file.name); }
    } catch { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const askQuestion = async () => {
    if (!question || asking) return;
    const q = question;
    setQuestion("");
    setMessages(prev => [
      ...prev, 
      { role: "user", content: q, timestamp: new Date().toISOString() }, 
      { role: "assistant", content: "Thinking...", loading: true, timestamp: new Date().toISOString() }
    ]);
    setAsking(true);
    try {
      const data = await apiRequest("/chat/ask", "POST", { question: q, source, session_id: currentSessionId });
      if (data.session_id) { setCurrentSessionId(data.session_id); fetchSessions(); }
      setMessages(prev => { 
        const u = [...prev]; 
        u[u.length - 1] = { 
          role: "assistant", 
          content: data.answer, 
          sources: data.sources,
          timestamp: new Date().toISOString()
        }; 
        return u; 
      });
    } catch {
      setMessages(prev => { 
        const u = [...prev]; 
        u[u.length - 1] = { 
          role: "assistant", 
          content: "Something went wrong.",
          timestamp: new Date().toISOString()
        }; 
        return u; 
      });
    } finally {
      setAsking(false);
    }
  };

  const resetMemory = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await apiRequest("/docs/reset", "DELETE");
      setMessages([]); setQuestion(""); setSource(""); setFile(null); setCurrentSessionId(null);
      fetchSessions();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="docpilot-root" style={{ display: "flex", width: "100%", height: "100%", background: "#111", color: "white", fontFamily: "Arial", overflow: "hidden" }}>
      {(initialLoading || uploading || resetting) && (
        <LoadingOverlay text={uploading ? "Uploading document..." : resetting ? "Resetting..." : "Loading dashboard..."} />
      )}
      {sidebarOpen && <button className="mobile-drawer-backdrop" aria-label="Close conversations" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`docpilot-sidebar ${sidebarOpen ? "is-open" : ""}`} style={{ width: "280px", flexShrink: 0, background: "#101010", borderRight: "1px solid #262626", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* SIDEBAR HEADER */}
        <div style={{ padding: "24px 24px 16px", flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: "44px", fontFamily: "Georgia, serif", fontWeight: "600", letterSpacing: "-2px", color: "white", lineHeight: 1 }}>DocPilot</h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: "14px" }}>{username}</p>
        </div>

        {/* UPLOAD */}
        <div style={{ padding: "0 16px 16px", flexShrink: 0, borderBottom: "1px solid #1a1a1a" }}>
          <div {...getRootProps()} style={{
            border: "1px dashed #2e2e2e", borderRadius: "12px", padding: "20px 16px",
            textAlign: "center", background: isDragActive ? "#1c1c1c" : "#151515",
            cursor: "pointer", color: "#ccc", fontSize: "13px", marginBottom: "10px",
          }}>
            <input {...getInputProps()} />
            {isDragActive ? <p style={{ margin: 0 }}>Drop here...</p> : <p style={{ margin: 0 }}>Drag & drop or click to upload</p>}
            {file && <p style={{ margin: "8px 0 0", color: "#888", fontSize: "12px" }}>{file.name}</p>}
          </div>
          <button onClick={uploadFile} disabled={uploading || !file} style={{
            width: "100%", padding: "11px", background: "#1a1a1a", color: uploading ? "#555" : "white",
            border: "1px solid #2a2a2a", borderRadius: "10px", cursor: uploading || !file ? "not-allowed" : "pointer", fontSize: "14px",
            opacity: uploading || !file ? 0.7 : 1, transition: "opacity 0.15s",
          }}>
            {uploading ? <ButtonContent text="Uploading..." /> : "Upload"}
          </button>
        </div>

        {/* NEW CHAT */}
        <div style={{ padding: "12px 16px", flexShrink: 0 }}>
          <button onClick={() => { setMessages([]); setCurrentSessionId(null); }} style={{
            width: "100%", padding: "12px", background: "#1b1b1b", color: "white",
            border: "1px solid #2b2b2b", borderRadius: "10px", cursor: "pointer", fontSize: "14px",
          }}>+ New Chat</button>
        </div>

        {/* SESSIONS */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#777", textTransform: "uppercase", letterSpacing: "0.08em" }}>Conversations</p>
          {loadingSessions && sessions.length === 0 && (
            <p style={{ color: "#777", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Spinner /> Loading...</p>
          )}
          {sessions.map(session => (
            <div key={session.id} onClick={() => loadSession(session.id)} style={{
              padding: "12px 14px", marginBottom: "6px", borderRadius: "10px",
              background: currentSessionId === session.id ? "#1e1e1e" : "#141414",
              border: "1px solid #1e1e1e", cursor: loadingSessionId || deletingSessionId ? "not-allowed" : "pointer", fontSize: "13px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              opacity: loadingSessionId && loadingSessionId !== session.id ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: "#ddd" }}>
                {session.title || `Chat #${session.id}`}
              </span>
              {deletingSessionId === session.id && (
                <span style={{ color: "#999", marginLeft: "8px", display: "inline-flex" }}><Spinner size={12} /></span>
              )}
              <button onClick={async (e) => {
                e.stopPropagation();
                if (deletingSessionId) return;
                setDeletingSessionId(session.id);
                try {
                  await apiRequest(`/history/${session.id}`, "DELETE");
                  if (currentSessionId === session.id) { setMessages([]); setCurrentSessionId(null); }
                  fetchSessions();
                } finally {
                  setDeletingSessionId(null);
                }
              }} style={{ background: "transparent", border: "none", color: "#aaa", cursor: "pointer", fontSize: "14px", marginLeft: "8px", flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="docpilot-main" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0d0d0d" }}>

        {/* THIN HEADER */}
        <div className="docpilot-topbar" style={{ padding: "12px 24px", borderBottom: "1px solid #1c1c1c", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open conversations" style={{ color: "#ddd", background: "transparent", border: "1px solid #222", borderRadius: "10px", padding: "8px 12px", cursor: "pointer" }}>☰</button>
          <p className="docpilot-active-document" style={{ margin: 0, fontSize: "13px", color: "#ccc" }}>
            Active Document: <span style={{ color: source ? "#ddd" : "#888" }}>{source || "None"}</span>
          </p>
          <div className="docpilot-actions" style={{ display: "flex", gap: "8px" }}>
            {[
              { label: "← Home", onClick: onHome, color: "#ddd" },
              { label: "TracePilot →", onClick: onTracePilot, color: "#ddd" },
              { label: resetting ? <ButtonContent text="Resetting..." /> : "Reset", onClick: resetMemory, color: "#ddd", disabled: resetting },
              { label: "Logout", onClick: onLogout, color: "#ddd" },
            ].map(btn => (
              <button key={String(btn.label)} onClick={btn.onClick} disabled={btn.disabled} style={{
                padding: "8px 14px", background: "#1b1b1b", color: btn.color,
                border: "1px solid #252525", borderRadius: "8px", cursor: btn.disabled ? "not-allowed" : "pointer", fontSize: "13px",
                opacity: btn.disabled ? 0.75 : 1, transition: "opacity 0.15s, transform 0.15s",
              }}>{btn.label}</button>
            ))}
          </div>
        </div>{/* CHAT AREA */}
<div className="docpilot-chat-area" style={{ flex: 1, overflowY: "auto", padding: "32px 60px", background: "#0d0d0d" }}>
  {messages.length === 0 && (
    <p style={{ color: "#999", fontSize: "16px" }}>Ask questions about your document...</p>
  )}
  {messages
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((msg, i) => (
      <div key={i} style={{ marginBottom: "28px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
        {msg.role === "user" ? (
          <div className="docpilot-message-user text-wrap-safe" style={{ background: "#1e1e1e", padding: "14px 20px", borderRadius: "18px", maxWidth: "65%", fontSize: "16px", lineHeight: 1.6, color: "#eee" }}>
            {msg.content}
          </div>
        ) : (
          <div className="docpilot-message-assistant text-wrap-safe" style={{ maxWidth: "80%", fontSize: "16px", lineHeight: 1.8, color: "#ccc" }}>
            
            {/* REMOVED CONTAINER BUBBLE STYLE HERE — JUST RAW TEXT CONTENT */}
            <div>
              {msg.content}
            </div>

            {/* Sources section remains nicely padded right beneath the unbubbled text */}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ marginTop: "16px", paddingLeft: "4px", fontSize: "12px", color: "#aaa" }}>
                <p style={{ margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "10px", color: "#ccc", fontWeight: "bold" }}>Sources</p>
                {msg.sources.map((s, idx) => (
                  <div key={idx} style={{ color: "#bbb", marginBottom: "2px" }}>
                    📁 <span style={{ color: "#ddd" }}>{s.source || s.file_name}</span> · <span style={{ fontStyle: "italic" }}>Page {s.page || s.page_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    ))}
  <div ref={messagesEndRef} />
</div>

        {/* INPUT */}
        <div className="docpilot-input-bar" style={{ padding: "16px 24px", borderTop: "1px solid #1e1e1e", flexShrink: 0, background: "#111" }}>
          <div className="docpilot-input-row" style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              placeholder="Ask something..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askQuestion()}
              style={{
                flex: 1, padding: "16px 20px", borderRadius: "14px",
                border: "1px solid #222", background: "#161616", color: "white",
                fontSize: "15px", outline: "none",
              }}
            />
            <button onClick={askQuestion} disabled={asking} style={{
              padding: "16px 28px", borderRadius: "14px", border: "1px solid #2b2b2b",
              background: "#1f1f1f", color: asking ? "#888" : "white",
              cursor: asking ? "not-allowed" : "pointer", fontSize: "15px",
              opacity: asking ? 0.7 : 1, transition: "opacity 0.15s",
            }}>{asking ? <ButtonContent text="Sending..." /> : "Send"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner({ size = 14 }) {
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

function LoadingOverlay({ text }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13, 13, 13, 0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#ddd", zIndex: 10, pointerEvents: "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px",
        background: "#161616", border: "1px solid #2a2a2a", borderRadius: "10px",
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      }}>
        <Spinner /> {text}
      </div>
    </div>
  );
}

export default Dashboard;
