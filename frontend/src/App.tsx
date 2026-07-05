import { useEffect, useState } from "react";
import { uiText } from "./constants/text";
import { AppPage } from "./pages/AppPage";
import { AuthPage } from "./pages/AuthPage";
import { api, clearToken, getToken, type User } from "./services/api";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">{uiText.loading}</div>;

  return user ? <AppPage user={user} onLogout={() => setUser(null)} /> : <AuthPage onAuthenticated={setUser} />;
}
