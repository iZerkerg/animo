import type { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    req.user = { id: payload.userId, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
