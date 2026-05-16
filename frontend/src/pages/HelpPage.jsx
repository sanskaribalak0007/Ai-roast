import Testimonials from "../components/public/Testimonials";

function HelpPage({ footer, publicNav, contactForm, onContactChange, onContactSubmit, loadingContact, contactNotice, contactError, testimonials }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <section className="marketing-card">
        <div className="section-head">
          <p className="eyebrow">Help & Contact</p>
          <h1>Need support, ideas, or feature suggestions?</h1>
          <p className="hero-copy">
            Send us your suggestion and we will receive it on the configured support email.
          </p>
        </div>

        <div className="help-layout">
          <form className="contact-form" onSubmit={onContactSubmit}>
            <h2>Contact Us</h2>
            <input name="name" onChange={onContactChange} placeholder="Your name" type="text" value={contactForm.name} />
            <input name="email" onChange={onContactChange} placeholder="Your email" type="email" value={contactForm.email} />
            <textarea
              name="message"
              onChange={onContactChange}
              placeholder="Write your suggestion, feedback, or question"
              rows={6}
              value={contactForm.message}
            />
            <button className="primary-button" disabled={loadingContact} type="submit">
              {loadingContact ? "Sending..." : "Send Suggestion"}
            </button>
            {contactNotice ? <p className="notice success">{contactNotice}</p> : null}
            {contactError ? <p className="notice error">{contactError}</p> : null}
          </form>

          <aside className="help-side">
            <article className="info-card">
              <h2>Quick help</h2>
              <ul>
                <li>Use example cards to start faster.</li>
                <li>Use `Enter` to send and `Shift + Enter` for line breaks.</li>
                <li>Upload a file when you want the AI to inspect content directly.</li>
              </ul>
            </article>

            <article className="info-card">
              <h2>Customer testimonials</h2>
              <Testimonials items={testimonials} />
            </article>
          </aside>
        </div>
      </section>
      {footer}
    </div>
  );
}

export default HelpPage;
