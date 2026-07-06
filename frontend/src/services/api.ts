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

const API_URL = getApiUrl();
const TOKEN_KEY = "animo_token";

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
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
  updateProfile: (payload: { name?: string; birthDate?: string | null }) =>
    request<{ user: User }>("/users/me", { method: "PATCH", body: JSON.stringify(payload) }),
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    return request<{ user: User; profileImageUrl: string }>("/users/me/profile-image", { method: "POST", body: formData });
  },
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
