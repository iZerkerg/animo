import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { getAchievements, getAchievementDashboard, getAchievementSummary, recalculateAchievements } from "../services/achievement.service.js";
import { safeTimeZone } from "../utils/civil-date.js";
import { withDevTiming } from "../utils/dev-timing.js";

export const achievementRouter = Router();

achievementRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const achievements = await withDevTiming("GET /api/achievements", () => getAchievements(req.user!.id, getTimeZone(req)));
  return res.json({ achievements });
});

achievementRouter.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const summary = await withDevTiming("GET /api/achievements/summary", () => getAchievementSummary(req.user!.id, getTimeZone(req)));
  return res.json({ summary });
});

achievementRouter.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  const dashboard = await withDevTiming("GET /api/achievements/dashboard", () => getAchievementDashboard(req.user!.id, getTimeZone(req)));
  return res.json(dashboard);
});

achievementRouter.post("/recalculate", requireAuth, async (req: AuthRequest, res) => {
  const unlockedAchievements = await withDevTiming("POST /api/achievements/recalculate", () => recalculateAchievements(req.user!.id, getTimeZone(req)));
  return res.json({ message: "Logros recalculados", unlockedAchievements });
});

function getTimeZone(req: AuthRequest) {
  const value = typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;
  return safeTimeZone(value);
}
