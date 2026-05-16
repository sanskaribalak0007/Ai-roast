import { formatConversationDate } from "../../utils/formatters";

function Sidebar({
  routeType,
  onNavigateTool,
  history,
  activeChatId,
  historySearch,
  onHistorySearchChange,
  onNewChat,
  renamingChatId,
  renameValue,
  onRenameValueChange,
  onCommitRename,
  onBeginRename,
  onDeleteChat,
  onOpenChat,
  sessionUser,
  statusLine,
  onLogout
}) {
  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div>
          <p className="eyebrow">Conversations</p>
          <h2>Study Chats</h2>
        </div>
        <button className="ghost-button" onClick={onNewChat} type="button">
          New chat
        </button>
      </header>

      <nav className="sidebar-tools" aria-label="Workspace tools">
        <div className="section-head compact">
          <p className="eyebrow">Tools</p>
          <h3>Protected utilities</h3>
        </div>
        <div className="tool-link-list">
          <button className={`tool-link ${routeType === "auth" ? "active" : ""}`} onClick={() => onNavigateTool("auth")} type="button">
            AI Chat
          </button>
          <button className={`tool-link ${routeType === "billing" ? "active" : ""}`} onClick={() => onNavigateTool("billing")} type="button">
            Billing
          </button>
          <button className={`tool-link ${routeType === "scraper" ? "active" : ""}`} onClick={() => onNavigateTool("scraper")} type="button">
            Scraper
          </button>
          <button className={`tool-link ${routeType === "audit" ? "active" : ""}`} onClick={() => onNavigateTool("audit")} type="button">
            Page Audit
          </button>
          <button
            className={`tool-link ${routeType === "playground" ? "active" : ""}`}
            onClick={() => onNavigateTool("playground")}
            type="button"
          >
            Code Studio
          </button>
        </div>
      </nav>

      <section className="sidebar-history" aria-label="Chat history">
        <div className="section-head compact">
          <p className="eyebrow">Saved history</p>
          <h3>Continue a chat</h3>
        </div>

        <div className="search-card compact-search">
          <label htmlFor="history-search">Search conversations</label>
          <input
            id="history-search"
            onChange={(event) => onHistorySearchChange(event.target.value)}
            placeholder="Search by topic or answer"
            value={historySearch}
          />
        </div>

        <div className="sidebar-history-list">
          {history.map((chat) => (
            <article className={`history-item ${activeChatId === chat._id ? "active" : ""}`} key={chat._id}>
              {renamingChatId === chat._id ? (
                <div className="rename-row">
                  <input onChange={(event) => onRenameValueChange(event.target.value)} value={renameValue} />
                  <button className="mini-button" onClick={onCommitRename} type="button">
                    Save
                  </button>
                </div>
              ) : (
                <button className="history-title" onClick={() => onOpenChat(chat._id)} type="button">
                  <span className="history-title-text">{chat.title}</span>
                  <span className="history-meta">{formatConversationDate(chat.updatedAt || chat.createdAt)}</span>
                </button>
              )}

              <div className="history-actions">
                <button className="text-button" onClick={() => onBeginRename(chat)} type="button">
                  Rename
                </button>
                <button className="text-button danger" onClick={() => onDeleteChat(chat._id)} type="button">
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!history.length ? (
            <p className="empty-copy">No saved conversations yet. Start from a template or ask your own question.</p>
          ) : null}
        </div>
      </section>

      <footer className="sidebar-footer">
        <div className="sidebar-footer-user">
          <strong title={sessionUser.email}>{sessionUser.email}</strong>
          <p>{statusLine}</p>
        </div>
        <button className="ghost-button" onClick={onLogout} type="button">
          Logout
        </button>
      </footer>
    </aside>
  );
}

export default Sidebar;
