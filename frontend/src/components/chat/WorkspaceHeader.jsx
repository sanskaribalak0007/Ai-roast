function WorkspaceHeader({ onShareChat, canShare }) {
  return (
    <header className="workspace-header minimal">
      <div className="workspace-tools">
        <button className="ghost-button" disabled={!canShare} onClick={onShareChat} type="button">
          Share chat
        </button>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
