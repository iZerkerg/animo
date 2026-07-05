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
printf 'VITE_API_URL="http://localhost:4000/api"\n' > frontend/.env
```

3. Edita `backend/.env` con tu `DATABASE_URL` de PostgreSQL, un `JWT_SECRET` largo y las variables de Supabase Storage. Para desarrollo puedes usar servicios como Supabase, Neon, Railway o Render PostgreSQL.

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
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="replace-with-your-service-role-key"
SUPABASE_STORAGE_BUCKET="profile-images"
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

`FRONTEND_URL` se usa para construir enlaces de recuperación de contraseña, por ejemplo `https://tu-dominio/reset-password?token=...`.

Si SMTP no está configurado, el backend mantiene los recordatorios y los correos funcionan en modo dry-run sin imprimir tokens completos.

`SUPABASE_SERVICE_ROLE_KEY` debe existir solo en `backend/.env`. No la agregues a `frontend/.env` ni a variables `VITE_*`.

## Supabase Storage

La subida de foto de perfil usa Supabase Storage desde el backend y guarda la URL resultante en `User.profileImageUrl`.

Configuración manual en Supabase:

1. Entra a tu proyecto de Supabase.
2. Ve a Storage.
3. Crea un bucket llamado `profile-images`.
4. Marca el bucket como Public si quieres usar URLs públicas directamente.
5. En allowed MIME types, permite `image/jpeg`, `image/png` e `image/webp`.
6. Define un file size limit de 5 MB o menos.
7. Copia `Project URL` en `SUPABASE_URL`.
8. Copia la clave `service_role` en `SUPABASE_SERVICE_ROLE_KEY` solo para el backend.

El endpoint `POST /api/users/me/profile-image` requiere JWT, recibe `multipart/form-data` con el campo `profileImage`, valida JPG/PNG/WEBP y sube el archivo en memoria sin guardarlo en disco.

## Recuperación de contraseña

El flujo usa `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`.

- El formulario `/forgot-password` solicita el correo y siempre muestra una respuesta genérica para no revelar si la cuenta existe.
- El backend genera un token aleatorio, guarda solo su hash SHA-256, lo marca como usado al restablecer y lo expira a los 30 minutos.
- El correo envía al usuario a `/reset-password?token=...`.
- El formulario `/reset-password` valida contraseña y confirmación antes de enviar.
- Hay un rate limit básico en memoria para reducir abuso de solicitudes por IP/correo.

## Funcionalidades incluidas

- Registro, login, persistencia de sesión con JWT y logout.
- Perfil de usuario con nombre, fecha de nacimiento, subida de foto y avatar por defecto.
- Cada usuario ve solo sus propios registros.
- Registro de ánimo por mañana, tarde y noche.
- Emociones con emoji, nota y categorías.
- Calendario mensual con días marcados por emoción predominante.
- Dashboard con evolución, emociones frecuentes, promedio semanal/mensual, categorías y distribución por momento del día.
- Resumen automático de tendencias semanales.
- Configuración de recordatorios por correo con servicio modular en `backend/src/services/email.service.ts`.
- Saludo especial de cumpleaños cuando coincide día y mes de la fecha guardada en el perfil.

## Siguientes mejoras sugeridas

- Agregar un job programado con cron o una cola para disparar recordatorios según horario.
- Añadir edición y eliminación de registros.
- Internacionalizar etiquetas de fechas con locale `es`.
- Crear pruebas de API e integración de frontend.
