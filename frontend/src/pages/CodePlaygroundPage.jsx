import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PLAYGROUND_SNIPPETS, PLAYGROUND_EDITOR_TABS } from "../constants/playgroundDefaults";
import { buildPreviewDocument } from "../utils/buildPreviewDocument";

const PREVIEW_DEBOUNCE_MS = 280;
const PLAYGROUND_STORAGE_KEY = "ai-roast.playground.state";

const loadPersistedState = () => {
  try {
    const raw = window.localStorage.getItem(PLAYGROUND_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.snippets) {
      return null;
    }

    return {
      activeTab: parsed.activeTab || "html",
      projectName: parsed.projectName || "roast-project",
      snippets: {
        html: parsed.snippets.html || DEFAULT_PLAYGROUND_SNIPPETS.html,
        css: parsed.snippets.css || DEFAULT_PLAYGROUND_SNIPPETS.css,
        javascript: parsed.snippets.javascript || DEFAULT_PLAYGROUND_SNIPPETS.javascript
      }
    };
  } catch {
    return null;
  }
};

const sanitizeProjectName = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "roast-project";

const downloadTextFile = (filename, content) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const createWritableFile = async (directoryHandle, fileName, content) => {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};

const createUniqueProjectDirectory = async (parentHandle, baseName) => {
  let attempt = 0;

  while (attempt < 50) {
    const folderName = attempt === 0 ? baseName : `${baseName}-${attempt + 1}`;

    try {
      await parentHandle.getDirectoryHandle(folderName);
      attempt += 1;
    } catch {
      return parentHandle.getDirectoryHandle(folderName, { create: true });
    }
  }

  return parentHandle.getDirectoryHandle(`${baseName}-${Date.now()}`, { create: true });
};

function CodePlaygroundPage() {
  const persistedState = loadPersistedState();
  const [activeTab, setActiveTab] = useState(persistedState?.activeTab || "html");
  const [projectName, setProjectName] = useState(persistedState?.projectName || "roast-project");
  const [snippets, setSnippets] = useState(persistedState?.snippets || DEFAULT_PLAYGROUND_SNIPPETS);
  const [previewMarkup, setPreviewMarkup] = useState(() => buildPreviewDocument(persistedState?.snippets || DEFAULT_PLAYGROUND_SNIPPETS));
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [saveError, setSaveError] = useState("");

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
    window.localStorage.setItem(
      PLAYGROUND_STORAGE_KEY,
      JSON.stringify({
        activeTab,
        projectName,
        snippets
      })
    );
  }, [activeTab, projectName, snippets]);

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
    setProjectName("roast-project");
    setSaveNotice("");
    setSaveError("");
  };

  const saveProject = async () => {
    setSaveNotice("");
    setSaveError("");

    const safeProjectName = sanitizeProjectName(projectName);

    try {
      if (typeof window.showDirectoryPicker === "function") {
        const parentHandle = await window.showDirectoryPicker();
        const projectDirectory = await createUniqueProjectDirectory(parentHandle, `Roast-${safeProjectName}`);

        await createWritableFile(projectDirectory, "index.html", snippets.html);
        await createWritableFile(projectDirectory, "style.css", snippets.css);
        await createWritableFile(projectDirectory, "script.js", snippets.javascript);

        setSaveNotice(`Project saved inside folder ${projectDirectory.name}.`);
        return;
      }

      downloadTextFile(`${safeProjectName}-index.html`, snippets.html);
      downloadTextFile(`${safeProjectName}-style.css`, snippets.css);
      downloadTextFile(`${safeProjectName}-script.js`, snippets.javascript);
      setSaveNotice("Browser folder access is unavailable here, so files were downloaded instead.");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      setSaveError(error.message || "Unable to save project files.");
    }
  };

  return (
    <section className="tool-page playground-page">
      <div className="section-head">
        <p className="eyebrow">Code Studio</p>
        <h2>Write HTML, CSS, and JavaScript with instant live preview.</h2>
        <p className="hero-copy">
          Your work now stays in place when you leave this page. Reset only happens when you press reset yourself.
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
          <input
            className="playground-project-name"
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project name"
            value={projectName}
          />
          <button className="ghost-button" onClick={saveProject} type="button">
            Save project
          </button>
          <button className="ghost-button" onClick={resetPlayground} type="button">
            Reset starter
          </button>
          <button className="primary-button" onClick={() => setFullPreviewOpen(true)} type="button">
            Full preview
          </button>
        </div>
      </div>

      {saveNotice ? <p className="notice success">{saveNotice}</p> : null}
      {saveError ? <p className="notice error">{saveError}</p> : null}

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
