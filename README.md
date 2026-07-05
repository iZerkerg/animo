# Ánimo

App web cliente-servidor para registrar estados de ánimo por usuario, con calendario, dashboard de tendencias y configuración inicial de recordatorios por correo.

## Stack

- Frontend: React + Vite + TypeScript + Recharts + Lucide.
- Backend: Node.js + Express + TypeScript.
- Base de datos: PostgreSQL gestionado con Prisma ORM.
- Autenticación: JWT.
- Correos: Nodemailer, listo para SMTP compatible con Resend, SendGrid, Mailtrap u otro proveedor.

## Estructura

```txt
backend/
  prisma/schema.prisma
  src/routes
  src/services
  src/middleware
frontend/
  src/components
  src/pages
  src/services
```

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Copia las variables de entorno:

```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

3. Edita `backend/.env` con tu `DATABASE_URL` de PostgreSQL y un `JWT_SECRET` largo. Para desarrollo puedes usar servicios como Supabase, Neon, Railway o Render PostgreSQL.

4. Genera Prisma y crea las tablas:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Ejecuta frontend y backend:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api

## Variables de entorno importantes

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<db-pass>@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:<db-pass>@db.<project-ref>.supabase.co:5432/postgres"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:5173"
VITE_API_URL="http://localhost:4000/api"
```

Para correos reales:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="apikey-or-user"
SMTP_PASS="secret"
EMAIL_FROM="Ánimo <no-reply@example.com>"
```

Si SMTP no está configurado, el backend mantiene los recordatorios y el endpoint de prueba funciona en modo dry-run.

## Funcionalidades incluidas

- Registro, login, persistencia de sesión con JWT y logout.
- Cada usuario ve solo sus propios registros.
- Registro de ánimo por mañana, tarde y noche.
- Emociones con emoji, nota y categorías.
- Calendario mensual con días marcados por emoción predominante.
- Dashboard con evolución, emociones frecuentes, promedio semanal/mensual, categorías y distribución por momento del día.
- Resumen automático de tendencias semanales.
- Configuración de recordatorios por correo con servicio modular en `backend/src/services/email.service.ts`.

## Siguientes mejoras sugeridas

- Agregar un job programado con cron o una cola para disparar recordatorios según horario.
- Añadir edición y eliminación de registros.
- Internacionalizar etiquetas de fechas con locale `es`.
- Crear pruebas de API e integración de frontend.
