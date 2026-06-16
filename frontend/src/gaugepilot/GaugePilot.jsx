import { useState, useEffect, useRef } from "react";
import ExperimentSetup from "./pages/ExperimentSetup";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { id: "top",              label: "Home",            icon: "⌂",  scrollTo: null },
      { id: "experiment-setup", label: "Experiment Setup",icon: "⬡",  scrollTo: "experiment-setup" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { id: "leaderboards",    label: "Leaderboards",    icon: "🏆", scrollTo: "leaderboards"    },
      { id: "visualizations",  label: "Visualizations",  icon: "📈", scrollTo: "visualizations"  },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "insights",        label: "Insights",        icon: "💡", scrollTo: "insights"        },
      { id: "recommendations", label: "Recommendations", icon: "⭐", scrollTo: "recommendations" },
    ],
  },
];

const SECTION_IDS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.scrollTo)).filter(Boolean);

export default function GaugePilot({ onHome }) {
  const [activeSection, setActiveSection] = useState("experiment-setup");
  const [isCollapsed, setIsCollapsed]     = useState(false);
  const [isMobileOpen, setIsMobileOpen]   = useState(false);
  const [hoveredItem, setHoveredItem]     = useState(null);
  const [isMobile, setIsMobile]           = useState(false);
  const observersRef = useRef([]);
  const mainRef = useRef(null);

  // ── Responsive breakpoints ─────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Scroll spy (bidirectional) ─────────────────────────────────────────────
  // Uses scroll position on the main container to determine which section is
  // currently "in view" by comparing scrollTop against each section's offsetTop.
  // This avoids IntersectionObserver's one-directional rootMargin bias.
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      const scrollTop = mainEl.scrollTop;
      const viewportH = mainEl.clientHeight;

      // Collect all sections that exist in the DOM
      const sections = SECTION_IDS
        .map((id) => {
          const el = document.getElementById(id);
          return el ? { id, top: el.offsetTop } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.top - b.top);

      if (!sections.length) return;

      // Pick the last section whose top edge is within the upper 40% of viewport
      const threshold = scrollTop + viewportH * 0.4;
      let current = sections[0].id;
      for (const s of sections) {
        if (s.top <= threshold) current = s.id;
      }

      setActiveSection(current);
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount so initial state is correct
    handleScroll();

    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigateTo = (sectionId) => {
    if (isMobile) setIsMobileOpen(false);

    if (!sectionId) {
      onHome?.();
      return;
    }

    const element = document.getElementById(sectionId);
    if (element && mainRef.current) {
      mainRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // ── Design tokens ──────────────────────────────────────────────────────────
  const accent   = "#4f6ef7";
  const sidebarW = isCollapsed ? "72px" : "240px";

  const sidebarStyle = {
    width: sidebarW,
    minWidth: sidebarW,
    height: "100vh",
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, rgba(12,17,42,0.99) 0%, rgba(9,13,32,1) 100%)",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
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
        padding: isCollapsed ? "24px 0" : "28px 20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.09)",
        display: "flex", alignItems: "center",
        justifyContent: isCollapsed ? "center" : "space-between",
        gap: "10px", flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div>
            <h1 style={{
              margin: 0, fontSize: "30px", fontFamily: "Georgia, serif",
              fontWeight: 700, letterSpacing: "-1px", color: "white", lineHeight: 1,
              whiteSpace: "nowrap",
            }}>GaugePilot</h1>
            <p style={{
              margin: "7px 0 0", fontFamily: "'Courier New', monospace",
              fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
            }}>benchmark & analysis</p>
          </div>
        )}

        {isCollapsed && (
          <span style={{ fontSize: "22px", lineHeight: 1 }}>◎</span>
        )}

        {!isMobile && (
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px", color: "rgba(255,255,255,0.65)", cursor: "pointer",
              padding: "5px 7px", fontSize: "12px", lineHeight: 1, flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.14)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
            }}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "12px 8px", scrollbarWidth: "none",
      }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "4px" }}>

            {/* Group label */}
            {!isCollapsed && (
              <div style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.38)",
                padding: "12px 10px 6px", userSelect: "none",
              }}>
                {group.label}
              </div>
            )}
            {isCollapsed && <div style={{ height: "16px" }} />}

            {/* Nav items */}
            {group.items.map(({ id, label, icon, scrollTo }) => {
              const isActive = activeSection === (scrollTo ?? "top");
              const isHover  = hoveredItem === id;

              return (
                <button
                  key={id}
                  onClick={() => navigateTo(scrollTo)}
                  onMouseEnter={() => setHoveredItem(id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={isCollapsed ? label : undefined}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center",
                    gap: "11px",
                    width: "100%",
                    padding: isCollapsed ? "10px 0" : "10px 12px",
                    marginBottom: "2px",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    background: isActive
                      ? "rgba(79,110,247,0.22)"
                      : isHover
                      ? "rgba(255,255,255,0.07)"
                      : "transparent",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    color: isActive
                      ? "#a0baff"
                      : isHover
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.6)",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? "0 0 16px rgba(79,110,247,0.18)" : "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {/* Active bar */}
                  {isActive && (
                    <span style={{
                      position: "absolute", left: 0, top: "20%", bottom: "20%",
                      width: "3px", borderRadius: "0 3px 3px 0",
                      background: "linear-gradient(180deg, #4f6ef7, #a78bfa)",
                      boxShadow: "0 0 8px rgba(79,110,247,0.8)",
                    }} />
                  )}

                  {/* Icon */}
                  <span style={{
                    fontSize: "16px", lineHeight: 1, flexShrink: 0,
                    filter: isActive ? "drop-shadow(0 0 4px rgba(79,110,247,0.9))" : "none",
                    transition: "filter 0.15s",
                  }}>
                    {icon}
                  </span>

                  {/* Label */}
                  {!isCollapsed && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 10px", borderRadius: "10px",
            background: "rgba(79,110,247,0.1)",
            border: "1px solid rgba(79,110,247,0.2)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
              boxShadow: "0 0 6px #22c55e", display: "inline-block", flexShrink: 0,
            }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              System ready
            </span>
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
        <ExperimentSetup />
      </main>
    </div>
  );
}