import { Router } from "express";
import { z } from "zod";
import { loginUser, registerUser, requestPasswordReset, resetPassword } from "../services/auth.service.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../config/prisma.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden"
});

const forgotPasswordMessage = "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.";
const resetAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string) {
  const now = Date.now();
  const current = resetAttempts.get(key);
  if (!current || current.resetAt <= now) {
    resetAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  current.count += 1;
  return current.count > 5;
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  try {
    const result = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    return res.status(201).json(result);
  } catch (error) {
    if ((error as Error).message === "EMAIL_IN_USE") {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }
    return res.status(500).json({ message: "No se pudo registrar el usuario" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    return res.json(result);
  } catch {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  const email = parsed.data.email.toLowerCase();
  const key = `${req.ip}:${email}`;
  if (isRateLimited(key)) {
    return res.status(429).json({ message: "Demasiadas solicitudes. Intenta nuevamente más tarde." });
  }

  try {
    await requestPasswordReset(email);
  } catch {
    return res.json({ message: forgotPasswordMessage });
  }

  return res.json({ message: forgotPasswordMessage });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return res.json({ message: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." });
  } catch {
    return res.status(400).json({ message: "El enlace no es válido o ya expiró. Solicita uno nuevo." });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, createdAt: true }
  });

  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  return res.json({ user });
});
