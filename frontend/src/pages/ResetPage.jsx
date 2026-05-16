function ResetPage({ footer, publicNav, resetForm, onResetChange, onResetPassword, loadingAuth, authNotice, authError }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <section className="marketing-card narrow-card reset-card">
        <div className="reset-hero-copy">
          <p className="eyebrow">Roast &amp; Boast AI</p>
          <h1>Set a fresh password for your account.</h1>
          <p className="hero-copy">
            Choose a strong new password to restore access to your workspace. This secure link expires shortly for your safety.
          </p>
        </div>

        <form className="auth-form reset-form" onSubmit={onResetPassword}>
          <label className="auth-label" htmlFor="reset-password">
            New password
          </label>
          <input
            id="reset-password"
            minLength={6}
            name="password"
            onChange={onResetChange}
            placeholder="Enter your new password"
            type="password"
            value={resetForm.password}
          />
          <button className="primary-button" disabled={loadingAuth} type="submit">
            {loadingAuth ? "Updating..." : "Reset password"}
          </button>
          {authNotice ? <p className="notice success">{authNotice}</p> : null}
          {authError ? <p className="notice error">{authError}</p> : null}
        </form>
      </section>
      {footer}
    </div>
  );
}

export default ResetPage;
