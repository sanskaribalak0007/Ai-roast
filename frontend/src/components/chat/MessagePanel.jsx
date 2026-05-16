import { renderFormattedAnswer } from "../../utils/renderFormattedAnswer";

function MessagePanel({ activeChat, messagePanelRef, typingTarget, typingVisible, editingMessageId, editValue, onEditValueChange, onBeginEdit, onCommitEdit }) {
  const messages = activeChat?.chat?.messages || [];

  return (
    <section className="message-panel" ref={messagePanelRef}>
      {messages.length ? (
        messages.map((message) => {
          const isTypedAssistant = message.role === "assistant" && message._id === typingTarget.messageId;
          const visibleContent = isTypedAssistant ? typingVisible || "" : message.content;
          const showCursor = isTypedAssistant && typingVisible !== typingTarget.fullText;

          return (
            <article className={`message-bubble ${message.role}`} key={message._id}>
              <div className="message-meta">
                <span>{message.role === "assistant" ? "AI" : "You"}</span>
                {message.role === "user" ? (
                  editingMessageId === message._id ? (
                    <button className="text-button" onClick={onCommitEdit} type="button">
                      Update
                    </button>
                  ) : (
                    <button className="text-button" onClick={() => onBeginEdit(message)} type="button">
                      Edit
                    </button>
                  )
                ) : null}
              </div>

              {editingMessageId === message._id ? (
                <textarea onChange={(event) => onEditValueChange(event.target.value)} rows={4} value={editValue} />
              ) : (
                <div className="formatted-answer">
                  {renderFormattedAnswer(visibleContent)}
                  {showCursor ? <span className="typing-cursor" /> : null}
                </div>
              )}

              {message.attachment?.url ? (
                <a className="file-link" href={message.attachment.url} rel="noreferrer" target="_blank">
                  Open attachment: {message.attachment.originalName}
                </a>
              ) : null}
            </article>
          );
        })
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Fresh session</p>
          <h2>Pick a project idea or type your own prompt.</h2>
          <p>Example cards auto-fill the prompt box and immediately trigger a message like GPT.</p>
        </div>
      )}
    </section>
  );
}

export default MessagePanel;
