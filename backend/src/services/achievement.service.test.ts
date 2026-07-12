import assert from "node:assert/strict";
import test from "node:test";
import { achievementCatalog } from "../constants/achievements.js";
import { computeAchievementViews } from "./achievement.service.js";

const achievements = achievementCatalog.map((item, index) => ({
  ...item, id: `a${index}`, isSecret: item.isSecret ?? false, createdAt: new Date()
})) as any;

function entry(date: string, overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(), userId: "u1", emotion: "Feliz", emoji: "😊", note: "", timeOfDay: "morning",
    date: new Date(`${date}T12:00:00Z`), createdAt: new Date(), categories: [],
    emotions: [{ id: crypto.randomUUID(), moodEntryId: "m", emotion: "Feliz", emoji: "😊", intensity: 3, createdAt: new Date() }],
    ...overrides
  } as any;
}

function byCode(entries: any[], birthDate: Date | null = null, categoryCount = 10, now = new Date("2026-07-12T12:00:00Z")) {
  return new Map(computeAchievementViews(achievements, [], entries, birthDate, categoryCount, "America/Santiago", now).map((item) => [item.code, item]));
}

test("primer registro, cantidades, emociones, notas e intensidades", () => {
  const entries = Array.from({ length: 10 }, (_, index) => entry(`2026-07-${String(index + 1).padStart(2, "0")}`, {
    note: index === 0 ? "x".repeat(300) : "nota",
    emotions: [{ emotion: ["Feliz", "Tranquila", "Ansiosa", "Triste", "Enojada"][index % 5], intensity: index === 0 ? 1 : index === 1 ? 5 : 3 }]
  }));
  const result = byCode(entries);
  for (const code of ["FIRST_ENTRY", "ENTRIES_10", "UNIQUE_EMOTIONS_5", "FIRST_NOTE", "NOTES_10", "LONG_NOTE", "INTENSITY_1", "INTENSITY_5"]) {
    assert.equal(result.get(code)?.status, "unlocked", code);
  }
});

test("desbloquea rachas de 3, 7, 14 y 30 días", () => {
  const entries = Array.from({ length: 30 }, (_, index) => entry(`2026-06-${String(index + 1).padStart(2, "0")}`));
  const result = byCode(entries, null, 10, new Date("2026-07-01T12:00:00Z"));
  for (const code of ["STREAK_3_DAYS", "STREAK_7_DAYS", "STREAK_14_DAYS", "STREAK_30_DAYS"]) assert.equal(result.get(code)?.status, "unlocked");
});

test("reconoce día completo, tres días completos y categorías distintas", () => {
  const entries = [1, 2, 3].flatMap((day) => ["morning", "afternoon", "evening"].map((timeOfDay, index) => entry(`2026-07-0${day}`, {
    timeOfDay, categories: [{ id: `c${day}-${index}`, name: "Contexto" }]
  })));
  const result = byCode(entries, null, 9);
  assert.equal(result.get("COMPLETE_DAY")?.status, "unlocked");
  assert.equal(result.get("COMPLETE_3_DAYS")?.status, "unlocked");
  assert.equal(result.get("UNIQUE_CATEGORIES_5")?.status, "unlocked");
  assert.equal(result.get("ALL_CATEGORIES")?.status, "unlocked");
});

test("cumpleaños, aniversario y logros secretos", () => {
  const entries = Array.from({ length: 7 }, (_, index) => entry(`2025-07-${String(index + 6).padStart(2, "0")}`, {
    timeOfDay: index % 2 ? "evening" : "morning"
  }));
  entries.push(entry("2025-07-12"));
  const result = byCode(entries, new Date("1990-07-12T12:00:00Z"), 10, new Date("2026-07-12T12:00:00Z"));
  assert.equal(result.get("BIRTHDAY_ENTRY")?.status, "unlocked");
  assert.equal(result.get("FIRST_ANNIVERSARY")?.status, "unlocked");

  const morning = byCode(Array.from({ length: 7 }, (_, index) => entry(`2026-07-0${index + 1}`, { timeOfDay: "morning" })));
  assert.equal(morning.get("MORNING_7")?.status, "unlocked");
  const evening = byCode(Array.from({ length: 7 }, (_, index) => entry(`2026-07-0${index + 1}`, { timeOfDay: "evening" })));
  assert.equal(evening.get("EVENING_7")?.status, "unlocked");
});

test("un desbloqueo persistido no se duplica en el estado calculado", () => {
  const achievement = achievements.find((item: any) => item.code === "FIRST_ENTRY");
  const unlocks = [{ id: "u", userId: "u1", achievementId: achievement.id, unlockedAt: new Date(), achievement }];
  const result = computeAchievementViews(achievements, unlocks as any, [entry("2026-07-12")], null, 10, "UTC");
  assert.equal(result.filter((item) => item.code === "FIRST_ENTRY").length, 1);
  assert.equal(result.find((item) => item.code === "FIRST_ENTRY")?.progressPercentage, 100);
});
