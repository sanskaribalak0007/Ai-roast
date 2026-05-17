import { useMemo, useState } from "react";

const ROAST_PROMPT_PREFIX = [
  "You are Roast & Boast AI.",
  "Give a moderate, constructive roast of this project idea or file.",
  "Be sharp but not abusive.",
  "After roasting, add a short section called 'How to improve'.",
  "Keep it practical for a student or builder."
].join(" ");

function RoastPage({ api, onOpenInChat }) {
  const [projectText, setProjectText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasResult = Boolean(result?.chatId && result?.answer);

  const helperText = useMemo(() => {
    if (selectedFile) {
      return `Attached: ${selectedFile.name}`;
    }

    return "Describe your project idea or attach a file for a moderate roast.";
  }, [selectedFile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const prompt = `${ROAST_PROMPT_PREFIX}\n\nProject context:\n${projectText.trim() || "Please roast the uploaded file or attached concept."}`;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("question", prompt);
        const response = await api.uploadFile(formData);
        setResult({
          chatId: response.chatId,
          answer: response.answer,
          title: response.title || "Roast result"
        });
      } else {
        const response = await api.sendMessage({
          question: prompt
        });
        setResult({
          chatId: response.chatId,
          answer: response.answer,
          title: response.title || "Roast result"
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Roast failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="tool-page roast-page">
      <div className="section-head">
        <p className="eyebrow">Roast</p>
        <h2>Get a sharp but useful review of your project idea or file.</h2>
        <p className="hero-copy">
          Drop your concept, pitch, or code file. The roast stays moderate, then gives a clear path to improve.
        </p>
      </div>

      <form className="roast-shell" onSubmit={handleSubmit}>
        <div className="roast-panel">
          <label className="playground-editor-label" htmlFor="roast-project-input">
            Describe your project
          </label>
          <textarea
            className="roast-textarea"
            id="roast-project-input"
            onChange={(event) => setProjectText(event.target.value)}
            placeholder="Describe the project idea, target users, stack, goals, and what you built so far..."
            value={projectText}
          />
          <div className="roast-meta-row">
            <label className="file-picker roast-file-picker">
              <input onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} type="file" />
              <span>{selectedFile ? selectedFile.name : "Attach file"}</span>
            </label>
            <span className="roast-helper-text">{helperText}</span>
          </div>
          <button className="primary-button roast-submit-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Roasting..." : "Roast this project"}
          </button>
        </div>

        <div className="roast-result-panel">
          <div className="playground-preview-head">
            <strong>Roast output</strong>
            <span>{hasResult ? "Ready to continue in chat" : "Your response will appear here"}</span>
          </div>

          {error ? <p className="notice error">{error}</p> : null}

          {hasResult ? (
            <>
              <article className="roast-answer-card">
                <pre className="roast-answer-pre">{result.answer}</pre>
              </article>
              <button className="ghost-button roast-followup-button" onClick={() => onOpenInChat(result.chatId)} type="button">
                Try to improve in chat
              </button>
            </>
          ) : (
            <div className="empty-state roast-empty-state">
              <h2>No roast yet</h2>
              <p>Submit a project idea or file and we will generate a moderate roast with improvement suggestions.</p>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}

export default RoastPage;
