import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const categoryRouter = Router();

const seedCategories = [
  "Universidad",
  "Familia",
  "Pareja",
  "Amistades",
  "Sueno",
  "Alimentacion",
  "Redes sociales",
  "Trabajo",
  "Salud",
  "Otro"
];

categoryRouter.get("/", requireAuth, async (_req, res) => {
  await prisma.category.createMany({
    data: seedCategories.map((name) => ({ name })),
    skipDuplicates: true
  });

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return res.json({ categories });
});
