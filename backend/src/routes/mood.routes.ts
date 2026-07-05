import { Router } from "express";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { buildSummary } from "../services/summary.service.js";

export const moodRouter = Router();

const entrySchema = z.object({
  emotion: z.string().min(2).optional(),
  emoji: z.string().min(1).optional(),
  emotions: z.array(z.object({
    emotion: z.string().min(2),
    emoji: z.string().min(1),
    intensity: z.number().int().min(1).max(5).optional()
  })).min(1).optional(),
  note: z.string().max(1000).optional().default(""),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]),
  date: z.coerce.date(),
  categoryIds: z.array(z.string()).default([])
}).superRefine((data, ctx) => {
  if (data.emotions?.length) return;
  if (data.emotion && data.emoji) return;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["emotions"],
    message: "Selecciona al menos una emoción"
  });
});

moodRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const entries = await prisma.moodEntry.findMany({
    where: { userId: req.user!.id },
    include: { categories: true, emotions: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  return res.json({ entries });
});

moodRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  const selectedEmotions = normalizeEmotions(parsed.data);
  if (!selectedEmotions.length) {
    return res.status(400).json({ message: "Selecciona al menos una emoción" });
  }
  const primaryEmotion = selectedEmotions[0];

  const entry = await prisma.moodEntry.create({
    data: {
      userId: req.user!.id,
      emotion: primaryEmotion.emotion,
      emoji: primaryEmotion.emoji,
      note: parsed.data.note,
      timeOfDay: parsed.data.timeOfDay,
      date: parsed.data.date,
      emotions: {
        create: selectedEmotions
      },
      categories: {
        connect: parsed.data.categoryIds.map((id) => ({ id }))
      }
    },
    include: { categories: true, emotions: true }
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
      include: { categories: true, emotions: true }
    }),
    prisma.moodEntry.findMany({
      where: { userId: req.user!.id, date: { gte: monthStart, lte: endOfMonth(now) } },
      include: { categories: true, emotions: true }
    }),
    prisma.moodEntry.findMany({
      where: { userId: req.user!.id },
      include: { categories: true, emotions: true },
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

function normalizeEmotions(data: z.infer<typeof entrySchema>) {
  const source = data.emotions?.length ? data.emotions : [{ emotion: data.emotion!, emoji: data.emoji! }];
  const seen = new Set<string>();

  return source.filter((item) => {
    const key = item.emotion.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((item) => ({
    emotion: item.emotion.trim(),
    emoji: item.emoji.trim(),
    intensity: item.intensity
  }));
}
