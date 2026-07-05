import type { MoodEntry, Category } from "@prisma/client";

const positive = new Set(["Feliz", "Tranquila", "Motivada"]);

export function buildSummary(entries: Array<MoodEntry & { categories: Category[] }>) {
  if (!entries.length) {
    return [
      "Aún no hay registros para resumir. Un primer registro ya empieza a dibujar tu mapa emocional."
    ];
  }

  const emotionCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();
  const anxietyCategories = new Map<string, number>();

  entries.forEach((entry) => {
    emotionCounts.set(entry.emotion, (emotionCounts.get(entry.emotion) ?? 0) + 1);
    timeCounts.set(entry.timeOfDay, (timeCounts.get(entry.timeOfDay) ?? 0) + 1);

    if (entry.emotion === "Ansiosa") {
      entry.categories.forEach((category) => {
        anxietyCategories.set(category.name, (anxietyCategories.get(category.name) ?? 0) + 1);
      });
    }
  });

  const topEmotion = [...emotionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topTime = [...timeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topAnxietyCategory = [...anxietyCategories.entries()].sort((a, b) => b[1] - a[1])[0];
  const positiveMorning = entries.filter((entry) => entry.timeOfDay === "morning" && positive.has(entry.emotion)).length;

  const phrases = [
    `Esta semana tu emoción más frecuente fue ${topEmotion[0].toLowerCase()}.`,
    `Registraste tu ánimo ${entries.length} veces esta semana.`,
    topAnxietyCategory
      ? `La categoría más asociada a ansiedad fue ${topAnxietyCategory[0].toLowerCase()}.`
      : "No hay una categoría claramente asociada a ansiedad esta semana.",
    positiveMorning > 0 && topTime?.[0] === "morning"
      ? "Tu ánimo fue más positivo durante las mañanas."
      : `Tu momento con más registros fue ${labelTime(topTime?.[0] ?? "morning")}.`
  ];

  return phrases;
}

function labelTime(value: string) {
  return {
    morning: "la mañana",
    afternoon: "la tarde",
    evening: "la noche"
  }[value] ?? value;
}
