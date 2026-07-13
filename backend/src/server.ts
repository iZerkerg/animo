import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { ensureAchievementCatalog } from "./services/achievement.service.js";
import { logDevTiming, withDevTiming } from "./utils/dev-timing.js";

async function startServer() {
  const startupStartedAt = performance.now();
  try {
    await withDevTiming("Prisma connection", () => prisma.$connect());
    await ensureAchievementCatalog();

    app.listen(env.PORT, () => {
      logDevTiming("Backend startup", startupStartedAt);
      console.log(`API lista en http://localhost:${env.PORT}/api`);
    });
  } catch {
    console.error("No se pudo iniciar la API: falló la conexión a la base de datos o la inicialización del catálogo de logros.");
    await prisma.$disconnect().catch(() => undefined);
    process.exitCode = 1;
  }
}

await startServer();
