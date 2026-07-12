import { Award, CalendarCheck, Flame, LockKeyhole, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type Achievement, type AchievementCategory, type AchievementSummary } from "../services/api";

const categoryLabels: Record<AchievementCategory, string> = {
  consistency: "Constancia", dailyRhythm: "Ritmo diario", records: "Registros", emotions: "Emociones",
  categories: "Categorías", reflection: "Reflexión", intensity: "Intensidad", special: "Especiales", secret: "Secretos"
};
const categoryOrder = Object.keys(categoryLabels) as AchievementCategory[];

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setRecalculating(true);
    try {
      const [listResponse, summaryResponse] = await Promise.all([api.achievements(), api.achievementSummary()]);
      setAchievements(listResponse.achievements);
      setSummary(summaryResponse.summary);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => categoryOrder.map((category) => ({
    category,
    items: achievements.filter((item) => item.category === category).sort(compareAchievements)
  })).filter((group) => group.items.length), [achievements]);

  if (loading) return <div className="panel achievements-loading">Preparando tu progreso…</div>;

  return (
    <div className="achievements-page">
      <div className="achievements-intro">
        <div><p>Tu camino, a tu ritmo</p><h2>Pequeños hitos de autoconocimiento</h2></div>
        <button className="secondary-action compact" disabled={recalculating} onClick={() => void load()} type="button">
          <RotateCcw size={17} className={recalculating ? "spin-icon" : ""} /> {recalculating ? "Actualizando…" : "Actualizar progreso"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {summary && <Summary summary={summary} />}
      {summary?.currentStreak === 0 && <p className="streak-neutral">Puedes comenzar una nueva racha cuando quieras.</p>}
      <div className="achievement-groups">
        {grouped.map(({ category, items }) => (
          <section className="achievement-section" key={category}>
            <div className="achievement-section-title"><h3>{categoryLabels[category]}</h3><span>{items.filter((item) => item.status === "unlocked").length} de {items.length}</span></div>
            <div className="achievement-grid">{items.map((item) => <AchievementCard achievement={item} key={item.code} />)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Summary({ summary }: { summary: AchievementSummary }) {
  const next = summary.nextStreakAchievement;
  return <section className="achievement-summary">
    <SummaryCard icon={<Flame />} label="Racha actual" value={`${summary.currentStreak} ${summary.currentStreak === 1 ? "día" : "días"}`} />
    <SummaryCard icon={<Trophy />} label="Mejor racha" value={`${summary.bestStreak} ${summary.bestStreak === 1 ? "día" : "días"}`} />
    <SummaryCard icon={<Award />} label="Logros desbloqueados" value={`${summary.totalUnlocked} de ${summary.totalAchievements}`} />
    <SummaryCard icon={<Sparkles />} label="Próximo logro" value={next ? `${next.name}: ${next.currentProgress} de ${next.target}` : "Todos los hitos de racha alcanzados"} />
  </section>;
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="panel achievement-summary-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const unlocked = achievement.status === "unlocked";
  const statusLabel = unlocked ? "Desbloqueado" : achievement.status === "in_progress" ? "En progreso" : "Bloqueado";
  return <article className={`panel achievement-card ${achievement.status}`}>
    <div className="achievement-card-head">
      <span className="achievement-icon">{achievement.icon}</span>
      <span className={`achievement-badge ${achievement.status}`}>{unlocked ? <CalendarCheck size={14} /> : achievement.status === "locked" ? <LockKeyhole size={14} /> : null}{statusLabel}</span>
    </div>
    <h4>{achievement.name}</h4><p>{achievement.description}</p>
    {unlocked ? (
      <small className="achievement-date">{achievement.unlockedAt ? `Desbloqueado el ${formatUnlockedDate(achievement.unlockedAt)}` : "Desbloqueado"}</small>
    ) : achievement.target ? (
      <div className="achievement-progress"><div><span>{achievement.currentProgress} de {achievement.target}</span><strong>{achievement.progressPercentage}%</strong></div><progress max="100" value={achievement.progressPercentage} /></div>
    ) : null}
  </article>;
}

function compareAchievements(a: Achievement, b: Achievement) {
  const order = { unlocked: 0, in_progress: 1, locked: 2 };
  if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
  if (a.status === "unlocked" && a.unlockedAt && b.unlockedAt) return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
  return a.sortOrder - b.sortOrder;
}

function formatUnlockedDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)).replace(/\//g, "-");
}
