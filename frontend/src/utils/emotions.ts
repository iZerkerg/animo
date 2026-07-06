import type { MoodEntry, MoodEntryEmotion } from "../services/api";

export type EmotionKind = "positive" | "negative" | "neutral";

export const emotionGroups: Record<EmotionKind, string[]> = {
  positive: [
    "feliz",
    "tranquilo",
    "tranquila",
    "motivado",
    "motivada",
    "agradecido",
    "agradecida",
    "esperanzado",
    "esperanzada"
  ],
  negative: [
    "triste",
    "ansioso",
    "ansiosa",
    "enojado",
    "enojada",
    "estresado",
    "estresada",
    "frustrado",
    "frustrada",
    "cansado",
    "cansada"
  ],
  neutral: ["neutral", "pensativo", "pensativa", "confundido", "confundida"]
};

export const emotionCalendarClass: Record<string, string> = {
  feliz: "happy",
  tranquilo: "calm",
  tranquila: "calm",
  motivado: "motivated",
  motivada: "motivated",
  agradecido: "grateful",
  agradecida: "grateful",
  esperanzado: "hopeful",
  esperanzada: "hopeful",
  ansioso: "anxious",
  ansiosa: "anxious",
  triste: "sad",
  enojado: "angry",
  enojada: "angry",
  cansado: "tired",
  cansada: "tired",
  estresado: "stressed",
  estresada: "stressed",
  frustrado: "frustrated",
  frustrada: "frustrated",
  neutral: "neutral",
  pensativo: "neutral",
  pensativa: "neutral",
  confundido: "neutral",
  confundida: "neutral"
};

export type EmotionEvent = {
  emotion: string;
  emoji: string;
  intensity: number;
  entry: MoodEntry;
  createdAt: string;
};

export type DominantEmotion = {
  emotion: string;
  emoji: string;
  className: string;
  count: number;
  averageIntensity: number;
};

export function normalizeEmotionName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getEmotionKind(emotion: string): EmotionKind {
  const normalized = normalizeEmotionName(emotion);
  if (emotionGroups.positive.includes(normalized)) return "positive";
  if (emotionGroups.negative.includes(normalized)) return "negative";
  return "neutral";
}

export function getEmotionWeight(emotion: string) {
  const kind = getEmotionKind(emotion);
  if (kind === "positive") return 1;
  if (kind === "negative") return -1;
  return 0;
}

export function getEntryEmotions(entry: MoodEntry): MoodEntryEmotion[] {
  return entry.emotions?.length ? entry.emotions : [{ emotion: entry.emotion, emoji: entry.emoji, intensity: null }];
}

export function getEmotionEvents(entries: MoodEntry[]) {
  return entries.flatMap((entry) =>
    getEntryEmotions(entry).map((emotion) => ({
      emotion: emotion.emotion,
      emoji: emotion.emoji,
      intensity: emotion.intensity ?? 3,
      entry,
      createdAt: emotion.createdAt ?? entry.createdAt
    }))
  );
}

export function getDominantEmotion(entries: MoodEntry[]): DominantEmotion | null {
  const events = getEmotionEvents(entries);
  if (!events.length) return null;

  const grouped = new Map<string, { emotion: string; emoji: string; count: number; intensitySum: number; latestAt: number }>();

  events.forEach((event) => {
    const key = normalizeEmotionName(event.emotion);
    const current = grouped.get(key);
    const latestAt = Math.max(current?.latestAt ?? 0, new Date(event.createdAt).getTime(), new Date(event.entry.createdAt).getTime());
    grouped.set(key, {
      emotion: event.emotion,
      emoji: event.emoji,
      count: (current?.count ?? 0) + 1,
      intensitySum: (current?.intensitySum ?? 0) + event.intensity,
      latestAt
    });
  });

  const winner = [...grouped.values()].sort((a, b) => {
    const countDiff = b.count - a.count;
    if (countDiff !== 0) return countDiff;

    const intensityDiff = b.intensitySum / b.count - a.intensitySum / a.count;
    if (intensityDiff !== 0) return intensityDiff;

    return b.latestAt - a.latestAt;
  })[0];

  return {
    emotion: winner.emotion,
    emoji: winner.emoji,
    className: emotionCalendarClass[normalizeEmotionName(winner.emotion)] ?? "neutral",
    count: winner.count,
    averageIntensity: winner.intensitySum / winner.count
  };
}
