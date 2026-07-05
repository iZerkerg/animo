import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { isEmailConfigured, sendMoodReminderEmail } from "../services/email.service.js";

export const reminderRouter = Router();

const reminderSchema = z.object({
  settings: z.array(
    z.object({
      timeOfDay: z.enum(["morning", "afternoon", "evening"]),
      enabled: z.boolean(),
      time: z.string().regex(/^\d{2}:\d{2}$/)
    })
  )
});

reminderRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const settings = await prisma.reminderSetting.findMany({
    where: { userId: req.user!.id },
    orderBy: { timeOfDay: "asc" }
  });

  return res.json({ settings, emailConfigured: isEmailConfigured() });
});

reminderRouter.put("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos invalidos", issues: parsed.error.flatten() });

  const settings = await Promise.all(
    parsed.data.settings.map((setting) =>
      prisma.reminderSetting.upsert({
        where: { userId_timeOfDay: { userId: req.user!.id, timeOfDay: setting.timeOfDay } },
        update: { enabled: setting.enabled, time: setting.time },
        create: { userId: req.user!.id, ...setting }
      })
    )
  );

  return res.json({ settings, emailConfigured: isEmailConfigured() });
});

reminderRouter.post("/test", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  await sendMoodReminderEmail(user.email, user.name, "manana");
  return res.json({ message: isEmailConfigured() ? "Correo de prueba enviado" : "Modo dry-run: configura SMTP para enviar correos reales" });
});
