import assert from "node:assert/strict";
import test from "node:test";
import { calculateStreaks } from "./streak.service.js";

test("calcula racha actual y mejor racha con días consecutivos", () => {
  const result = calculateStreaks([
    "2026-07-01T12:00:00Z", "2026-07-02T12:00:00Z", "2026-07-03T12:00:00Z",
    "2026-07-10T12:00:00Z", "2026-07-11T12:00:00Z"
  ], new Date("2026-07-12T12:00:00Z"));
  assert.equal(result.currentStreak, 2);
  assert.equal(result.bestStreak, 3);
});

test("varios registros del mismo día cuentan una vez", () => {
  const result = calculateStreaks([
    "2026-07-10T10:00:00Z", "2026-07-10T20:00:00Z", "2026-07-11T12:00:00Z"
  ], new Date("2026-07-11T20:00:00Z"));
  assert.equal(result.currentStreak, 2);
  assert.equal(result.bestStreak, 2);
  assert.equal(result.dateKeys.length, 2);
});

test("un salto de un día corta la racha actual", () => {
  const result = calculateStreaks(["2026-07-08T12:00:00Z", "2026-07-10T12:00:00Z"], new Date("2026-07-12T12:00:00Z"));
  assert.equal(result.currentStreak, 0);
  assert.equal(result.bestStreak, 1);
});

test("mantiene continuidad al cambiar de mes y de año", () => {
  assert.equal(calculateStreaks(["2026-01-31T12:00:00Z", "2026-02-01T12:00:00Z"], new Date("2026-02-01T18:00:00Z")).bestStreak, 2);
  assert.equal(calculateStreaks(["2025-12-31T12:00:00Z", "2026-01-01T12:00:00Z"], new Date("2026-01-01T18:00:00Z")).bestStreak, 2);
});

test("usa la fecha civil de la zona horaria indicada", () => {
  const timestamps = ["2026-07-10T02:30:00Z", "2026-07-11T02:30:00Z"];
  const result = calculateStreaks(timestamps, new Date("2026-07-11T03:00:00Z"), "America/Santiago");
  assert.deepEqual(result.dateKeys, ["2026-07-09", "2026-07-10"]);
  assert.equal(result.currentStreak, 2);
});
