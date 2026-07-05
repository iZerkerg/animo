import { Heart } from "lucide-react";
import { useState } from "react";
import { api, setToken, type User } from "../services/api";

type Props = {
  onAuthenticated: (user: User) => void;
};

export function AuthPage({ onAuthenticated }: Props) {
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
        <div className="brand-mark">
          <Heart size={24} /> Animo
        </div>
        <h1>Un diario emocional con mirada de dashboard.</h1>
        <p>Registra lo que sientes, descubre patrones y vuelve a ti con suavidad.</p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Entrar
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Registro
          </button>
        </div>

        {mode === "register" && (
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </label>
        )}
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Contrasena
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </label>

        {error && <p className="error-text">{error}</p>}
        <button className="primary-action">{mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</button>
      </form>
    </main>
  );
}
