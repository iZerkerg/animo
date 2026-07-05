import { Router } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/auth.service.js";
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

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos invalidos", issues: parsed.error.flatten() });

  try {
    const result = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    return res.status(201).json(result);
  } catch (error) {
    if ((error as Error).message === "EMAIL_IN_USE") {
      return res.status(409).json({ message: "El correo ya esta registrado" });
    }
    return res.status(500).json({ message: "No se pudo registrar el usuario" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos invalidos", issues: parsed.error.flatten() });

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    return res.json(result);
  } catch {
    return res.status(401).json({ message: "Correo o contrasena incorrectos" });
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
