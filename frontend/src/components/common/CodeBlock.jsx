import { useState } from "react";

function CodeBlock({ code = "", language = "code" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block-bar">
        <div className="code-block-meta">
          <div className="code-block-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span>{language}</span>
        </div>
        <button className="code-copy-button" onClick={handleCopy} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export default CodeBlock;
