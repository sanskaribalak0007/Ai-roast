function AuthPage({ footer, publicNav, authMode, setAuthMode, authForm, forgotForm, onAuthChange, onForgotChange, onRegisterOrLogin, onForgotPassword, loadingAuth, authNotice, authError }) {
  return (
    <div className="marketing-shell">
      {publicNav}
      <div className="auth-shell">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">AI Roast Studio</p>
            <h1>
              Study smarter.
              <span> Build faster.</span>
            </h1>
            <p className="hero-copy">
              A workspace for project prompting, private chat history, file analysis, and guided AI responses that
              feel more useful than generic one-off answers.
            </p>
          </div>

          <div className="hero-feature-band">
            <div className="hero-feature-card">
              <p className="feature-kicker">What you can do</p>
              <h3>Turn rough ideas into full project prompts</h3>
              <p>Ask naturally, pick examples, and get guided answers that are easier to build from.</p>
            </div>
            <div className="hero-feature-list">
              <span>Prompt-driven builds</span>
              <span>Private chat memory</span>
              <span>File-based analysis</span>
              <span>Project-ready guidance</span>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-tabs">
            <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")} type="button">
              Login
            </button>
            <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")} type="button">
              Register
            </button>
            <button className={authMode === "forgot" ? "active" : ""} onClick={() => setAuthMode("forgot")} type="button">
              Forgot
            </button>
          </div>

          {authMode !== "forgot" ? (
            <form className="auth-form" onSubmit={onRegisterOrLogin}>
              <h2>{authMode === "register" ? "Create your account" : "Welcome back"}</h2>
              {authMode === "register" ? (
                <input name="name" onChange={onAuthChange} placeholder="Your name" value={authForm.name} />
              ) : null}
              <input name="email" onChange={onAuthChange} placeholder="Email" type="email" value={authForm.email} />
              <input name="password" onChange={onAuthChange} placeholder="Password" type="password" value={authForm.password} />
              <button className="primary-button" disabled={loadingAuth} type="submit">
                {loadingAuth ? "Processing..." : authMode === "register" ? "Create account" : "Login"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={onForgotPassword}>
              <h2>Recover your account</h2>
              <input
                name="email"
                onChange={onForgotChange}
                placeholder="Registered email"
                type="email"
                value={forgotForm.email}
              />
              <button className="primary-button" disabled={loadingAuth} type="submit">
                {loadingAuth ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          {authNotice ? <p className="notice success">{authNotice}</p> : null}
          {authError ? <p className="notice error">{authError}</p> : null}
        </section>
      </div>
      {footer}
    </div>
  );
}

export default AuthPage;
