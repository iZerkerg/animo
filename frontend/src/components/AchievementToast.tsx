import { Award, X } from "lucide-react";
import type { UnlockedAchievement } from "../services/api";

type Props = { achievements: UnlockedAchievement[]; onClose: () => void };

export function AchievementToast({ achievements, onClose }: Props) {
  if (!achievements.length) return null;
  return (
    <aside aria-live="polite" className="achievement-toast">
      <button aria-label="Cerrar notificación" className="achievement-toast-close" onClick={onClose} type="button"><X size={18} /></button>
      <div className="achievement-toast-title"><Award size={20} /> ¡Nuevo logro desbloqueado!</div>
      <div className="achievement-toast-list">
        {achievements.map((achievement) => (
          <div key={achievement.code}>
            <span>{achievement.icon}</span>
            <p><strong>{achievement.name}</strong><small>{achievement.description}</small></p>
          </div>
        ))}
      </div>
    </aside>
  );
}
