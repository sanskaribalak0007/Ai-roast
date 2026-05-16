function ResetPage({ footer, publicNav }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <section className="marketing-card narrow-card reset-card">
        <div className="reset-hero-copy">
          <p className="eyebrow">Roast &amp; Boast AI</p>
          <h1>Password recovery is currently unavailable.</h1>
          <p className="hero-copy">
            We have temporarily removed reset-by-email for a simpler and more stable sign-in flow. If you cannot access
            your account, contact support or create a new account with a different email.
          </p>
        </div>
      </section>
      {footer}
    </div>
  );
}

export default ResetPage;
