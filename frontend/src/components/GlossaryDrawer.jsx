import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  GLOSSARY_CATEGORIES,
  PAGE_NAME_MAP,
  getFilteredTerms,
  getPageTermsCount,
  GLOSSARY_TERMS,
} from "../glossaryData";

function HighlightText({ text, query }) {
  if (!query || !query.trim() || !text) return text;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return text;

  // Escape regex special chars
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: "rgba(250, 204, 21, 0.28)",
              color: "#fef08a",
              padding: "1px 3px",
              borderRadius: "3px",
              fontWeight: 700,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function GlossaryDrawer({
  isOpen,
  onClose,
  page = "home", // "landing" | "home" | "docpilot" | "tracepilot" | "gaugepilot"
  mode = "prod", // "prod" | "exp" | boolean
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [scope, setScope] = useState("page"); // "page" | "all"
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchInputRef = useRef(null);
  const drawerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isExp = mode === "exp" || mode === true;
  const pageDisplayName = PAGE_NAME_MAP[page] || page;
  const pageTermCount = useMemo(() => getPageTermsCount(page, mode), [page, mode]);
  const totalTermCount = GLOSSARY_TERMS.length;

  // Auto-focus search input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setSelectedCategory("All Categories");
      setScope("page");
      setShowScrollTop(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll listener on dynamic scroll container
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 180);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Filtered terms on current scope
  const filteredTerms = useMemo(() => {
    return getFilteredTerms({
      page,
      mode: isExp ? "exp" : "prod",
      query: searchQuery,
      category: selectedCategory,
      scope,
    });
  }, [page, isExp, searchQuery, selectedCategory, scope]);

  // Check if global fallback terms exist when page search is empty
  const globalFallbackTerms = useMemo(() => {
    if (scope === "page" && filteredTerms.length === 0 && searchQuery.trim().length > 0) {
      return getFilteredTerms({
        page,
        mode: isExp ? "exp" : "prod",
        query: searchQuery,
        category: selectedCategory,
        scope: "all",
      });
    }
    return [];
  }, [scope, filteredTerms.length, searchQuery, page, isExp, selectedCategory]);

  const displayTerms = filteredTerms.length > 0 ? filteredTerms : globalFallbackTerms;
  const isFallback = filteredTerms.length === 0 && globalFallbackTerms.length > 0;

  const copyTerm = (term, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(`${term.title}: ${term.definition}`);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "pilot-glossary-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3, 6, 15, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* DRAWER PANEL */}
      <aside
        ref={drawerRef}
        className="glossary-drawer"
        style={{
          position: "relative",
          width: "min(680px, 100vw)",
          maxWidth: "100vw",
          height: "100dvh",
          background: isExp
            ? "linear-gradient(180deg, rgba(13, 18, 34, 0.98) 0%, rgba(8, 12, 24, 0.99) 100%)"
            : "linear-gradient(180deg, rgba(19, 24, 38, 0.98) 0%, rgba(14, 18, 28, 0.99) 100%)",
          borderLeft: isExp
            ? "1px solid rgba(168, 85, 247, 0.25)"
            : "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: isExp
            ? "-12px 0 48px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            : "-12px 0 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          display: "flex",
          flexDirection: "column",
          color: "var(--text-primary, #f1f5f9)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          animation: "pilot-glossary-slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* UNIFIED DYNAMIC SCROLL CONTAINER */}
        <div
          ref={scrollContainerRef}
          className="glossary-scroll-viewport"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
            scrollBehavior: "smooth",
          }}
        >
          {/* TOP SECTION (SCROLLS DYNAMICALLY WITH CONTENT) */}
          <div
            className="glossary-dynamic-header"
            style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            {/* Title Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "18px",
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    background: isExp
                      ? "rgba(168, 85, 247, 0.18)"
                      : "rgba(59, 130, 246, 0.18)",
                    border: isExp
                      ? "1px solid rgba(168, 85, 247, 0.3)"
                      : "1px solid rgba(59, 130, 246, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  📖
                </span>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "17px",
                      fontWeight: "800",
                      letterSpacing: "-0.4px",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Terminology &amp; Concepts
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "2px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: isExp ? "#c084fc" : "#60a5fa",
                        fontWeight: 600,
                      }}
                    >
                      {pageDisplayName}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>•</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "2px 7px",
                        borderRadius: "9999px",
                        background: isExp
                          ? "rgba(168, 85, 247, 0.2)"
                          : "rgba(59, 130, 246, 0.15)",
                        color: isExp ? "#d8b4fe" : "#93c5fd",
                      }}
                    >
                      {isExp ? "Experimental Lab" : "Production"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close glossary"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "9999px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary, #94a3b8)",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "var(--text-secondary, #94a3b8)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Search Input Box */}
            <div style={{ position: "relative", width: "100%" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "var(--text-muted, #64748b)",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search any term, model, or strategy... (e.g. GPT-OSS, HyDE, BM25)`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 38px",
                  borderRadius: "12px",
                  background: "rgba(0, 0, 0, 0.35)",
                  border: isExp
                    ? "1px solid rgba(168, 85, 247, 0.25)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.18s ease",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted, #64748b)",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "4px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scope Toggle & Count */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  background: "rgba(0, 0, 0, 0.35)",
                  borderRadius: "9999px",
                  padding: "3px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  onClick={() => setScope("page")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    border: "none",
                    background:
                      scope === "page"
                        ? isExp
                          ? "#9333ea"
                          : "#2563eb"
                        : "transparent",
                    color: scope === "page" ? "#ffffff" : "var(--text-muted, #64748b)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  On This Page ({pageTermCount})
                </button>
                <button
                  onClick={() => setScope("all")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    border: "none",
                    background:
                      scope === "all"
                        ? isExp
                          ? "#9333ea"
                          : "#2563eb"
                        : "transparent",
                    color: scope === "all" ? "#ffffff" : "var(--text-muted, #64748b)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  All Terms ({totalTermCount})
                </button>
              </div>

              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted, #64748b)",
                  fontWeight: 500,
                }}
              >
                Showing {displayTerms.length} {displayTerms.length === 1 ? "term" : "terms"}
              </span>
            </div>

            {/* Horizontal Swipeable Category Filter Chips */}
            <div
              className="pill-scroll-bar"
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                paddingBottom: "2px",
                maxWidth: "100%",
              }}
            >
              {GLOSSARY_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "4px 11px",
                      borderRadius: "9999px",
                      border: active
                        ? isExp
                          ? "1px solid rgba(168, 85, 247, 0.6)"
                          : "1px solid rgba(59, 130, 246, 0.6)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      background: active
                        ? isExp
                          ? "rgba(168, 85, 247, 0.2)"
                          : "rgba(59, 130, 246, 0.2)"
                        : "rgba(255, 255, 255, 0.03)",
                      color: active ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                      fontSize: "12px",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FALLBACK NOTICE IF PAGE RESULT IS EMPTY */}
          {isFallback && (
            <div
              style={{
                padding: "8px 20px",
                background: "rgba(59, 130, 246, 0.1)",
                borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                fontSize: "12px",
                color: "#93c5fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span>
                ℹ️ Showing <strong>{displayTerms.length}</strong> matching terms from <em>All Ecosystem Terms</em>:
              </span>
              <button
                onClick={() => setScope("all")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Switch to All
              </button>
            </div>
          )}

          {/* LIST OF TERMS (FLOWS NATURALLY IN DYNAMIC SCROLL STREAM) */}
          <div
            style={{
              padding: "16px 20px 48px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {displayTerms.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 16px",
                  textAlign: "center",
                  gap: "12px",
                  color: "var(--text-muted, #64748b)",
                }}
              >
                <span style={{ fontSize: "32px" }}>🔍</span>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-secondary, #94a3b8)" }}>
                  No matching terms found for "{searchQuery}"
                </p>
                <p style={{ margin: 0, fontSize: "12px", maxWidth: "340px", lineHeight: 1.5 }}>
                  Try searching for a different keyword or reset filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setScope("all");
                  }}
                  style={{
                    marginTop: "6px",
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Show All Terms
                </button>
              </div>
            ) : (
              displayTerms.map((term) => (
                <article
                  key={term.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    transition: "all 0.18s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.055)";
                    e.currentTarget.style.borderColor = isExp
                      ? "rgba(168, 85, 247, 0.3)"
                      : "rgba(59, 130, 246, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                  }}
                >
                  {/* TOP ROW: TITLE & BADGES */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#ffffff",
                          letterSpacing: "-0.2px",
                          lineHeight: 1.3,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <HighlightText text={term.title} query={searchQuery} />
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "9999px",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-muted, #94a3b8)",
                          }}
                        >
                          <HighlightText text={term.category} query={searchQuery} />
                        </span>

                        {term.modes.includes("exp") && !term.modes.includes("prod") && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: "rgba(168, 85, 247, 0.18)",
                              color: "#c084fc",
                            }}
                          >
                            🧪 Lab Only
                          </span>
                        )}

                        {term.modes.includes("prod") && !term.modes.includes("exp") && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: "rgba(59, 130, 246, 0.18)",
                              color: "#60a5fa",
                            }}
                          >
                            ⚡ Standard
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COPY BUTTON */}
                    <button
                      onClick={(e) => copyTerm(term, e)}
                      title="Copy term and definition"
                      style={{
                        background: copiedId === term.id ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: "1px solid " + (copiedId === term.id ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.08)"),
                        borderRadius: "8px",
                        padding: "5px 9px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: copiedId === term.id ? "#34d399" : "var(--text-muted, #94a3b8)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedId === term.id ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>

                  {/* DEFINITION */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      lineHeight: "1.55",
                      color: "var(--text-secondary, #cbd5e1)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <HighlightText text={term.definition} query={searchQuery} />
                  </p>

                  {/* WHY IT MATTERS */}
                  {term.whyItMatters && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "10px",
                        background: isExp
                          ? "rgba(168, 85, 247, 0.07)"
                          : "rgba(59, 130, 246, 0.06)",
                        borderLeft: isExp
                          ? "3px solid #a855f7"
                          : "3px solid #3b82f6",
                        fontSize: "12px",
                        lineHeight: "1.45",
                        color: "var(--text-primary, #f1f5f9)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <strong
                        style={{
                          color: isExp ? "#d8b4fe" : "#93c5fd",
                          fontWeight: 700,
                          marginRight: "4px",
                        }}
                      >
                        Why it matters:
                      </strong>
                      <HighlightText text={term.whyItMatters} query={searchQuery} />
                    </div>
                  )}

                  {/* FORMULA / METRIC */}
                  {term.formula && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        background: "rgba(0, 0, 0, 0.4)",
                        fontFamily: "'Fira Code', 'Courier New', monospace",
                        fontSize: "12px",
                        color: "#38bdf8",
                        overflowX: "auto",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span style={{ color: "var(--text-muted, #64748b)", fontWeight: 700 }}>Formula:</span>
                      <code>{term.formula}</code>
                    </div>
                  )}

                  {/* WHERE YOU SEE THIS */}
                  {term.location && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "var(--text-muted, #7c8ba1)",
                      }}
                    >
                      <span style={{ fontSize: "12px" }}>📍</span>
                      <span>
                        <strong style={{ color: "var(--text-secondary, #94a3b8)" }}>Found at:</strong>{" "}
                        <HighlightText text={term.location} query={searchQuery} />
                      </span>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* FOOTER INSIDE DYNAMIC FLOW */}
          <footer
            style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--text-muted, #64748b)",
              marginTop: "auto",
            }}
          >
            <span>
              Press <kbd style={{ padding: "1px 5px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", color: "var(--text-primary, #ffffff)" }}>ESC</kbd> to exit
            </span>
            <span>PilotMaster Observability Glossary</span>
          </footer>
        </div>

        {/* FLOATING QUICK RETURN / SEARCH BUTTON WHEN SCROLLED DOWN */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            title="Scroll to search bar"
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              zIndex: 10,
              background: isExp
                ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                : "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 700,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span>↑</span>
            <span>Search</span>
          </button>
        )}
      </aside>

      {/* INJECT ANIMATION KEYFRAMES */}
      <style>{`
        @keyframes pilot-glossary-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pilot-glossary-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 640px) {
          .glossary-drawer {
            width: 100vw !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
    </div>
  );
}
