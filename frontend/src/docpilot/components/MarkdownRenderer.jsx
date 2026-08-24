import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function preprocessMarkdown(text) {
  if (!text) return "";
  let processed = String(text);

  // 1. Ensure blank line after headings (e.g. ## Heading\n...)
  processed = processed.replace(/(#{1,6}[^\n]+)\n([^\n#])/g, "$1\n\n$2");

  // 2. Ensure blank line before tables (lines starting with | preceded by a non-table line)
  processed = processed.replace(/([^\n|])\n(\|[^\n]+\|)/g, "$1\n\n$2");

  // 3. Ensure blank line after tables (lines ending with | followed by non-table line)
  processed = processed.replace(/(\|[^\n]+\|)\n([^\n|])/g, "$1\n\n$2");

  return processed;
}

export default function MarkdownRenderer({ content, experimentMode }) {
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const cleanContent = useMemo(() => preprocessMarkdown(content), [content]);

  const copyCode = (codeText, id) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };


  return (
    <div className="docpilot-markdown-body" style={{ color: "#e2e8f0", fontSize: "15px", lineHeight: 1.7 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div
              style={{
                overflowX: "auto",
                margin: "16px 0",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(15, 23, 42, 0.4)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13.5px",
                  textAlign: "left",
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              style={{
                background: experimentMode
                  ? "rgba(168, 85, 247, 0.14)"
                  : "rgba(59, 130, 246, 0.14)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              }}
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                padding: "12px 16px",
                fontWeight: 700,
                color: experimentMode ? "#c084fc" : "#93c5fd",
                letterSpacing: "0.02em",
                borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                whiteSpace: "nowrap",
              }}
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr
              style={{
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                padding: "12px 16px",
                color: "#cbd5e1",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                lineHeight: 1.6,
                verticalAlign: "top",
              }}
              {...props}
            />
          ),
          h1: ({ node, ...props }) => (
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                margin: "24px 0 12px",
                lineHeight: 1.3,
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.4px",
                margin: "20px 0 10px",
                lineHeight: 1.35,
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: experimentMode ? "#c084fc" : "#60a5fa",
                letterSpacing: "-0.2px",
                margin: "18px 0 8px",
                lineHeight: 1.4,
              }}
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#ffffff",
                margin: "14px 0 6px",
              }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              style={{
                margin: "10px 0",
                lineHeight: 1.7,
                color: "#e2e8f0",
              }}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              style={{
                margin: "10px 0",
                paddingLeft: "24px",
                color: "#cbd5e1",
                lineHeight: 1.7,
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                margin: "10px 0",
                paddingLeft: "24px",
                color: "#cbd5e1",
                lineHeight: 1.7,
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              style={{
                margin: "4px 0",
              }}
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong
              style={{
                color: "#ffffff",
                fontWeight: 700,
              }}
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: experimentMode
                  ? "3px solid #a855f7"
                  : "3px solid #3b82f6",
                background: "rgba(255, 255, 255, 0.03)",
                padding: "10px 16px",
                borderRadius: "0 12px 12px 0",
                margin: "14px 0",
                color: "#cbd5e1",
                fontStyle: "italic",
              }}
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const codeId = React.useId ? React.useId() : Math.random().toString();

            if (inline) {
              return (
                <code
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: "13px",
                    color: experimentMode ? "#d8b4fe" : "#93c5fd",
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div
                style={{
                  position: "relative",
                  margin: "16px 0",
                  borderRadius: "14px",
                  background: "#0b101b",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span>{match ? match[1] : "code"}</span>
                  <button
                    onClick={() => copyCode(codeString, codeId)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {copiedCodeId === codeId ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "14px 16px",
                    overflowX: "auto",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "#f1f5f9",
                  }}
                >
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}

