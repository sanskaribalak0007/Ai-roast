import { useState } from "react";

function ScraperPage({ onScrape }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const triggerScrape = async (downloadDoc = false) => {
    if (!url.trim()) {
      setError("Paste a website URL first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await onScrape(url.trim());
      setResult(data);

      if (downloadDoc) {
        const blob = new Blob([data.documentHtml], { type: "application/msword" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.fileName || "scraped-page.doc";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-page scraper-card">
        <div className="section-head">
          <p className="eyebrow">Scraper Tool</p>
          <h2>Paste any page link and turn it into a structured document.</h2>
          <p className="hero-copy">
            This tool fetches page content, extracts readable sections, and lets you download the result as a DOC file.
          </p>
        </div>

        <div className="scraper-toolbar">
          <input
            className="scraper-url-input"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            type="url"
            value={url}
          />
          <button className="primary-button" disabled={loading} onClick={() => triggerScrape(false)} type="button">
            {loading ? "Extracting..." : "Extract Content"}
          </button>
          <button className="ghost-button" disabled={loading} onClick={() => triggerScrape(true)} type="button">
            Download DOC
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
              <span>Extracted {new Date(result.extractedAt).toLocaleString("en-IN")}</span>
            </div>

            {result.description ? (
              <section className="scraper-section">
                <h3>Summary</h3>
                <p>{result.description}</p>
              </section>
            ) : null}

            {result.headings?.length ? (
              <section className="scraper-section">
                <h3>Headings</h3>
                <ul>
                  {result.headings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {result.paragraphs?.length ? (
              <section className="scraper-section">
                <h3>Main Content</h3>
                <ol>
                  {result.paragraphs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            ) : null}

            {result.listItems?.length ? (
              <section className="scraper-section">
                <h3>Key Points</h3>
                <ul>
                  {result.listItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {result.images?.length ? (
              <section className="scraper-section">
                <h3>Images</h3>
                <div className="scraper-image-grid">
                  {result.images.map((image) => (
                    <figure className="scraper-image-card" key={image.src}>
                      <img alt={image.alt || "Scraped"} src={image.src} />
                      <figcaption>{image.alt || "Scraped image"}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="scraper-section">
              <h3>Document Preview</h3>
              <pre className="scraper-preview">{result.markdown}</pre>
            </section>
          </div>
        ) : null}
    </section>
  );
}

export default ScraperPage;
