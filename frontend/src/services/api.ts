export type User = {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string | null;
  birthDate?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type TimeOfDay = "morning" | "afternoon" | "evening";

export type MoodEntryEmotion = {
  id?: string;
  moodEntryId?: string;
  emotion: string;
  emoji: string;
  intensity?: number | null;
  createdAt?: string;
};

export type MoodEntry = {
  id: string;
  emotion: string;
  emoji: string;
  emotions: MoodEntryEmotion[];
  note: string;
  timeOfDay: TimeOfDay;
  date: string;
  createdAt: string;
  categories: Category[];
};

export type ReminderSetting = {
  id?: string;
  timeOfDay: TimeOfDay;
  enabled: boolean;
  time: string;
};

export type AchievementStatus = "locked" | "in_progress" | "unlocked";
export type AchievementCategory = "consistency" | "dailyRhythm" | "records" | "emotions" | "categories" | "reflection" | "intensity" | "special" | "secret";

export type Achievement = {
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  target: number | null;
  sortOrder: number;
  isSecret: boolean;
  status: AchievementStatus;
  currentProgress: number;
  progressPercentage: number;
  unlockedAt: string | null;
};

export type UnlockedAchievement = Pick<Achievement, "code" | "name" | "description" | "icon">;

export type AchievementSummary = {
  currentStreak: number;
  bestStreak: number;
  totalUnlocked: number;
  totalAchievements: number;
  nextStreakAchievement: { code: string; name: string; currentProgress: number; target: number } | null;
  recentlyUnlocked: Achievement[];
};

export type AchievementDashboard = {
  achievements: Achievement[];
  summary: AchievementSummary;
};

const API_URL = getApiUrl();
const TOKEN_KEY = "animo_token";
let achievementDashboardCache: AchievementDashboard | null = null;
let achievementDashboardRequest: {
  controller: AbortController;
  promise: Promise<AchievementDashboard>;
  consumers: number;
  abortTimer?: number;
} | null = null;

function getApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000/api";
  }

  throw new Error("Falta configurar VITE_API_URL para el frontend de producción");
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  invalidateAchievementDashboard();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  invalidateAchievementDashboard();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Ocurrió un error inesperado");
  }

  return data as T;
}

export const api = {
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (payload: { email: string }) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) }),
  resetPassword: (payload: { token: string; password: string; confirmPassword: string }) =>
    request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<{ user: User }>("/auth/me"),
  userProfile: () => request<{ user: User }>("/users/me"),
  updateProfile: async (payload: { name?: string; birthDate?: string | null }) => {
    const response = await request<{ user: User }>("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
    invalidateAchievementDashboard();
    return response;
  },
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    return request<{ user: User; profileImageUrl: string }>("/users/me/profile-image", { method: "POST", body: formData });
  },
  categories: () => request<{ categories: Category[] }>("/categories"),
  moods: () => request<{ entries: MoodEntry[] }>("/moods"),
  createMood: async (payload: {
    emotions: Array<{ emotion: string; emoji: string; intensity?: number }>;
    note: string;
    timeOfDay: TimeOfDay;
    date: string;
    categoryIds: string[];
    timeZone: string;
  }) => {
    const response = await request<{ entry: MoodEntry; unlockedAchievements: UnlockedAchievement[] }>("/moods", { method: "POST", body: JSON.stringify(payload) });
    invalidateAchievementDashboard();
    return response;
  },
  stats: () =>
    request<{
      weekEntries: MoodEntry[];
      monthEntries: MoodEntry[];
      allEntries: MoodEntry[];
      summary: string[];
    }>("/moods/stats"),
  reminders: () => request<{ settings: ReminderSetting[]; emailConfigured: boolean }>("/reminders"),
  saveReminders: (settings: ReminderSetting[]) =>
    request<{ settings: ReminderSetting[]; emailConfigured: boolean }>("/reminders", {
      method: "PUT",
      body: JSON.stringify({ settings })
    }),
  testReminder: () => request<{ message: string }>("/reminders/test", { method: "POST" }),
  achievements: () => request<{ achievements: Achievement[] }>(`/achievements?timeZone=${encodeURIComponent(getTimeZone())}`),
  achievementSummary: () => request<{ summary: AchievementSummary }>(`/achievements/summary?timeZone=${encodeURIComponent(getTimeZone())}`),
  achievementDashboard: (options: { signal?: AbortSignal; force?: boolean } = {}) => getAchievementDashboard(options),
  recalculateAchievements: async () => {
    const response = await request<{ message: string; unlockedAchievements: UnlockedAchievement[] }>(`/achievements/recalculate?timeZone=${encodeURIComponent(getTimeZone())}`, { method: "POST" });
    invalidateAchievementDashboard();
    return response;
  }
};

export function invalidateAchievementDashboard() {
  achievementDashboardCache = null;
}

function getAchievementDashboard({ signal, force = false }: { signal?: AbortSignal; force?: boolean }) {
  if (force) {
    achievementDashboardCache = null;
    achievementDashboardRequest?.controller.abort();
    achievementDashboardRequest = null;
  }
  if (achievementDashboardCache) return Promise.resolve(achievementDashboardCache);

  if (!achievementDashboardRequest) {
    const controller = new AbortController();
    const flight = {
      controller,
      consumers: 0,
      promise: request<AchievementDashboard>(`/achievements/dashboard?timeZone=${encodeURIComponent(getTimeZone())}`, { signal: controller.signal })
    };
    flight.promise = flight.promise.then((dashboard) => {
      achievementDashboardCache = dashboard;
      return dashboard;
    }).finally(() => {
      if (achievementDashboardRequest === flight) achievementDashboardRequest = null;
    });
    achievementDashboardRequest = flight;
  }

  return subscribeToDashboardRequest(achievementDashboardRequest, signal);
}

function subscribeToDashboardRequest(
  flight: NonNullable<typeof achievementDashboardRequest>,
  signal?: AbortSignal
): Promise<AchievementDashboard> {
  flight.consumers += 1;
  if (flight.abortTimer) {
    window.clearTimeout(flight.abortTimer);
    flight.abortTimer = undefined;
  }

  return new Promise((resolve, reject) => {
    let finished = false;
    const release = () => {
      flight.consumers -= 1;
      if (flight.consumers === 0 && achievementDashboardRequest === flight) {
        flight.abortTimer = window.setTimeout(() => {
          if (flight.consumers === 0 && achievementDashboardRequest === flight) flight.controller.abort();
        }, 25);
      }
    };
    const finish = (callback: () => void) => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener("abort", onAbort);
      release();
      callback();
    };
    const onAbort = () => finish(() => reject(new DOMException("Petición cancelada", "AbortError")));

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    flight.promise.then(
      (dashboard) => finish(() => resolve(dashboard)),
      (error) => finish(() => reject(error))
    );
  });
}

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
