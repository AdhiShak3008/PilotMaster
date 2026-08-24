export function CustomSelector({
  label,
  sublabel,
  open,
  onToggle,
  selectorRef,
  children,
  badge = null,
}) {
  return (
    <div
      ref={selectorRef}
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          background: open ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
          border: open ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
          color: "var(--text-primary)",
          cursor: "pointer",
          padding: "7px 14px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "500",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {badge && (
          <span
            style={{
              padding: "1px 6px",
              borderRadius: "9999px",
              background: "rgba(168, 85, 247, 0.25)",
              color: "#d8b4fe",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
        <span style={{ fontSize: "9px", color: "var(--text-muted)", opacity: 0.7 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "300px",
            maxHeight: "360px",
            overflowY: "auto",
            zIndex: 9999,
            borderRadius: "18px",
            background: "rgba(22, 27, 46, 0.96)",
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(24px)",
            padding: "8px",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      )}

      {sublabel && (
        <span
          style={{
            fontSize: "9px",
            color: "var(--text-muted)",
            marginTop: "3px",
            textAlign: "center",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

export function SelectorItem({
  label,
  subtitle,
  active,
  onClick,
  multiSelect,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: "12px",
        cursor: "pointer",
        background: active ? "rgba(168, 85, 247, 0.2)" : "transparent",
        color: active ? "#ffffff" : "var(--text-secondary)",
        transition: "all 0.15s ease",
        marginBottom: "2px",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          {multiSelect && (
            <span
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "5px",
                border: active ? "none" : "1.5px solid rgba(255, 255, 255, 0.2)",
                background: active ? "#a855f7" : "transparent",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                color: "white",
                flexShrink: 0,
              }}
            >
              {active ? "✓" : ""}
            </span>
          )}
          <span
            style={{
              fontSize: "13px",
              fontWeight: active ? "600" : "400",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>

        {!multiSelect && active && (
          <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: "bold" }}>✓</span>
        )}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "2px",
            paddingLeft: multiSelect ? "24px" : "0",
            lineHeight: 1.3,
            opacity: 0.8,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}