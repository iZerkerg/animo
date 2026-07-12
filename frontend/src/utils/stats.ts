import { differenceInCalendarDays, eachDayOfInterval, endOfDay, format, isWithinInterval, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import type { MoodEntry, TimeOfDay } from "../services/api";
import { getEmotionEvents, getEmotionWeight, normalizeEmotionName } from "./emotions";

export type TimeRangePreset = "1d" | "3d" | "5d" | "1w" | "2w" | "1m" | "custom";

export type DateRange = {
  start: Date;
  end: Date;
};

export type FrequencyDatum = {
  name: string;
  emoji: string;
  total: number;
  percentage: number;
  label: string;
};

export type EvolutionDatum = {
  date: string;
  label: string;
  index: number | null;
  emotions: number;
};

export type MoodTrendDatum = {
  key: string;
  label: string;
  score: number | null;
  emotions: number;
};

export type EmotionalBalanceCategory = {
  key: "negative-high" | "negative-moderate" | "balanced" | "positive-moderate" | "positive-high";
  min: number;
  max: number;
  includeMin: boolean;
  includeMax: boolean;
  label: string;
  explanation: string;
};

export const emotionalBalanceCategories: EmotionalBalanceCategory[] = [
  {
    key: "negative-high",
    min: -5,
    max: -3,
    includeMin: true,
    includeMax: true,
    label: "Predominio negativo alto",
    explanation: "Durante este período predominaron claramente las emociones negativas, con intensidades altas."
  },
  {
    key: "negative-moderate",
    min: -3,
    max: -1,
    includeMin: false,
    includeMax: false,
    label: "Predominio negativo moderado",
    explanation: "Durante este período predominaron emociones negativas de intensidad moderada."
  },
  {
    key: "balanced",
    min: -1,
    max: 1,
    includeMin: true,
    includeMax: true,
    label: "Balance equilibrado",
    explanation: "Las emociones registradas muestran un equilibrio entre experiencias positivas y negativas."
  },
  {
    key: "positive-moderate",
    min: 1,
    max: 3,
    includeMin: false,
    includeMax: false,
    label: "Predominio positivo moderado",
    explanation: "Durante este período predominaron ligeramente las emociones positivas."
  },
  {
    key: "positive-high",
    min: 3,
    max: 5,
    includeMin: true,
    includeMax: true,
    label: "Predominio positivo alto",
    explanation: "Durante este período predominaron claramente las emociones positivas, con intensidades altas."
  }
];

const presetDays: Record<Exclude<TimeRangePreset, "custom">, number> = {
  "1d": 1,
  "3d": 3,
  "5d": 5,
  "1w": 7,
  "2w": 14,
  "1m": 30
};

export const timeRangeOptions: Array<{ value: TimeRangePreset; label: string }> = [
  { value: "1d", label: "Último día" },
  { value: "3d", label: "Últimos 3 días" },
  { value: "5d", label: "Últimos 5 días" },
  { value: "1w", label: "Última semana" },
  { value: "2w", label: "Últimas 2 semanas" },
  { value: "1m", label: "Último mes" },
  { value: "custom", label: "Rango personalizado" }
];

export function resolveDateRange(preset: TimeRangePreset, customStart: string, customEnd: string): DateRange | null {
  if (preset === "custom") {
    const start = parseDateInput(customStart);
    const end = parseDateInput(customEnd);
    if (!start || !end || start > end) return null;
    return { start: startOfDay(start), end: endOfDay(end) };
  }

  const today = startOfDay(new Date());
  return {
    start: startOfDay(subDays(today, presetDays[preset] - 1)),
    end: endOfDay(today)
  };
}

export function filterEntriesByRange(entries: MoodEntry[], range: DateRange | null) {
  if (!range) return [];
  return entries.filter((entry) => isWithinInterval(new Date(entry.date), range));
}

export function buildEmotionFrequency(entries: MoodEntry[]): FrequencyDatum[] {
  const events = getEmotionEvents(entries);
  const totalEvents = events.length;
  if (!totalEvents) return [];

  const grouped = new Map<string, { name: string; emoji: string; total: number }>();
  events.forEach((event) => {
    const key = normalizeEmotionName(event.emotion);
    const current = grouped.get(key);
    grouped.set(key, {
      name: current?.name ?? event.emotion,
      emoji: current?.emoji ?? event.emoji,
      total: (current?.total ?? 0) + 1
    });
  });

  return [...grouped.values()]
    .map((item) => {
      const percentage = Math.round((item.total / totalEvents) * 100);
      return {
        ...item,
        percentage,
        label: `${percentage}% · ${item.total} ${item.total === 1 ? "vez" : "veces"}`
      };
    })
    .sort((a, b) => b.percentage - a.percentage || b.total - a.total || a.name.localeCompare(b.name, "es"));
}

export function buildDailyWellbeing(entries: MoodEntry[], range: DateRange | null): EvolutionDatum[] {
  if (!range || differenceInCalendarDays(range.end, range.start) < 0) return [];

  const entriesByDate = new Map<string, MoodEntry[]>();
  entries.forEach((entry) => {
    const key = formatDateKey(new Date(entry.date));
    entriesByDate.set(key, [...(entriesByDate.get(key) ?? []), entry]);
  });

  return eachDayOfInterval({ start: range.start, end: range.end }).map((day) => {
    const key = formatDateKey(day);
    const dayEntries = entriesByDate.get(key) ?? [];
    const events = getEmotionEvents(dayEntries);

    if (!events.length) {
      return {
        date: key,
        label: format(day, "d MMM", { locale: es }),
        index: null,
        emotions: 0
      };
    }

    // Wellbeing index: each emotion contributes its intensity multiplied by
    // emotional valence (+1 positive, -1 negative, 0 neutral). The daily
    // average is then scaled from [-5, +5] to [0, 100] for a readable chart.
    const weightedAverage = events.reduce((sum, event) => sum + event.intensity * getEmotionWeight(event.emotion), 0) / events.length;
    const index = Math.round(((weightedAverage + 5) / 10) * 100);

    return {
      date: key,
      label: format(day, "d MMM", { locale: es }),
      index: Math.max(0, Math.min(100, index)),
      emotions: events.length
    };
  });
}

export function buildMoodTrend(entries: MoodEntry[], range: DateRange | null, groupByTimeOfDay: boolean): MoodTrendDatum[] {
  if (!range || differenceInCalendarDays(range.end, range.start) < 0) return [];

  if (groupByTimeOfDay) {
    const timeOrder: TimeOfDay[] = ["morning", "afternoon", "evening"];
    const timeLabels: Record<TimeOfDay, string> = {
      morning: "Mañana",
      afternoon: "Tarde",
      evening: "Noche"
    };

    return timeOrder.map((timeOfDay) => {
      const momentEntries = entries.filter((entry) => entry.timeOfDay === timeOfDay);
      return {
        key: timeOfDay,
        label: timeLabels[timeOfDay],
        score: calculateWeightedMoodScore(momentEntries),
        emotions: getEmotionEvents(momentEntries).length
      };
    });
  }

  const entriesByDate = new Map<string, MoodEntry[]>();
  entries.forEach((entry) => {
    const key = formatDateKey(new Date(entry.date));
    entriesByDate.set(key, [...(entriesByDate.get(key) ?? []), entry]);
  });

  return eachDayOfInterval({ start: range.start, end: range.end }).map((day) => {
    const key = formatDateKey(day);
    const dayEntries = entriesByDate.get(key) ?? [];
    return {
      key,
      label: format(day, "d MMM", { locale: es }),
      score: calculateWeightedMoodScore(dayEntries),
      emotions: getEmotionEvents(dayEntries).length
    };
  });
}

export function calculateWeightedMoodScore(entries: MoodEntry[]) {
  const events = getEmotionEvents(entries);
  if (!events.length) return null;

  const score = events.reduce((sum, event) => sum + event.intensity * getEmotionWeight(event.emotion), 0) / events.length;
  return Math.round(score * 10) / 10;
}

export function getEmotionalBalanceCategory(score: number | null) {
  if (score === null) return null;
  const normalizedScore = Math.max(-5, Math.min(5, score));
  return emotionalBalanceCategories.find((category) => {
    const aboveMin = category.includeMin ? normalizedScore >= category.min : normalizedScore > category.min;
    const belowMax = category.includeMax ? normalizedScore <= category.max : normalizedScore < category.max;
    return aboveMin && belowMax;
  }) ?? null;
}

export function formatRangeLabel(range: DateRange | null) {
  if (!range) return "";
  return `${formatDateForUi(range.start)} - ${formatDateForUi(range.end)}`;
}

export function formatAnalysisRangeLabel(range: DateRange | null) {
  if (!range) return "";
  const sameDay = formatDateInput(range.start) === formatDateInput(range.end);
  if (sameDay) return format(range.start, "dd 'de' MMMM 'de' yyyy", { locale: es });

  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  const startFormat = sameYear ? "dd 'de' MMMM" : "dd 'de' MMMM 'de' yyyy";
  return `${format(range.start, startFormat, { locale: es })} - ${format(range.end, "dd 'de' MMMM 'de' yyyy", { locale: es })}`;
}

export function getTimeRangeLabel(preset: TimeRangePreset) {
  return timeRangeOptions.find((option) => option.value === preset)?.label ?? "";
}

export function formatDateForUi(date: Date) {
  return format(date, "dd-MM-yyyy");
}

export function getDefaultCustomRange() {
  const end = startOfDay(new Date());
  const start = subDays(end, 6);
  return {
    start: formatDateInput(start),
    end: formatDateInput(end)
  };
}

function parseDateInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function formatDateKey(date: Date) {
  return format(startOfDay(date), "yyyy-MM-dd");
}
