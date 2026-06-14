export function CustomSelector({
  label,
  sublabel,
  open,
  onToggle,
  selectorRef,
  children,
}) {
  return (
    <div
      ref={selectorRef}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-primary)",
          cursor: "pointer",
          padding: 0,
          fontSize: "16px",
          textAlign: "left",
        }}
      >
        {label} ▼
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "10px",
            width: "300px",
            zIndex: 9999,
            borderRadius: "16px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      )}

      <span
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "4px",
        }}
      >
        {sublabel}
      </span>
    </div>
  );
}

export function SelectorItem({
  label,
  subtitle,
  active,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        cursor: "pointer",
        background: active
          ? "var(--surface-hover)"
          : "transparent",
      }}
    >
      <div>
        {active ? "✓ " : ""}
        {label}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginTop: "4px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}