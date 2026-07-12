import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "../services/api";
import { UserAvatar } from "./UserAvatar";

type Props = {
  isProfileActive: boolean;
  onOpenProfile: () => void;
  user: User;
};

export function AppNavbar({ isProfileActive, onOpenProfile, user }: Props) {
  const [showFutureNotice, setShowFutureNotice] = useState(false);

  useEffect(() => {
    if (!showFutureNotice) return;
    const timeout = window.setTimeout(() => setShowFutureNotice(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [showFutureNotice]);

  return (
    <header className="app-navbar">
      <nav aria-label="Acciones personales" className="app-navbar-actions">
        <div className="notification-action">
          <button
            aria-label="Notificaciones"
            className="app-navbar-button"
            title="Próximamente"
            type="button"
            onClick={() => setShowFutureNotice(true)}
          >
            <Bell aria-hidden="true" size={20} />
            <span>Notificaciones</span>
          </button>
          {showFutureNotice && <span className="notification-future" role="status">Notificaciones: próximamente</span>}
        </div>
        <button
          aria-current={isProfileActive ? "page" : undefined}
          aria-label="Ir al perfil"
          className={isProfileActive ? "app-navbar-button profile-navbar-button active" : "app-navbar-button profile-navbar-button"}
          type="button"
          onClick={onOpenProfile}
        >
          <UserAvatar user={user} />
          <span>Perfil</span>
        </button>
      </nav>
    </header>
  );
}
