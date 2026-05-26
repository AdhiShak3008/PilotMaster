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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    apiRequest("/history/sessions").then(setSessions).catch(() => {});
    apiRequest("/billing/me").then(d => setUsername(d.username)).catch(() => {});
  }, []);

  const fetchSessions = () =>
    apiRequest("/history/sessions").then(setSessions).catch(() => {});

  const loadSession = async (sessionId) => {
    const data = await apiRequest(`/history/${sessionId}`);
    // Align keys directly with your backend metrics payload structure
    setMessages(data.map(m => ({ 
      role: m.role, 
      content: m.content, 
      sources: m.sources,
      timestamp: m.timestamp || m.created_at || new Date().toISOString()
    })));
    setCurrentSessionId(sessionId);
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
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await apiRequest("/docs/upload", "POST", formData);
      if (data.detail) { alert(data.detail); }
      else { alert(data.message); setSource(file.name); }
    } catch { alert("Upload failed"); }
    setUploading(false);
  };

  const askQuestion = async () => {
    if (!question) return;
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
    }
    setAsking(false);
  };

  const resetMemory = async () => {
    await apiRequest("/docs/reset", "DELETE");
    setMessages([]); setQuestion(""); setSource(""); setFile(null); setCurrentSessionId(null);
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#111", color: "white", fontFamily: "Arial", overflow: "hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width: "280px", flexShrink: 0, background: "#0d0d0d", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* SIDEBAR HEADER */}
        <div style={{ padding: "24px 24px 16px", flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: "44px", fontFamily: "Georgia, serif", fontWeight: "600", letterSpacing: "-2px", color: "white", lineHeight: 1 }}>DocPilot</h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: "14px" }}>{username}</p>
        </div>

        {/* UPLOAD */}
        <div style={{ padding: "0 16px 16px", flexShrink: 0, borderBottom: "1px solid #1a1a1a" }}>
          <div {...getRootProps()} style={{
            border: "1px dashed #2a2a2a", borderRadius: "12px", padding: "20px 16px",
            textAlign: "center", background: isDragActive ? "#1a1a1a" : "#141414",
            cursor: "pointer", color: "#555", fontSize: "13px", marginBottom: "10px",
          }}>
            <input {...getInputProps()} />
            {isDragActive ? <p style={{ margin: 0 }}>Drop here...</p> : <p style={{ margin: 0 }}>Drag & drop or click to upload</p>}
            {file && <p style={{ margin: "8px 0 0", color: "#888", fontSize: "12px" }}>{file.name}</p>}
          </div>
          <button onClick={uploadFile} disabled={uploading} style={{
            width: "100%", padding: "11px", background: "#1a1a1a", color: uploading ? "#555" : "white",
            border: "1px solid #2a2a2a", borderRadius: "10px", cursor: uploading ? "not-allowed" : "pointer", fontSize: "14px",
          }}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* NEW CHAT */}
        <div style={{ padding: "12px 16px", flexShrink: 0 }}>
          <button onClick={() => { setMessages([]); setCurrentSessionId(null); }} style={{
            width: "100%", padding: "12px", background: "#161616", color: "white",
            border: "1px solid #222", borderRadius: "10px", cursor: "pointer", fontSize: "14px",
          }}>+ New Chat</button>
        </div>

        {/* SESSIONS */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#333", textTransform: "uppercase", letterSpacing: "0.08em" }}>Conversations</p>
          {sessions.map(session => (
            <div key={session.id} onClick={() => loadSession(session.id)} style={{
              padding: "12px 14px", marginBottom: "6px", borderRadius: "10px",
              background: currentSessionId === session.id ? "#1e1e1e" : "#141414",
              border: "1px solid #1e1e1e", cursor: "pointer", fontSize: "13px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: "#ccc" }}>
                {session.title || `Chat #${session.id}`}
              </span>
              <button onClick={async (e) => {
                e.stopPropagation();
                await apiRequest(`/history/${session.id}`, "DELETE");
                if (currentSessionId === session.id) { setMessages([]); setCurrentSessionId(null); }
                fetchSessions();
              }} style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: "14px", marginLeft: "8px", flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* THIN HEADER */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #1e1e1e", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
            Active Document: <span style={{ color: source ? "#aaa" : "#333" }}>{source || "None"}</span>
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { label: "← Home", onClick: onHome, color: "#aaa" },
              { label: "TracePilot →", onClick: onTracePilot, color: "#7c4dff" },
              { label: "Reset", onClick: resetMemory, color: "#aaa" },
              { label: "Logout", onClick: onLogout, color: "#aaa" },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick} style={{
                padding: "8px 14px", background: "#161616", color: btn.color,
                border: "1px solid #222", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
              }}>{btn.label}</button>
            ))}
          </div>
        </div>{/* CHAT AREA */}
<div style={{ flex: 1, overflowY: "auto", padding: "32px 60px" }}>
  {messages.length === 0 && (
    <p style={{ color: "#333", fontSize: "16px" }}>Ask questions about your document...</p>
  )}
  {messages
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((msg, i) => (
      <div key={i} style={{ marginBottom: "28px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
        {msg.role === "user" ? (
          <div style={{ background: "#1e1e1e", padding: "14px 20px", borderRadius: "18px", maxWidth: "65%", fontSize: "16px", lineHeight: 1.6, color: "#eee" }}>
            {msg.content}
          </div>
        ) : (
          <div style={{ maxWidth: "80%", fontSize: "16px", lineHeight: 1.8, color: "#ccc" }}>
            
            {/* REMOVED CONTAINER BUBBLE STYLE HERE — JUST RAW TEXT CONTENT */}
            <div>
              {msg.content}
            </div>

            {/* Sources section remains nicely padded right beneath the unbubbled text */}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ marginTop: "16px", paddingLeft: "4px", fontSize: "12px", color: "#444" }}>
                <p style={{ margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "10px", color: "#555", fontWeight: "bold" }}>Sources</p>
                {msg.sources.map((s, idx) => (
                  <div key={idx} style={{ color: "#666", marginBottom: "2px" }}>
                    📁 <span style={{ color: "#888" }}>{s.source || s.file_name}</span> · <span style={{ fontStyle: "italic" }}>Page {s.page || s.page_number}</span>
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
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1e1e1e", flexShrink: 0, background: "#111" }}>
          <div style={{ display: "flex", gap: "12px" }}>
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
              padding: "16px 28px", borderRadius: "14px", border: "1px solid #222",
              background: "#1e1e1e", color: asking ? "#555" : "white",
              cursor: asking ? "not-allowed" : "pointer", fontSize: "15px",
            }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;