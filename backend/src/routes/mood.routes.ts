import { Router } from "express";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { buildSummary } from "../services/summary.service.js";

export const moodRouter = Router();

const entrySchema = z.object({
  emotion: z.string().min(2),
  emoji: z.string().min(1),
  note: z.string().max(1000).optional().default(""),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]),
  date: z.coerce.date(),
  categoryIds: z.array(z.string()).default([])
});

moodRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const entries = await prisma.moodEntry.findMany({
    where: { userId: req.user!.id },
    include: { categories: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  return res.json({ entries });
});

moodRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  const entry = await prisma.moodEntry.create({
    data: {
      userId: req.user!.id,
      emotion: parsed.data.emotion,
      emoji: parsed.data.emoji,
      note: parsed.data.note,
      timeOfDay: parsed.data.timeOfDay,
      date: parsed.data.date,
      categories: {
        connect: parsed.data.categoryIds.map((id) => ({ id }))
      }
    },
    include: { categories: true }
  });

  return res.status(201).json({ entry });
});

moodRouter.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [weekEntries, monthEntries, allEntries] = await Promise.all([
    prisma.moodEntry.findMany({
      where: { userId: req.user!.id, date: { gte: weekStart, lte: endOfWeek(now, { weekStartsOn: 1 }) } },
      include: { categories: true }
    }),
    prisma.moodEntry.findMany({
      where: { userId: req.user!.id, date: { gte: monthStart, lte: endOfMonth(now) } },
      include: { categories: true }
    }),
    prisma.moodEntry.findMany({
      where: { userId: req.user!.id },
      include: { categories: true },
      orderBy: { date: "asc" }
    })
  ]);

  return res.json({
    weekEntries,
    monthEntries,
    allEntries,
    summary: buildSummary(weekEntries)
  });
});
