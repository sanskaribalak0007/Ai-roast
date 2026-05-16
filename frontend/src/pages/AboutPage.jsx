import { aboutPhotoUrl, comparisonRows } from "../constants/appData";
import Testimonials from "../components/public/Testimonials";

function AboutPage({ footer, publicNav, testimonials }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <section className="marketing-card">
        <div className="marketing-hero">
          <div>
            <p className="eyebrow">About AI Roast Studio</p>
            <h1>Built for learners who want answers, structure, and momentum.</h1>
            <p className="hero-copy">
              Our platform blends prompt guidance, private conversation history, file analysis, and project-ready
              examples in one place so students and developers can move faster with less confusion.
            </p>
          </div>

          <div className="photo-card">
            <img alt="AI Roast Studio workspace preview" className="photo-preview" src={aboutPhotoUrl} />
          </div>
        </div>

        <section className="info-grid">
          <article className="info-card">
            <h2>Why this AI is different</h2>
            <p>It is designed as a project workspace, not just a generic answer box.</p>
            <ul>
              <li>Prompt examples can trigger complete project generation instantly.</li>
              <li>Private session-based history keeps conversations organized.</li>
              <li>File analysis and editable messages make iteration easier.</li>
            </ul>
          </article>

          <article className="info-card">
            <h2>How to use it</h2>
            <ol>
              <li>Login or register your account.</li>
              <li>Pick a sample project or type your own prompt.</li>
              <li>Press `Enter` to send or use `Shift + Enter` for a new line.</li>
              <li>Upload files, refine messages, and keep building inside one thread.</li>
            </ol>
          </article>
        </section>

        <section className="comparison-card">
          <div className="section-head">
            <p className="eyebrow">Comparison</p>
            <h2>How our AI compares with other tools</h2>
          </div>
          <div className="comparison-table">
            {comparisonRows.map((row) => (
              <article className="comparison-row" key={row.tool}>
                <strong>{row.tool}</strong>
                <span>{row.bestFor}</span>
                <p>{row.difference}</p>
                <small>{row.howToUse}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-head">
            <p className="eyebrow">Testimonials</p>
            <h2>What users like about the flow</h2>
          </div>
          <Testimonials items={testimonials} />
        </section>
      </section>
      {footer}
    </div>
  );
}

export default AboutPage;
