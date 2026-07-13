import { Prisma, type Achievement, type MoodEntry, type MoodEntryEmotion, type Category, type UserAchievement } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { achievementCatalog } from "../constants/achievements.js";
import { prisma } from "../config/prisma.js";
import { daysBetween, toCivilDateKey } from "../utils/civil-date.js";
import { calculateStreaks } from "./streak.service.js";
import { withDevTiming } from "../utils/dev-timing.js";

type EntryWithRelations = Pick<MoodEntry, "date" | "timeOfDay" | "emotion" | "note"> & {
  emotions: Pick<MoodEntryEmotion, "emotion" | "intensity">[];
  categories: Pick<Category, "id">[];
};
type CatalogAchievement = Pick<Achievement, "id" | "code" | "name" | "description" | "category" | "icon" | "target" | "sortOrder" | "isSecret">;
type UserUnlock = Pick<UserAchievement, "unlockedAt"> & { achievement: Pick<Achievement, "code"> };

export type AchievementView = {
  code: string;
  name: string;
  description: string;
  category: Achievement["category"];
  icon: string;
  target: number | null;
  sortOrder: number;
  isSecret: boolean;
  status: "locked" | "in_progress" | "unlocked";
  currentProgress: number;
  progressPercentage: number;
  unlockedAt: Date | null;
};

const emotionAliases: Record<string, string> = {
  tranquila: "tranquilo", ansiosa: "ansioso", enojada: "enojado", cansada: "cansado",
  motivada: "motivado", estresada: "estresado", agradecida: "agradecido",
  esperanzada: "esperanzado", frustrada: "frustrado", pensativa: "pensativo", confundida: "confundido"
};

const availableEmotions = new Set(["feliz", "tranquilo", "ansioso", "triste", "enojado", "cansado", "motivado", "estresado"]);
let catalogInitialization: Promise<unknown> | null = null;

export async function ensureAchievementCatalog() {
  catalogInitialization ??= withDevTiming("ensureAchievementCatalog", async () => {
    const rows = achievementCatalog.map((definition) => Prisma.sql`(
      ${randomUUID()}, ${definition.code}, ${definition.name}, ${definition.description},
      ${definition.category}::"AchievementCategory", ${definition.icon}, ${definition.target},
      ${definition.sortOrder}, ${definition.isSecret ?? false}, NOW()
    )`);

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Achievement"
        ("id", "code", "name", "description", "category", "icon", "target", "sortOrder", "isSecret", "createdAt")
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "category" = EXCLUDED."category",
        "icon" = EXCLUDED."icon",
        "target" = EXCLUDED."target",
        "sortOrder" = EXCLUDED."sortOrder",
        "isSecret" = EXCLUDED."isSecret"
    `);
  }).catch((error) => {
    catalogInitialization = null;
    throw error;
  });
  await catalogInitialization;
}

export async function recalculateAchievements(userId: string, timeZone = "UTC") {
  await ensureAchievementCatalog();
  const snapshot = await loadSnapshot(userId);
  if (!snapshot.user) throw new Error("Usuario no encontrado");
  const computed = computeAchievementViews(snapshot.achievements, snapshot.unlocks, snapshot.entries, snapshot.user.birthDate, snapshot.categoryCount, timeZone);
  const unlockedCodes = new Set(snapshot.unlocks.map((unlock) => unlock.achievement.code));
  const candidates = await persistNewUnlocks(userId, snapshot.achievements, computed, unlockedCodes);
  return candidates.map(({ code, name, description, icon }) => ({ code, name, description, icon }));
}

export async function getAchievements(userId: string, timeZone = "UTC") {
  return (await getAchievementDashboard(userId, timeZone)).achievements;
}

export async function getAchievementSummary(userId: string, timeZone = "UTC") {
  return (await getAchievementDashboard(userId, timeZone)).summary;
}

export async function getAchievementDashboard(userId: string, timeZone = "UTC") {
  await ensureAchievementCatalog();
  const snapshot = await loadSnapshot(userId);
  if (!snapshot.user) throw new Error("Usuario no encontrado");

  const achievements = computeAchievementViews(
    snapshot.achievements,
    snapshot.unlocks,
    snapshot.entries,
    snapshot.user.birthDate,
    snapshot.categoryCount,
    timeZone
  ).map(hideLockedSecret).sort((a, b) => a.sortOrder - b.sortOrder);

  // Existing users created before achievements were introduced have entries but no unlock rows.
  // Backfill them once; normal reads remain read-only after the first successful backfill.
  if (snapshot.entries.length > 0 && snapshot.unlocks.length === 0) {
    await persistNewUnlocks(userId, snapshot.achievements, achievements, new Set());
  }

  return { achievements, summary: buildAchievementSummary(achievements, snapshot.entries, timeZone) };
}

function buildAchievementSummary(achievements: AchievementView[], entries: EntryWithRelations[], timeZone: string) {
  const { currentStreak, bestStreak } = calculateStreaks(entries.map((entry) => entry.date), new Date(), timeZone);
  const streakAchievements = achievements.filter((item) => item.code.startsWith("STREAK_") && item.status !== "unlocked" && item.target);
  const next = streakAchievements.find((item) => item.target! > currentStreak) ?? null;
  const recentlyUnlocked = achievements
    .filter((item) => item.status === "unlocked")
    .sort((a, b) => (b.unlockedAt?.getTime() ?? 0) - (a.unlockedAt?.getTime() ?? 0))
    .slice(0, 3);
  return {
    currentStreak,
    bestStreak,
    totalUnlocked: achievements.filter((item) => item.status === "unlocked").length,
    totalAchievements: achievements.length,
    nextStreakAchievement: next ? { code: next.code, name: next.name, currentProgress: currentStreak, target: next.target } : null,
    recentlyUnlocked
  };
}

async function loadSnapshot(userId: string) {
  const [user, entries, achievements, unlocks, categoryCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true } }),
    prisma.moodEntry.findMany({
      where: { userId },
      select: {
        date: true, timeOfDay: true, emotion: true, note: true,
        emotions: { select: { emotion: true, intensity: true } },
        categories: { select: { id: true } }
      },
      orderBy: { date: "asc" }
    }),
    prisma.achievement.findMany({
      select: { id: true, code: true, name: true, description: true, category: true, icon: true, target: true, sortOrder: true, isSecret: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }]
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { unlockedAt: true, achievement: { select: { code: true } } }
    }),
    prisma.category.count()
  ]);
  return { user, entries, achievements, unlocks, categoryCount };
}

async function persistNewUnlocks(
  userId: string,
  achievements: CatalogAchievement[],
  computed: AchievementView[],
  unlockedCodes: Set<string>
) {
  const candidates = computed.filter((item) => item.status === "unlocked" && !unlockedCodes.has(item.code));
  if (!candidates.length) return candidates;

  const idsByCode = new Map(achievements.map((achievement) => [achievement.code, achievement.id]));
  await prisma.userAchievement.createMany({
    data: candidates.map((item) => ({ userId, achievementId: idsByCode.get(item.code)! })),
    skipDuplicates: true
  });
  return candidates;
}

export function computeAchievementViews(
  achievements: CatalogAchievement[], unlocks: UserUnlock[], entries: EntryWithRelations[], birthDate: Date | null,
  categoryCount: number, timeZone = "UTC", now = new Date()
): AchievementView[] {
  const unlockByCode = new Map(unlocks.map((unlock) => [unlock.achievement.code, unlock]));
  const streaks = calculateStreaks(entries.map((entry) => entry.date), now, timeZone);
  const momentsByDay = new Map<string, Set<string>>();
  const morningDays = new Set<string>();
  const eveningDays = new Set<string>();
  const usedEmotions = new Set<string>();
  const usedCategories = new Set<string>();
  let notes = 0;
  let longestNote = 0;
  let hasIntensityOne = false;
  let hasIntensityFive = false;

  for (const entry of entries) {
    const day = toCivilDateKey(entry.date, timeZone);
    const moments = momentsByDay.get(day) ?? new Set<string>();
    moments.add(entry.timeOfDay);
    momentsByDay.set(day, moments);
    if (entry.timeOfDay === "morning") morningDays.add(day);
    if (entry.timeOfDay === "evening") eveningDays.add(day);
    for (const emotion of entry.emotions.length ? entry.emotions : [{ emotion: entry.emotion, intensity: null }]) {
      usedEmotions.add(normalizeEmotion(emotion.emotion));
      if (emotion.intensity === 1) hasIntensityOne = true;
      if (emotion.intensity === 5) hasIntensityFive = true;
    }
    entry.categories.forEach((category) => usedCategories.add(category.id));
    const note = entry.note?.trim() ?? "";
    if (note) notes += 1;
    longestNote = Math.max(longestNote, note.length);
  }

  const completeDays = [...momentsByDay.values()].filter((moments) => ["morning", "afternoon", "evening"].every((moment) => moments.has(moment))).length;
  // birthDate is stored as a logical civil date at noon UTC; its ISO date is the source of truth.
  const birthdayKey = birthDate ? birthDate.toISOString().slice(5, 10) : null;
  const birthdayEntry = Boolean(birthdayKey && entries.some((entry) => toCivilDateKey(entry.date, timeZone).slice(5) === birthdayKey));
  const firstDay = entries[0] ? toCivilDateKey(entries[0].date, timeZone) : null;
  const todayKey = toCivilDateKey(now, timeZone);
  const anniversaryDays = firstDay ? Math.max(0, daysBetween(firstDay, todayKey)) : 0;
  const anniversaryReached = firstDay ? hasFirstCalendarAnniversary(firstDay, todayKey) : false;

  const progress: Record<string, number> = {
    FIRST_ENTRY: entries.length,
    COMPLETE_DAY: completeDays, COMPLETE_3_DAYS: completeDays, COMPLETE_7_DAYS: completeDays,
    ENTRIES_10: entries.length, ENTRIES_50: entries.length, ENTRIES_100: entries.length, ENTRIES_250: entries.length, ENTRIES_500: entries.length,
    UNIQUE_EMOTIONS_5: usedEmotions.size, UNIQUE_EMOTIONS_10: usedEmotions.size,
    ALL_EMOTIONS: [...availableEmotions].filter((emotion) => usedEmotions.has(emotion)).length,
    FIRST_CATEGORY: usedCategories.size, UNIQUE_CATEGORIES_5: usedCategories.size, ALL_CATEGORIES: usedCategories.size,
    FIRST_NOTE: notes, NOTES_10: notes, NOTES_50: notes, LONG_NOTE: longestNote,
    INTENSITY_1: hasIntensityOne ? 1 : 0, INTENSITY_5: hasIntensityFive ? 1 : 0,
    BIRTHDAY_ENTRY: birthdayEntry ? 1 : 0, FIRST_ANNIVERSARY: anniversaryDays,
    MORNING_7: morningDays.size, EVENING_7: eveningDays.size
  };
  for (const target of [3, 7, 14, 30, 90, 180, 365]) progress[`STREAK_${target}_DAYS`] = streaks.currentStreak;

  return achievements.map((achievement) => {
    const unlock = unlockByCode.get(achievement.code);
    const target = achievement.code === "ALL_CATEGORIES" ? (categoryCount > 0 ? categoryCount : null) : achievement.target;
    const current = progress[achievement.code] ?? 0;
    const eligible = achievement.code.startsWith("STREAK_")
      ? streaks.bestStreak >= (target ?? Infinity)
      : achievement.code === "FIRST_ANNIVERSARY"
        ? anniversaryReached
        : target !== null && current >= target;
    const isUnlocked = Boolean(unlock) || eligible;
    const percentage = isUnlocked ? 100 : target ? Math.min(100, Math.max(0, Math.round((current / target) * 100))) : 0;
    return {
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      target,
      sortOrder: achievement.sortOrder,
      isSecret: achievement.isSecret,
      status: isUnlocked ? "unlocked" : current > 0 ? "in_progress" : "locked",
      currentProgress: isUnlocked ? (target ?? current) : Math.min(current, target ?? current),
      progressPercentage: percentage,
      unlockedAt: unlock?.unlockedAt ?? null
    };
  });
}

function normalizeEmotion(value: string) {
  const normalized = value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return emotionAliases[normalized] ?? normalized;
}

function hasFirstCalendarAnniversary(firstDay: string, today: string) {
  const [year, month, day] = firstDay.split("-").map(Number);
  const anniversary = `${year + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return today >= anniversary;
}

function hideLockedSecret(item: AchievementView): AchievementView {
  if (!item.isSecret || item.status === "unlocked") return item;
  return { ...item, name: "Logro secreto", description: "Logro secreto todavía bloqueado.", icon: "🔒", currentProgress: 0, target: null, progressPercentage: 0 };
}
