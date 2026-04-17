import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser, signupUser } from "../api.js";

const signupDefaults = {
  name: "",
  email: "",
  password: ""
};

const loginDefaults = {
  email: "",
  password: ""
};

function saveSession(session) {
  localStorage.setItem("skykoi_auth", "1");
  localStorage.setItem("skykoi_auth_token", session.token);
  localStorage.setItem("skykoi_auth_user", JSON.stringify(session.user));
}

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [form, setForm] = useState(isSignup ? signupDefaults : loginDefaults);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      isSignup
        ? {
            title: "Create your account",
            description: "Get started with SkyKoi for free.",
            submit: "Create Account",
            switchText: "Already have an account?",
            switchHref: "/login",
            switchLabel: "Sign in"
          }
        : {
            title: "Welcome back",
            description: "Sign in to continue to your SkyKoi workspace.",
            submit: "Sign In",
            switchText: "Don't have an account?",
            switchHref: "/signup",
            switchLabel: "Create one"
          },
    [isSignup]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = isSignup ? await signupUser(form) : await loginUser(form);
      saveSession(session);
      navigate("/dashboard/chat");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to continue right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__glow auth-shell__glow--primary" />
      <div className="auth-shell__glow auth-shell__glow--secondary" />
      <div className="auth-shell__noise" />
      <div className="auth-shell__topline" />
      <div className="auth-shell__bottomline" />

      <div className={`auth-card ${isSignup ? "auth-card--signup" : "auth-card--login"}`}>
        <div className="auth-card__logo-wrap">
          <img alt="SkyKoi" className="auth-card__logo" src="/skykoi-logo-white.png" />
        </div>

        <h1 className="auth-card__title">{copy.title}</h1>
        <p className="auth-card__subtitle">{copy.description}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <label className="auth-field">
              <span className="auth-field__label">Full name</span>
              <div className="auth-input-wrap">
                <input
                  autoComplete="name"
                  className="auth-input"
                  name="name"
                  onChange={handleChange}
                  placeholder={isSignup ? "Jane Smith" : ""}
                  required
                  value={form.name}
                />
              </div>
            </label>
          ) : null}

          <label className="auth-field">
            <span className="auth-field__label">Email address</span>
            <div className="auth-input-wrap">
              <input
                autoComplete="email"
                className="auth-input"
                name="email"
                onChange={handleChange}
                placeholder={isSignup ? "you@company.com" : "you@company.com"}
                required
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Password</span>
            <div className="auth-input-wrap">
              <input
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="auth-input"
                minLength={8}
                name="password"
                onChange={handleChange}
                placeholder={isSignup ? "Min. 8 characters" : "Min. 8 characters"}
                required
                type="password"
                value={form.password}
              />
            </div>
          </label>

          {isSignup ? (
            <div className="auth-experience">
              <div className="auth-field__label">Which experience do you want?</div>
              <div className="auth-experience__option auth-experience__option--selected" aria-selected="true">
                <div className="auth-experience__copy">
                  <div className="auth-experience__title">Developer</div>
                  <div className="auth-experience__text">
                    Full platform controls, advanced navigation, and system visibility.
                  </div>
                </div>
                <div className="auth-experience__indicator" aria-hidden="true">
                  <span />
                </div>
              </div>
            </div>
          ) : null}

          {error ? <div className="auth-status">{error}</div> : null}

          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Please wait..." : isSignup ? "Create account" : copy.submit}
          </button>
        </form>

        {isSignup ? (
          <p className="auth-legal">
            By signing up, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
          </p>
        ) : null}

        <p className="auth-switch">
          {copy.switchText} <Link to={copy.switchHref}>{copy.switchLabel}</Link>
        </p>
      </div>
    </div>
  );
}
