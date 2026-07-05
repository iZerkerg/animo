import { Heart } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { uiText } from "../constants/text";
import type { ThemeMode } from "../hooks/useTheme";
import { api, setToken, type User } from "../services/api";

type Props = {
  onAuthenticated: (user: User) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
};

export function AuthPage({ onAuthenticated, onThemeChange, themeMode }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response =
        mode === "register" ? await api.register({ name, email, password }) : await api.login({ email, password });
      setToken(response.token);
      onAuthenticated(response.user);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-top">
          <div className="brand-mark">
            <Heart size={24} /> {uiText.brand}
          </div>
          <ThemeToggle compact mode={themeMode} onChange={onThemeChange} />
        </div>
        <h1>{uiText.auth.headline}</h1>
        <p>{uiText.auth.subtitle}</p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            {uiText.auth.loginTab}
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            {uiText.auth.registerTab}
          </button>
        </div>

        {mode === "register" && (
          <label>
            {uiText.auth.name}
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </label>
        )}
        <label>
          {uiText.auth.email}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          {uiText.auth.password}
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </label>

        {error && <p className="error-text">{error}</p>}
        <button className="primary-action">{mode === "login" ? uiText.auth.loginAction : uiText.auth.registerAction}</button>
      </form>
    </main>
  );
}
