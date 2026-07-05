import { useEffect, useState } from "react";
import { uiText } from "./constants/text";
import { useTheme } from "./hooks/useTheme";
import { AppPage } from "./pages/AppPage";
import { AuthPage } from "./pages/AuthPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { api, clearToken, getToken, type User } from "./services/api";

type AuthRoute = "auth" | "forgot-password" | "reset-password";

function getAuthRoute(): AuthRoute {
  if (window.location.pathname === "/forgot-password") return "forgot-password";
  if (window.location.pathname === "/reset-password") return "reset-password";
  return "auth";
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [authRoute, setAuthRoute] = useState<AuthRoute>(getAuthRoute);
  const theme = useTheme();

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handlePopState = () => setAuthRoute(getAuthRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateAuth(path: "/" | "/forgot-password") {
    window.history.pushState({}, "", path);
    setAuthRoute(getAuthRoute());
  }

  if (loading) return <div className="loading-screen">{uiText.loading}</div>;

  if (user) {
    return <AppPage themeMode={theme.mode} onThemeChange={theme.setMode} user={user} onLogout={() => setUser(null)} />;
  }

  if (authRoute === "forgot-password") {
    return (
      <ForgotPasswordPage
        themeMode={theme.mode}
        onBackToLogin={() => navigateAuth("/")}
        onThemeChange={theme.setMode}
      />
    );
  }

  if (authRoute === "reset-password") {
    const token = new URLSearchParams(window.location.search).get("token");
    return (
      <ResetPasswordPage
        themeMode={theme.mode}
        token={token}
        onBackToLogin={() => navigateAuth("/")}
        onThemeChange={theme.setMode}
      />
    );
  }

  return (
    <AuthPage
      themeMode={theme.mode}
      onAuthenticated={setUser}
      onForgotPassword={() => navigateAuth("/forgot-password")}
      onThemeChange={theme.setMode}
    />
  );
}
