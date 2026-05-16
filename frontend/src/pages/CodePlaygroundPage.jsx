import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PLAYGROUND_SNIPPETS, PLAYGROUND_EDITOR_TABS } from "../constants/playgroundDefaults";
import { buildPreviewDocument } from "../utils/buildPreviewDocument";

const PREVIEW_DEBOUNCE_MS = 280;

function CodePlaygroundPage() {
  const [activeTab, setActiveTab] = useState("html");
  const [snippets, setSnippets] = useState(DEFAULT_PLAYGROUND_SNIPPETS);
  const [previewMarkup, setPreviewMarkup] = useState(() => buildPreviewDocument(DEFAULT_PLAYGROUND_SNIPPETS));
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  const liveDocument = useMemo(
    () => buildPreviewDocument(snippets),
    [snippets.html, snippets.css, snippets.javascript]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewMarkup(liveDocument);
    }, PREVIEW_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [liveDocument]);

  useEffect(() => {
    if (!fullPreviewOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setFullPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullPreviewOpen]);

  const updateSnippet = (value) => {
    setSnippets((current) => ({
      ...current,
      [activeTab]: value
    }));
  };

  const resetPlayground = () => {
    setSnippets(DEFAULT_PLAYGROUND_SNIPPETS);
    setActiveTab("html");
  };

  return (
    <section className="tool-page playground-page">
      <div className="section-head">
        <p className="eyebrow">Code Studio</p>
        <h2>Write HTML, CSS, and JavaScript with instant live preview.</h2>
        <p className="hero-copy">
          Split-pane editor with debounced preview updates. Open full preview when you want a distraction-free view.
        </p>
      </div>

      <div className="playground-toolbar">
        <div className="playground-tab-list" role="tablist" aria-label="Editor language">
          {PLAYGROUND_EDITOR_TABS.map((tab) => (
            <button
              className={`playground-tab ${activeTab === tab.id ? "active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="playground-toolbar-actions">
          <button className="ghost-button" onClick={resetPlayground} type="button">
            Reset starter
          </button>
          <button className="primary-button" onClick={() => setFullPreviewOpen(true)} type="button">
            Full preview
          </button>
        </div>
      </div>

      <div className="playground-layout">
        <div className="playground-editor-pane">
          <label className="playground-editor-label" htmlFor="playground-editor">
            {PLAYGROUND_EDITOR_TABS.find((tab) => tab.id === activeTab)?.label}
          </label>
          <textarea
            className="playground-editor"
            id="playground-editor"
            onChange={(event) => updateSnippet(event.target.value)}
            spellCheck={false}
            value={snippets[activeTab]}
          />
        </div>

        <div className="playground-preview-pane">
          <div className="playground-preview-head">
            <strong>Live preview</strong>
            <span>Updates as you type</span>
          </div>
          <iframe
            className="playground-preview-frame"
            sandbox="allow-scripts allow-modals"
            srcDoc={previewMarkup}
            title="Playground live preview"
          />
        </div>
      </div>

      {fullPreviewOpen ? (
        <div className="playground-fullscreen" role="dialog" aria-modal="true" aria-label="Full preview">
          <div className="playground-fullscreen-bar">
            <strong>Full preview</strong>
            <button className="ghost-button" onClick={() => setFullPreviewOpen(false)} type="button">
              Close
            </button>
          </div>
          <iframe
            className="playground-fullscreen-frame"
            sandbox="allow-scripts allow-modals"
            srcDoc={liveDocument}
            title="Playground full preview"
          />
        </div>
      ) : null}
    </section>
  );
}

export default CodePlaygroundPage;
