import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../.env");

dotenv.config({ path: envPath });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24, "JWT_SECRET debe tener al menos 24 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("profile-images"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("Ánimo <no-reply@example.com>")
});

export const env = envSchema.parse(process.env);
