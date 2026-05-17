import { useEffect, useRef } from "react";

function Composer({ selectedFile, onClearFile, question, onQuestionChange, onKeyDown, onPaste, onFileChange, isSubmitting, onSubmit }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 220);
    textareaRef.current.style.height = `${Math.max(nextHeight, 28)}px`;
  }, [question, selectedFile]);

  return (
    <form className="composer" onSubmit={onSubmit}>
      <div className="composer-input-shell">
        {selectedFile ? (
          <div className="attachment-chip inside-composer">
            <span>{selectedFile.name || "Pasted image attached"}</span>
            <button className="text-button" onClick={onClearFile} type="button">
              Remove
            </button>
          </div>
        ) : null}
        <textarea
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder="Ask programming, study, science, or tech questions..."
          ref={textareaRef}
          rows={1}
          value={question}
        />
      </div>

      <div className="composer-row">
        <label className="file-picker">
          <input onChange={(event) => onFileChange(event.target.files?.[0] || null)} type="file" />
          <span>{selectedFile ? selectedFile.name : "Attach file"}</span>
        </label>

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <span className="button-loader-wrap">
              <span className="button-loader" aria-hidden="true" />
              {selectedFile ? "Analyzing..." : "Thinking..."}
            </span>
          ) : selectedFile ? (
            "Upload and ask"
          ) : (
            "Send message"
          )}
        </button>
      </div>
    </form>
  );
}

export default Composer;
