import { prisma } from "../config/prisma.js";
import { ensureAchievementCatalog } from "../services/achievement.service.js";

await ensureAchievementCatalog();
console.log("Catálogo de logros inicializado.");
await prisma.$disconnect();
