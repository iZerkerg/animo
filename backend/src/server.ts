import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { ensureAchievementCatalog } from "./services/achievement.service.js";

async function startServer() {
  try {
    await prisma.$connect();
    await ensureAchievementCatalog();

    app.listen(env.PORT, () => {
      console.log(`API lista en http://localhost:${env.PORT}/api`);
    });
  } catch {
    console.error("No se pudo iniciar la API: falló la conexión a la base de datos o la inicialización del catálogo de logros.");
    await prisma.$disconnect().catch(() => undefined);
    process.exitCode = 1;
  }
}

await startServer();
