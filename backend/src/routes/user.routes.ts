import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const userRouter = Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  profileImageUrl: true,
  birthDate: true,
  createdAt: true,
  updatedAt: true
};

const civilDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidCivilDate);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  birthDate: z.union([civilDateSchema, z.literal(""), z.null()]).optional(),
  profileImageUrl: z.union([z.string().trim().url(), z.literal(""), z.null()]).optional()
});

userRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: userSelect
  });

  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  return res.json({ user });
});

userRouter.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.birthDate !== undefined
        ? { birthDate: parsed.data.birthDate ? civilDateToNoonUtc(parsed.data.birthDate) : null }
        : {}),
      ...(parsed.data.profileImageUrl !== undefined
        ? { profileImageUrl: parsed.data.profileImageUrl || null }
        : {})
    },
    select: userSelect
  });

  return res.json({ user });
});

function civilDateToNoonUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function isValidCivilDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
