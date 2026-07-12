import { civilDayNumber, toCivilDateKey } from "../utils/civil-date.js";

export type StreakResult = { currentStreak: number; bestStreak: number; dateKeys: string[] };

export function calculateStreaks(dates: Array<Date | string>, now = new Date(), timeZone = "UTC"): StreakResult {
  const dateKeys = [...new Set(dates.map((date) => toCivilDateKey(date, timeZone)))].sort();
  if (!dateKeys.length) return { currentStreak: 0, bestStreak: 0, dateKeys };

  let bestStreak = 1;
  let run = 1;
  for (let index = 1; index < dateKeys.length; index += 1) {
    if (civilDayNumber(dateKeys[index]) - civilDayNumber(dateKeys[index - 1]) === 1) run += 1;
    else run = 1;
    bestStreak = Math.max(bestStreak, run);
  }

  const lastDay = civilDayNumber(dateKeys.at(-1)!);
  const today = civilDayNumber(toCivilDateKey(now, timeZone));
  if (today - lastDay > 1 || today - lastDay < 0) return { currentStreak: 0, bestStreak, dateKeys };

  let currentStreak = 1;
  for (let index = dateKeys.length - 1; index > 0; index -= 1) {
    if (civilDayNumber(dateKeys[index]) - civilDayNumber(dateKeys[index - 1]) !== 1) break;
    currentStreak += 1;
  }
  return { currentStreak, bestStreak, dateKeys };
}
