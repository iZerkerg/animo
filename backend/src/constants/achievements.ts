import type { AchievementCategory } from "@prisma/client";

export type AchievementDefinition = {
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  target: number | null;
  sortOrder: number;
  isSecret?: boolean;
};

export const achievementCatalog: AchievementDefinition[] = [
  item("FIRST_ENTRY", "Primer paso", "Realiza tu primer registro.", "consistency", "🌱", 1, 1),
  item("STREAK_3_DAYS", "Tomando el hábito", "Registra tu estado de ánimo durante 3 días consecutivos.", "consistency", "🔥", 3, 2),
  item("STREAK_7_DAYS", "Una semana contigo", "Registra durante 7 días consecutivos.", "consistency", "🌿", 7, 3),
  item("STREAK_14_DAYS", "Constancia", "Registra durante 14 días consecutivos.", "consistency", "🌳", 14, 4),
  item("STREAK_30_DAYS", "Todo un mes", "Registra durante 30 días consecutivos.", "consistency", "🌟", 30, 5),
  item("STREAK_90_DAYS", "Gran compromiso", "Registra durante 90 días consecutivos.", "consistency", "💎", 90, 6),
  item("STREAK_180_DAYS", "Un hábito consolidado", "Registra durante 180 días consecutivos.", "consistency", "🏅", 180, 7),
  item("STREAK_365_DAYS", "Un año de autoconocimiento", "Registra durante 365 días consecutivos.", "consistency", "👑", 365, 8),
  item("COMPLETE_DAY", "Día completo", "Registra mañana, tarde y noche en un mismo día.", "dailyRhythm", "☀️", 1, 1),
  item("COMPLETE_3_DAYS", "Rutina completa", "Completa los tres momentos del día durante 3 días.", "dailyRhythm", "📅", 3, 2),
  item("COMPLETE_7_DAYS", "Siempre presente", "Completa los tres momentos del día durante 7 días.", "dailyRhythm", "⏰", 7, 3),
  item("ENTRIES_10", "Empezando el diario", "Realiza 10 registros.", "records", "✍️", 10, 1),
  item("ENTRIES_50", "Tomando confianza", "Realiza 50 registros.", "records", "📖", 50, 2),
  item("ENTRIES_100", "Gran observador", "Realiza 100 registros.", "records", "📚", 100, 3),
  item("ENTRIES_250", "Conociéndote mejor", "Realiza 250 registros.", "records", "🧠", 250, 4),
  item("ENTRIES_500", "Mucho camino recorrido", "Realiza 500 registros.", "records", "🌌", 500, 5),
  item("UNIQUE_EMOTIONS_5", "Descubriendo emociones", "Registra 5 emociones diferentes.", "emotions", "🎭", 5, 1),
  item("UNIQUE_EMOTIONS_10", "Amplio mundo emocional", "Registra 10 emociones diferentes.", "emotions", "🌈", 10, 2),
  item("ALL_EMOTIONS", "Todo tu abanico emocional", "Registra al menos una vez todas las emociones disponibles.", "emotions", "🧩", 8, 3),
  item("FIRST_CATEGORY", "Todo tiene un contexto", "Utiliza una categoría en un registro.", "categories", "🏷️", 1, 1),
  item("UNIQUE_CATEGORIES_5", "Diversas experiencias", "Utiliza 5 categorías diferentes.", "categories", "📂", 5, 2),
  item("ALL_CATEGORIES", "Explorador de contextos", "Utiliza todas las categorías disponibles al menos una vez.", "categories", "🗂️", null, 3),
  item("FIRST_NOTE", "Una historia comienza", "Escribe tu primera nota.", "reflection", "📝", 1, 1),
  item("NOTES_10", "Reflexionando", "Escribe notas en 10 registros.", "reflection", "📖", 10, 2),
  item("NOTES_50", "Tus pensamientos importan", "Escribe notas en 50 registros.", "reflection", "✨", 50, 3),
  item("LONG_NOTE", "Profundizando", "Escribe una nota de al menos 300 caracteres.", "reflection", "✒️", 300, 4),
  item("INTENSITY_5", "Emoción intensa", "Registra una emoción con intensidad 5.", "intensity", "⚡", 1, 1),
  item("INTENSITY_1", "Una emoción suave", "Registra una emoción con intensidad 1.", "intensity", "🍃", 1, 2),
  item("BIRTHDAY_ENTRY", "Un año más", "Realiza un registro el día de tu cumpleaños.", "special", "🎂", 1, 1),
  item("FIRST_ANNIVERSARY", "Primer aniversario", "Ha pasado un año desde que comenzaste tu diario.", "special", "🎉", 365, 2),
  item("MORNING_7", "Comenzando temprano", "Registra por la mañana durante 7 días distintos.", "secret", "🌅", 7, 1, true),
  item("EVENING_7", "Reflexiones nocturnas", "Registra por la noche durante 7 días distintos.", "secret", "🌙", 7, 2, true)
];

function item(code: string, name: string, description: string, category: AchievementCategory, icon: string, target: number | null, sortOrder: number, isSecret = false): AchievementDefinition {
  return { code, name, description, category, icon, target, sortOrder, isSecret };
}
