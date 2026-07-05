import { CalendarDays, ChartNoAxesColumnIncreasing, LogOut, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CalendarView } from "../components/CalendarView";
import { DashboardCharts } from "../components/DashboardCharts";
import { MoodForm } from "../components/MoodForm";
import { ReminderSettings } from "../components/ReminderSettings";
import { api, clearToken, type Category, type MoodEntry, type User } from "../services/api";

type Props = {
  user: User;
  onLogout: () => void;
};

export function AppPage({ user, onLogout }: Props) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<"home" | "calendar" | "stats">("home");

  async function refresh() {
    const [moodsData, categoriesData, statsData] = await Promise.all([api.moods(), api.categories(), api.stats()]);
    setEntries(moodsData.entries);
    setCategories(categoriesData.categories);
    setSummary(statsData.summary);
  }

  useEffect(() => {
    refresh();
  }, []);

  const todayEntries = useMemo(() => {
    const today = new Date().toDateString();
    return entries.filter((entry) => new Date(entry.date).toDateString() === today);
  }, [entries]);

  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark compact-brand">Animo</div>
        <button className={activeView === "home" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("home")}>
          <PenLine size={18} /> Diario
        </button>
        <button className={activeView === "calendar" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("calendar")}>
          <CalendarDays size={18} /> Calendario
        </button>
        <button className={activeView === "stats" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("stats")}>
          <ChartNoAxesColumnIncreasing size={18} /> Graficos
        </button>
        <button className="nav-item logout" onClick={logout}>
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p>Hola, {user.name}</p>
            <h1>Como se siente tu dia?</h1>
          </div>
          <button className="primary-action compact" onClick={() => setActiveView("home")}>
            Registrar animo
          </button>
        </header>

        {activeView === "home" && (
          <div className="home-grid">
            <MoodForm categories={categories} onCreated={refresh} />
            <div className="stack">
              <div className="panel today-card">
                <div className="section-title">
                  <span>Resumen de hoy</span>
                  <strong>{todayEntries.length}</strong>
                </div>
                {todayEntries.length === 0 ? (
                  <p>Hoy todavia no registras tu animo.</p>
                ) : (
                  todayEntries.map((entry) => (
                    <article key={entry.id} className="mini-entry">
                      <strong>
                        {entry.emoji} {entry.emotion}
                      </strong>
                      <span>{entry.note || "Sin nota"}</span>
                    </article>
                  ))
                )}
              </div>
              <div className="panel summary-card">
                <div className="section-title">
                  <span>Tendencias</span>
                </div>
                {summary.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <ReminderSettings />
            </div>
          </div>
        )}

        {activeView === "calendar" && <CalendarView entries={entries} />}
        {activeView === "stats" && <DashboardCharts entries={entries} />}
      </section>
    </main>
  );
}
