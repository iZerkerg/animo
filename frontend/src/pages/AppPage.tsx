import { CalendarDays, ChartNoAxesColumnIncreasing, PenLine, Plus, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CalendarView } from "../components/CalendarView";
import { DashboardCharts } from "../components/DashboardCharts";
import { ReminderSettings } from "../components/ReminderSettings";
import { uiText } from "../constants/text";
import type { ColorTheme, ThemeMode } from "../hooks/useTheme";
import { NewMoodPage } from "./NewMoodPage";
import { ProfilePage } from "./ProfilePage";
import { SettingsPage } from "./SettingsPage";
import { AchievementsPage } from "./AchievementsPage";
import { AchievementToast } from "../components/AchievementToast";
import { AppNavbar } from "../components/AppNavbar";
import { api, clearToken, type Category, type MoodEntry, type UnlockedAchievement, type User } from "../services/api";
import { isBirthdayToday, isSameCivilDay } from "../utils/date";

type AppView = "home" | "calendar" | "newMood" | "stats" | "achievements" | "profile" | "settings";

type Props = {
  colorTheme: ColorTheme;
  user: User;
  onLogout: () => void;
  onColorThemeChange: (theme: ColorTheme) => void;
  onUserUpdated: (user: User) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
};

export function AppPage({ colorTheme, user, onColorThemeChange, onLogout, onThemeChange, onUserUpdated, themeMode }: Props) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<AppView>(() => getViewFromPath());
  const [homeMessage, setHomeMessage] = useState("");
  const [achievementNotifications, setAchievementNotifications] = useState<UnlockedAchievement[]>([]);

  async function refresh() {
    const [categoriesData, statsData] = await Promise.all([api.categories(), api.stats()]);
    setEntries([...statsData.allEntries].reverse());
    setCategories(categoriesData.categories);
    setSummary(statsData.summary);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handlePopState = () => setActiveView(getViewFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const todayEntries = useMemo(() => {
    const today = new Date();
    return entries.filter((entry) => isSameCivilDay(entry.date, today));
  }, [entries]);

  function logout() {
    clearToken();
    onLogout();
  }

  function navigate(view: AppView) {
    if (view !== "home") setHomeMessage("");
    setActiveView(view);
    const nextPath = getPathForView(view);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }

  const title =
    activeView === "profile"
      ? uiText.profile.title
      : activeView === "settings"
        ? uiText.settings.title
        : activeView === "newMood"
          ? uiText.moodForm.title
          : activeView === "stats"
            ? uiText.dashboard.title
            : activeView === "achievements"
              ? uiText.achievements.title
              : uiText.home.title;

  async function handleMoodCreated(unlockedAchievements: UnlockedAchievement[]) {
    await refresh();
    setHomeMessage(uiText.moodForm.saved);
    setAchievementNotifications(unlockedAchievements);
    navigate("home");
  }

  return (
    <main className="app-shell">
      <aside aria-label="Navegación principal" className="sidebar">
        <div className="brand-mark compact-brand">{uiText.brand}</div>
        <button aria-current={activeView === "home" ? "page" : undefined} className={activeView === "home" ? "nav-item active" : "nav-item"} onClick={() => navigate("home")}>
          <PenLine size={18} /> {uiText.nav.diary}
        </button>
        <button aria-current={activeView === "calendar" ? "page" : undefined} className={activeView === "calendar" ? "nav-item active" : "nav-item"} onClick={() => navigate("calendar")}>
          <CalendarDays size={18} /> {uiText.nav.calendar}
        </button>
        <button
          aria-label="Registrar estado de ánimo"
          aria-current={activeView === "newMood" ? "page" : undefined}
          className={activeView === "newMood" ? "nav-item new-mood-nav active" : "nav-item new-mood-nav"}
          onClick={() => navigate("newMood")}
        >
          <Plus size={22} />
          <span>{uiText.nav.newMood}</span>
        </button>
        <button aria-current={activeView === "stats" ? "page" : undefined} className={activeView === "stats" ? "nav-item active" : "nav-item"} onClick={() => navigate("stats")}>
          <ChartNoAxesColumnIncreasing size={18} /> {uiText.nav.charts}
        </button>
        <button aria-current={activeView === "achievements" ? "page" : undefined} className={activeView === "achievements" ? "nav-item active" : "nav-item"} onClick={() => navigate("achievements")}>
          <Trophy size={18} /> {uiText.nav.achievements}
        </button>
      </aside>

      <div className="app-main">
        <AppNavbar
          isProfileActive={activeView === "profile" || activeView === "settings"}
          onOpenProfile={() => navigate("profile")}
          user={user}
        />
        <section className="content">
        {activeView !== "home" && (
          <header className="topbar">
            <div>
              <h1>{title}</h1>
            </div>
          </header>
        )}

        {activeView === "home" && (
          <div className="home-dashboard">
            <header className="home-header">
              <p className="home-greeting">{uiText.home.greeting}, {user.name}</p>
              <h1>{uiText.home.title}</h1>
            </header>
            <div className="stack">
              {homeMessage && <p className="success-text">{homeMessage}</p>}
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
        {activeView === "newMood" && <NewMoodPage categories={categories} onCreated={handleMoodCreated} />}
        {activeView === "stats" && <DashboardCharts entries={entries} />}
        {activeView === "achievements" && <AchievementsPage />}
        {activeView === "profile" && (
          <ProfilePage user={user} onLogout={logout} onOpenSettings={() => navigate("settings")} onUserUpdated={onUserUpdated} />
        )}
        {activeView === "settings" && (
          <SettingsPage
            colorTheme={colorTheme}
            themeMode={themeMode}
            onBackToProfile={() => navigate("profile")}
            onColorThemeChange={onColorThemeChange}
            onThemeChange={onThemeChange}
          />
        )}
        </section>
      </div>
      <AchievementToast achievements={achievementNotifications} onClose={() => setAchievementNotifications([])} />
    </main>
  );
}

function getViewFromPath(): AppView {
  if (window.location.pathname === "/calendar") return "calendar";
  if (window.location.pathname === "/stats") return "stats";
  if (window.location.pathname === "/achievements") return "achievements";
  if (window.location.pathname === "/profile") return "profile";
  if (window.location.pathname === "/settings") return "settings";
  if (window.location.pathname === "/mood/new") return "newMood";
  return "home";
}

function getPathForView(view: AppView) {
  if (view === "calendar") return "/calendar";
  if (view === "stats") return "/stats";
  if (view === "achievements") return "/achievements";
  if (view === "profile") return "/profile";
  if (view === "settings") return "/settings";
  if (view === "newMood") return "/mood/new";
  return "/";
}

function formatEntryEmotions(entry: MoodEntry) {
  const emotions = entry.emotions?.length ? entry.emotions : [{ emotion: entry.emotion, emoji: entry.emoji }];
  return emotions.map((item) => `${item.emoji} ${item.emotion}`).join(" · ");
}
