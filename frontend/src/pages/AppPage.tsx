import { CalendarDays, ChartNoAxesColumnIncreasing, PenLine, UserCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CalendarView } from "../components/CalendarView";
import { DashboardCharts } from "../components/DashboardCharts";
import { MoodForm } from "../components/MoodForm";
import { ReminderSettings } from "../components/ReminderSettings";
import { ThemeToggle } from "../components/ThemeToggle";
import { uiText } from "../constants/text";
import type { ThemeMode } from "../hooks/useTheme";
import { ProfilePage } from "./ProfilePage";
import { api, clearToken, type Category, type MoodEntry, type User } from "../services/api";
import { isBirthdayToday, isSameCivilDay } from "../utils/date";

type Props = {
  user: User;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
};

export function AppPage({ user, onLogout, onThemeChange, onUserUpdated, themeMode }: Props) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<"home" | "calendar" | "stats" | "profile">("home");

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
    const today = new Date();
    return entries.filter((entry) => isSameCivilDay(entry.date, today));
  }, [entries]);

  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark compact-brand">{uiText.brand}</div>
        <button className={activeView === "home" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("home")}>
          <PenLine size={18} /> {uiText.nav.diary}
        </button>
        <button className={activeView === "calendar" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("calendar")}>
          <CalendarDays size={18} /> {uiText.nav.calendar}
        </button>
        <button className={activeView === "stats" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("stats")}>
          <ChartNoAxesColumnIncreasing size={18} /> {uiText.nav.charts}
        </button>
        <button className={activeView === "profile" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("profile")}>
          <UserCircle size={18} /> {uiText.nav.profile}
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p>{uiText.home.greeting}, {user.name}</p>
            <h1>{activeView === "profile" ? uiText.profile.title : uiText.home.title}</h1>
          </div>
          <div className="topbar-actions">
            <ThemeToggle compact mode={themeMode} onChange={onThemeChange} />
            <button className="primary-action compact" onClick={() => setActiveView("home")}>
              {uiText.home.quickMood}
            </button>
          </div>
        </header>

        {activeView === "home" && (
          <div className="home-grid">
            <MoodForm categories={categories} onCreated={refresh} />
            <div className="stack">
              {isBirthdayToday(user.birthDate) && (
                <div className="panel birthday-card">
                  <p>{uiText.home.birthday.replace("{name}", user.name)}</p>
                </div>
              )}
              <div className="panel today-card">
                <div className="section-title">
                  <span>{uiText.home.todaySummary}</span>
                  <strong>{todayEntries.length}</strong>
                </div>
                {todayEntries.length === 0 ? (
                  <p>{uiText.home.noEntriesToday}</p>
                ) : (
                  todayEntries.map((entry) => (
                    <article key={entry.id} className="mini-entry">
                      <strong>
                        {formatEntryEmotions(entry)}
                      </strong>
                      <span>{entry.note || uiText.home.noNote}</span>
                    </article>
                  ))
                )}
              </div>
              <div className="panel summary-card">
                <div className="section-title">
                  <span>{uiText.home.trends}</span>
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
        {activeView === "profile" && <ProfilePage user={user} onLogout={logout} onUserUpdated={onUserUpdated} />}
      </section>
    </main>
  );
}

function formatEntryEmotions(entry: MoodEntry) {
  const emotions = entry.emotions?.length ? entry.emotions : [{ emotion: entry.emotion, emoji: entry.emoji }];
  return emotions.map((item) => `${item.emoji} ${item.emotion}`).join(" · ");
}
