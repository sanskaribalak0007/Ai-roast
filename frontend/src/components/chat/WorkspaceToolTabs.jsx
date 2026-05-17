const TOOL_ITEMS = [
  { key: "auth", label: "Chat" },
  { key: "roast", label: "Roast" },
  { key: "billing", label: "Billing" },
  { key: "scraper", label: "Scraper" },
  { key: "audit", label: "Page Audit" },
  { key: "playground", label: "Code Studio" }
];

function WorkspaceToolTabs({ routeType, onNavigateTool }) {
  return (
    <nav className="workspace-tool-tabs" aria-label="Workspace tools">
      {TOOL_ITEMS.map((item) => (
        <button
          className={`workspace-tool-tab ${routeType === item.key ? "active" : ""}`}
          key={item.key}
          onClick={() => onNavigateTool(item.key)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default WorkspaceToolTabs;
