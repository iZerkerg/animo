export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "animo_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

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
  me: () => request<{ user: User }>("/auth/me"),
  categories: () => request<{ categories: Category[] }>("/categories"),
  moods: () => request<{ entries: MoodEntry[] }>("/moods"),
  createMood: (payload: {
    emotions: Array<{ emotion: string; emoji: string; intensity?: number }>;
    note: string;
    timeOfDay: TimeOfDay;
    date: string;
    categoryIds: string[];
  }) => request<{ entry: MoodEntry }>("/moods", { method: "POST", body: JSON.stringify(payload) }),
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
  testReminder: () => request<{ message: string }>("/reminders/test", { method: "POST" })
};
