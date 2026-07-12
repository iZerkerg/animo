import { prisma } from "../config/prisma.js";
import { ensureAchievementCatalog } from "../services/achievement.service.js";

try {
  await ensureAchievementCatalog();
  console.log("Catálogo de logros inicializado.");
} finally {
  await prisma.$disconnect();
}
