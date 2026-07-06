import { Heart } from "lucide-react";
import { useState } from "react";
import { LoadingButton } from "../components/LoadingButton";
import { uiText } from "../constants/text";
import { api } from "../services/api";

type Props = {
  onBackToLogin: () => void;
};

export function ForgotPasswordPage({ onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const response = await api.forgotPassword({ email });
      setMessage(response.message);
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
        </div>
        <h1>{uiText.auth.forgotTitle}</h1>
        <p>{uiText.auth.forgotSubtitle}</p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <label>
          {uiText.auth.email}
          <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <LoadingButton className="primary-action" loading={isLoading} loadingLabel={uiText.auth.forgotLoading} type="submit">
          {uiText.auth.forgotAction}
        </LoadingButton>
        <button className="text-action centered" type="button" onClick={onBackToLogin}>
          {uiText.auth.backToLogin}
        </button>
      </form>
    </main>
  );
}
