import { Heart } from "lucide-react";
import { useState } from "react";
import { LoadingButton } from "../components/LoadingButton";
import { PasswordInput } from "../components/PasswordInput";
import { ThemeToggle } from "../components/ThemeToggle";
import { uiText } from "../constants/text";
import type { ThemeMode } from "../hooks/useTheme";
import { api } from "../services/api";

type Props = {
  token: string | null;
  onBackToLogin: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
};

export function ResetPasswordPage({ onBackToLogin, onThemeChange, themeMode, token }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : uiText.auth.missingToken);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading || !token) return;

    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError(uiText.auth.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.resetPassword({ token, password, confirmPassword });
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
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
          <ThemeToggle compact mode={themeMode} onChange={onThemeChange} />
        </div>
        <h1>{uiText.auth.resetTitle}</h1>
        <p>{uiText.auth.resetSubtitle}</p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <PasswordInput
          autoComplete="new-password"
          label={uiText.auth.newPassword}
          minLength={8}
          required
          value={password}
          onChange={setPassword}
        />
        <PasswordInput
          autoComplete="new-password"
          label={uiText.auth.confirmPassword}
          minLength={8}
          required
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <LoadingButton
          className="primary-action"
          disabled={!token || Boolean(message)}
          loading={isLoading}
          loadingLabel={uiText.auth.resetLoading}
          type="submit"
        >
          {uiText.auth.resetAction}
        </LoadingButton>
        <button className="text-action centered" type="button" onClick={onBackToLogin}>
          {uiText.auth.backToLogin}
        </button>
      </form>
    </main>
  );
}
