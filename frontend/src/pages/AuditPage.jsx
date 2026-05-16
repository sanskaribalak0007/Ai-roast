import { useState } from "react";

function AuditPage({ onAudit }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAudit = async () => {
    if (!url.trim()) {
      setError("Paste a page URL first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await onAudit(url.trim());
      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-page">
      <div className="section-head">
        <p className="eyebrow">Page Audit</p>
        <h2>Check basic speed and optimization signals for any page.</h2>
      </div>

      <div className="scraper-toolbar">
        <input
          className="scraper-url-input"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/page"
          type="url"
          value={url}
        />
        <button className="primary-button" disabled={loading} onClick={handleAudit} type="button">
          {loading ? "Checking..." : "Run Audit"}
        </button>
      </div>

      {error ? <p className="notice error">{error}</p> : null}

      {result ? (
        <div className="scraper-result">
          <div className="scraper-result-head">
            <div>
              <h2>{result.title}</h2>
              <p>{result.sourceUrl}</p>
            </div>
          </div>

          <div className="audit-metric-grid">
            <article className="audit-metric-card">
              <strong>{result.responseTimeMs} ms</strong>
              <span>Response Time</span>
            </article>
            <article className="audit-metric-card">
              <strong>{result.htmlSizeKb} KB</strong>
              <span>HTML Size</span>
            </article>
            <article className="audit-metric-card">
              <strong>{result.scriptCount}</strong>
              <span>Scripts</span>
            </article>
            <article className="audit-metric-card">
              <strong>{result.stylesheetCount}</strong>
              <span>Stylesheets</span>
            </article>
            <article className="audit-metric-card">
              <strong>{result.imageStats.total}</strong>
              <span>Images</span>
            </article>
            <article className="audit-metric-card">
              <strong>{result.imageStats.missingAlt}</strong>
              <span>Missing Alt Text</span>
            </article>
          </div>

          <section className="scraper-section">
            <h3>Checks</h3>
            <ul>
              <li>Viewport meta: {result.hasViewportMeta ? "Present" : "Missing"}</li>
              <li>Meta description: {result.hasMetaDescription ? "Present" : "Missing"}</li>
              <li>Large image candidates: {result.imageStats.largeCandidateCount}</li>
            </ul>
          </section>

          <section className="scraper-section">
            <h3>Recommendations</h3>
            <ul>
              {result.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default AuditPage;
