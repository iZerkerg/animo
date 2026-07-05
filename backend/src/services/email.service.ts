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
        <p>Este es tu recordatorio de la ${timeOfDay}. Respira un momento y registra tu estado de ánimo.</p>
        <p style="margin-top:18px"><a href="${env.FRONTEND_URL}" style="background:#f6a6c9;color:#fff;padding:10px 16px;border-radius:12px;text-decoration:none">Registrar ánimo</a></p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (!isEmailConfigured()) {
    const safeUrl = new URL(resetUrl);
    safeUrl.searchParams.set("token", "[redacted]");
    console.info(`[email:dry-run] Recuperación de contraseña para ${to}: ${safeUrl.toString()}`);
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
    subject: "Restablece tu contraseña",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#fff7fb;padding:24px;color:#334155">
        <h2>Hola ${escapeHtml(name)}</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en Ánimo.</p>
        <p>Este enlace expira en 30 minutos y solo puede usarse una vez.</p>
        <p style="margin-top:18px"><a href="${escapeHtml(resetUrl)}" style="background:#f6a6c9;color:#fff;padding:10px 16px;border-radius:12px;text-decoration:none">Restablecer contraseña</a></p>
        <p style="margin-top:18px;color:#64748b">Si no pediste este cambio, puedes ignorar este correo.</p>
      </div>
    `
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
