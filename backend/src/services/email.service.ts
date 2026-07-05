import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
}

export async function sendMoodReminderEmail(to: string, name: string, timeOfDay: string) {
  if (!isEmailConfigured()) {
    console.info(`[email:dry-run] Recordatorio ${timeOfDay} para ${to}`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Un minuto para registrar como te sientes",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#fff7fb;padding:24px;color:#334155">
        <h2>Hola ${name}</h2>
        <p>Este es tu recordatorio de la ${timeOfDay}. Respira un momento y registra tu estado de animo.</p>
        <p style="margin-top:18px"><a href="${env.FRONTEND_URL}" style="background:#f6a6c9;color:#fff;padding:10px 16px;border-radius:12px;text-decoration:none">Registrar animo</a></p>
      </div>
    `
  });
}
