import { Heart } from "lucide-react";
import { useState } from "react";
import { LoadingButton } from "../components/LoadingButton";
import { PasswordInput } from "../components/PasswordInput";
import { uiText } from "../constants/text";
import { api, setToken, type User } from "../services/api";

type Props = {
  onAuthenticated: (user: User) => void;
  onForgotPassword: () => void;
};

export function AuthPage({ onAuthenticated, onForgotPassword }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);
    try {
      const response =
        mode === "register" ? await api.register({ name, email, password }) : await api.login({ email, password });
      setToken(response.token);
      onAuthenticated(response.user);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-top">
          <div className="brand-mark">
            <Heart size={24} /> {uiText.brand}
          </div>
        </div>
        <h1>{uiText.auth.headline}</h1>
        <p>{uiText.auth.subtitle}</p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div className="auth-tabs">
          <button disabled={isLoading} type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            {uiText.auth.loginTab}
          </button>
          <button disabled={isLoading} type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
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
        <PasswordInput
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          label={uiText.auth.password}
          minLength={8}
          required
          value={password}
          onChange={setPassword}
        />
        {mode === "login" && (
          <button className="text-action" type="button" onClick={onForgotPassword}>
            {uiText.auth.forgotPassword}
          </button>
        )}

        {error && <p className="error-text">{error}</p>}
        <LoadingButton
          className="primary-action"
          loading={isLoading}
          loadingLabel={mode === "login" ? uiText.auth.loginLoading : uiText.auth.registerLoading}
          type="submit"
        >
          {mode === "login" ? uiText.auth.loginAction : uiText.auth.registerAction}
        </LoadingButton>
      </form>
    </main>
  );
}
