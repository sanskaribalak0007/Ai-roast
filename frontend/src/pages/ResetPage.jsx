function ResetPage({ footer, publicNav, resetForm, onResetChange, onResetPassword, loadingAuth, authNotice, authError }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <section className="marketing-card narrow-card">
        <div className="section-head">
          <p className="eyebrow">Reset Password</p>
          <h1>Create a new password</h1>
        </div>
        <form className="auth-form" onSubmit={onResetPassword}>
          <input
            minLength={6}
            name="password"
            onChange={onResetChange}
            placeholder="New password"
            type="password"
            value={resetForm.password}
          />
          <button className="primary-button" disabled={loadingAuth} type="submit">
            {loadingAuth ? "Updating..." : "Reset Password"}
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
