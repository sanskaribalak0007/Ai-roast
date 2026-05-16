import { renderFormattedAnswer } from "../utils/renderFormattedAnswer";

function SharedChatPage({ footer, publicNav, sharedChat, sharedChatError }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <section className="marketing-card shared-card">
        <div className="section-head">
          <p className="eyebrow">Shared Conversation</p>
          <h1>{sharedChat?.title || "Open shared study chat"}</h1>
        </div>
        {sharedChatError ? <p className="notice error">{sharedChatError}</p> : null}
        <section className="message-panel shared-message-panel">
          {sharedChat?.messages?.length ? (
            sharedChat.messages.map((message) => (
              <article className={`message-bubble ${message.role}`} key={message._id || `${message.role}-${message.createdAt}`}>
                <div className="message-meta">
                  <span>{message.role === "assistant" ? "AI" : "User"}</span>
                </div>
                <div className="formatted-answer">{renderFormattedAnswer(message.content)}</div>
                {message.attachment?.url ? (
                  <a className="file-link" href={message.attachment.url} rel="noreferrer" target="_blank">
                    Open attachment: {message.attachment.originalName}
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <h2>No messages available in this shared conversation.</h2>
            </div>
          )}
        </section>
      </section>
      {footer}
    </div>
  );
}

export default SharedChatPage;
