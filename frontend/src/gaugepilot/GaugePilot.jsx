import { useState, useEffect, useRef, lazy, Suspense } from "react";
import ExperimentSetup from "./pages/ExperimentSetup";
const AIAnalysis = lazy(() => import("./pages/Aianalysis"));
const GlossaryDrawer = lazy(() => import("../components/GlossaryDrawer"));
import GlossaryButton from "../components/GlossaryButton";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { id: "top",              label: "Home",            icon: "🏠",  action: "home" },
      { id: "nav-docpilot",     label: "DocPilot",        icon: "📄",  action: "docpilot" },
      { id: "nav-tracepilot",   label: "TracePilot",      icon: "🔍",  action: "tracepilot" },
      { id: "experiment-setup", label: "Experiment Setup",icon: "🧪",  scrollTo: "experiment-setup" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { id: "leaderboards",    label: "Leaderboards",    icon: "🏆", scrollTo: "leaderboards"    },
      { id: "visualizations",  label: "Visualizations",  icon: "📈", scrollTo: "visualizations"  },
      { id: "ai-analysis",     label: "AI Analysis",     icon: "🤖", scrollTo: "ai-analysis"     },
    ],
  },
];

const SECTION_IDS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.scrollTo)).filter(Boolean);

export default function GaugePilot({ onHome, onDocPilot, onTracePilot }) {
  const [activeSection, setActiveSection] = useState("experiment-setup");
  const [isCollapsed, setIsCollapsed]     = useState(false);
  const [isMobileOpen, setIsMobileOpen]   = useState(false);
  const [hoveredItem, setHoveredItem]     = useState(null);
  const [isMobile, setIsMobile]           = useState(false);

  // selectedRun is lifted here so AIAnalysis can always reflect the currently
  // active run even when the user navigates away from ExperimentSetup.
  const [selectedRun, setSelectedRun]     = useState(null);
  const [showGlossary, setShowGlossary]   = useState(false);

  const observersRef = useRef([]);
  const mainRef      = useRef(null);
  const isNavigatingRef = useRef(false);
  const navTimerRef  = useRef(null);

  // Helper to accurately get the element top relative to mainRef scroll container
  const getElementTopInMain = (el, mainEl) => {
    if (!el || !mainEl) return 0;
    const mainRect = mainEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return mainEl.scrollTop + (elRect.top - mainRect.top);
  };

  // ── Responsive breakpoints ─────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Hash navigation on mount ───────────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && SECTION_IDS.includes(hash)) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el && mainRef.current) {
          const targetTop = getElementTopInMain(el, mainRef.current) - 10;
          mainRef.current.scrollTo({
            top: Math.max(0, targetTop),
            behavior: "smooth",
          });
          setActiveSection(hash);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Scroll spy ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      if (isNavigatingRef.current) return;

      const scrollTop = mainEl.scrollTop;
      const viewportH = mainEl.clientHeight;
      const scrollHeight = mainEl.scrollHeight;

      // If scrolled to the bottom of the container, activate the last section
      if (scrollTop + viewportH >= scrollHeight - 40) {
        const last = SECTION_IDS[SECTION_IDS.length - 1];
        if (last) setActiveSection(last);
        return;
      }

      const sections = SECTION_IDS
        .map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          return { id, top: getElementTopInMain(el, mainEl) };
        })
        .filter(Boolean)
        .sort((a, b) => a.top - b.top);

      if (!sections.length) return;

      const threshold = scrollTop + viewportH * 0.35;
      let current = sections[0].id;
      for (const s of sections) {
        if (s.top <= threshold) current = s.id;
      }

      setActiveSection(current);
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigateTo = (item) => {
    if (isMobile) setIsMobileOpen(false);

    if (item.action === "home") {
      onHome?.();
      return;
    }
    if (item.action === "docpilot") {
      onDocPilot?.();
      return;
    }
    if (item.action === "tracepilot") {
      onTracePilot?.();
      return;
    }

    const sectionId = item.scrollTo;
    const element = document.getElementById(sectionId);
    if (element && mainRef.current) {
      isNavigatingRef.current = true;
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 700);

      const targetTop = getElementTopInMain(element, mainRef.current) - 10;
      mainRef.current.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };


  // ── Design tokens ──────────────────────────────────────────────────────────
  const accent   = "#a855f7";
  const sidebarW = isCollapsed ? "72px" : "240px";

  const sidebarStyle = {
    width: sidebarW,
    minWidth: sidebarW,
    height: "100vh",
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-secondary)",
    transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
    zIndex: 50,
    overflowX: "hidden",
    flexShrink: 0,
  };

  const mobileSidebarStyle = {
    ...sidebarStyle,
    position: "fixed",
    left: isMobileOpen ? 0 : "-280px",
    width: "260px",
    minWidth: "260px",
    transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
    zIndex: 200,
  };

  // ── Sidebar content ────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Branding */}
      <div style={{
        padding: isCollapsed ? "20px 0" : "20px 18px",
        display: "flex", alignItems: "center",
        justifyContent: isCollapsed ? "center" : "space-between",
        gap: "10px", flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div>
            <h1 style={{
              margin: 0, fontSize: "26px", fontFamily: "'Inter', sans-serif",
              fontWeight: 800, letterSpacing: "-0.7px", color: "#c084fc", lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}>GaugePilot</h1>
            <p style={{
              margin: "2px 0 0",
              fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
              letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
            }}>Benchmark Studio</p>
          </div>
        )}

        {isCollapsed && (
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#c084fc" }}>GP</span>
        )}


        {!isMobile && (
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "9999px", color: "var(--text-secondary)", cursor: "pointer",
              padding: "6px 8px", fontSize: "12px", lineHeight: 1, flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "12px 10px", scrollbarWidth: "none",
      }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "8px" }}>

            {/* Group label */}
            {!isCollapsed && (
              <div style={{
                fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--text-muted)",
                padding: "8px 12px 4px", userSelect: "none",
              }}>
                {group.label}
              </div>
            )}
            {isCollapsed && <div style={{ height: "10px" }} />}

            {/* Nav items */}
            {group.items.map((item) => {
              const { id, label, icon, scrollTo, action } = item;
              const isActive = scrollTo ? activeSection === scrollTo : false;
              const isHover  = hoveredItem === id;
              const itemHref = action === "home"
                ? "/home"
                : action === "docpilot"
                ? "/experimentalmode/docpilot"
                : action === "tracepilot"
                ? "/experimentalmode/tracepilot"
                : `#${scrollTo}`;

              return (
                <a
                  key={id}
                  href={itemHref}
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      navigateTo(item);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem(id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={isCollapsed ? label : undefined}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: isCollapsed ? "10px 0" : "9px 14px",
                    marginBottom: "2px",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    background: isActive
                      ? "rgba(168,85,247,0.18)"
                      : isHover
                      ? "rgba(255,255,255,0.05)"
                      : "transparent",
                    textDecoration: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    color: isActive
                      ? "#ffffff"
                      : isHover
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Icon */}
                  <span style={{
                    fontSize: "15px", lineHeight: 1, flexShrink: 0,
                  }}>
                    {icon}
                  </span>

                  {/* Label */}
                  {!isCollapsed && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {label}
                    </span>
                  )}
                </a>
              );
            })}

          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div style={{
          padding: "14px 18px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          <GlossaryButton
            variant="sidebar"
            onClick={() => setShowGlossary(true)}
            experimentMode={true}
          />
          <div style={{
            fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4,
          }}>
            <p style={{ margin: 0, fontWeight: 600 }}>GaugePilot Engine</p>
            <p style={{ margin: "2px 0 0", opacity: 0.7 }}>Multi-Model Benchmarks</p>
          </div>
        </div>
      )}
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "var(--bg-primary, #0a0e23)",
    }}>

      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 199,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen((o) => !o)}
          style={{
            position: "fixed", top: "16px", left: "16px", zIndex: 300,
            background: "rgba(10,14,35,0.95)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px", color: "white",
            fontSize: "18px", padding: "8px 11px",
            cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {isMobileOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Sidebar */}
      <aside style={isMobile ? mobileSidebarStyle : sidebarStyle}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main
        ref={mainRef}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          paddingTop: isMobile ? "56px" : 0,
        }}
      >
        {/*
          ExperimentSetup owns the primary workflow. It receives onRunChange so
          it can bubble the currently-selected run up to GaugePilot, which then
          passes it down to AIAnalysis.
        */}
        <ExperimentSetup
          onRunChange={setSelectedRun}
        />

        {/* AI Analysis section — rendered below ExperimentSetup in the
            same scroll container so the sidebar scroll-spy picks it up. */}
        <Suspense fallback={<div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Loading AI Engineering Matrix Analysis...</div>}>
          <AIAnalysis
            selectedRun={selectedRun}
            onRunRefresh={async () => {
              // Re-fetch runs and update selectedRun in-place so the AI
              // Analysis page shows new reports without any user interaction.
              try {
                const { getBenchmarkRuns } = await import("./api");
                const token = localStorage.getItem("token");
                const runs  = await getBenchmarkRuns(token);
                const sorted = [...runs].sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                if (!sorted.length) return;

                // Match on id so switching runs mid-generation still lands
                // on the right run rather than always jumping to the latest.
                const currentId = selectedRun?.id;
                const refreshed = currentId
                  ? (sorted.find((r) => r.id === currentId) ?? sorted[0])
                  : sorted[0];

                setSelectedRun(refreshed);
              } catch (err) {
                console.error("Failed to refresh runs after analysis", err);
              }
            }}
          />
        </Suspense>
      </main>

      {/* FLOATING GLOSSARY QUICK TRIGGER */}
      <GlossaryButton
        variant="floating"
        onClick={() => setShowGlossary(true)}
        experimentMode={true}
      />

      {/* CONTEXT-AWARE GLOSSARY DRAWER */}
      <Suspense fallback={null}>
        <GlossaryDrawer
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
          page="gaugepilot"
          mode="exp"
        />
      </Suspense>
    </div>
  );
}