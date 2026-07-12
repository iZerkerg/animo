import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { getAchievements, getAchievementSummary, recalculateAchievements } from "../services/achievement.service.js";
import { safeTimeZone } from "../utils/civil-date.js";

export const achievementRouter = Router();

achievementRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const achievements = await getAchievements(req.user!.id, getTimeZone(req));
  return res.json({ achievements });
});

achievementRouter.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const summary = await getAchievementSummary(req.user!.id, getTimeZone(req));
  return res.json({ summary });
});

achievementRouter.post("/recalculate", requireAuth, async (req: AuthRequest, res) => {
  const unlockedAchievements = await recalculateAchievements(req.user!.id, getTimeZone(req));
  return res.json({ message: "Logros recalculados", unlockedAchievements });
});

function getTimeZone(req: AuthRequest) {
  const value = typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;
  return safeTimeZone(value);
}
