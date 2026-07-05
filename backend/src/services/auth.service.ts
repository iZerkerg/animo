import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendPasswordResetEmail } from "./email.service.js";

const RESET_TOKEN_MINUTES = 30;

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
    select: { id: true, name: true, email: true, profileImageUrl: true, birthDate: true, createdAt: true, updatedAt: true }
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
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      birthDate: user.birthDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    token: createToken(user)
  };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt }
    })
  ]);

  const resetUrl = new URL("/reset-password", env.FRONTEND_URL);
  resetUrl.searchParams.set("token", token);
  await sendPasswordResetEmail(user.email, user.name, resetUrl.toString());
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    throw new Error("INVALID_RESET_TOKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    })
  ]);
}

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
