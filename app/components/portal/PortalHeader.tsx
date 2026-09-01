interface PortalHeaderProps {
  projectName: string;
  pageTitle: string;
  phase?: string | null;
}

export function PortalHeader({ projectName, pageTitle, phase }: PortalHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 26,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-accent-700)",
          }}
        >
          {projectName}
        </p>
        <h1 style={{ margin: "2px 0 0" }}>{pageTitle}</h1>
      </div>
      {phase ? (
        <div style={{ textAlign: "right" }}>
          <div className="card-meta">Phase</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{phase}</div>
        </div>
      ) : null}
    </div>
  );
}
