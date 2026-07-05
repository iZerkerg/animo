import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

function createToken(user: { id: string; email: string }) {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
  return jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn
  });
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true }
  });

  return { user, token: createToken(user) };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token: createToken(user)
  };
}
