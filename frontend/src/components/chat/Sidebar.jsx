import { formatConversationDate } from "../../utils/formatters";

const getPlanLabel = (sessionUser) => {
  const planKey = sessionUser?.access?.subscription?.planKey || "";

  if (planKey === "pro_weekly") {
    return "Weekly";
  }

  if (planKey === "pro_monthly") {
    return "Monthly";
  }

  if (planKey === "pro_yearly") {
    return "Yearly";
  }

  return "Free";
};

function Sidebar({
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
  onLogout
}) {
  const userName = sessionUser?.name?.trim() || "Member";
  const planLabel = getPlanLabel(sessionUser);
  const initial = userName.charAt(0).toUpperCase() || "M";

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
          {!history.length ? <p className="empty-copy">No saved conversations yet. Start a new chat to create one.</p> : null}
        </div>
      </section>

      <footer className="sidebar-footer">
        <div className="sidebar-profile-card">
          <div className="sidebar-profile-avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="sidebar-profile-meta">
            <strong>{userName}</strong>
            <span>{planLabel} plan</span>
          </div>
        </div>
        <button className="ghost-button" onClick={onLogout} type="button">
          Logout
        </button>
      </footer>
    </aside>
  );
}

export default Sidebar;
