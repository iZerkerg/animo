import { useState } from "react";
import { format } from "date-fns";
import type { Category, TimeOfDay } from "../services/api";
import { api } from "../services/api";

const emotions = [
  { emotion: "Feliz", emoji: "😊", score: 5 },
  { emotion: "Tranquila", emoji: "😌", score: 4 },
  { emotion: "Ansiosa", emoji: "😟", score: 2 },
  { emotion: "Triste", emoji: "😢", score: 1 },
  { emotion: "Enojada", emoji: "😠", score: 1 },
  { emotion: "Cansada", emoji: "😴", score: 2 },
  { emotion: "Motivada", emoji: "✨", score: 5 },
  { emotion: "Estresada", emoji: "😵", score: 2 }
];

const timeOptions: Array<{ value: TimeOfDay; label: string }> = [
  { value: "morning", label: "Manana" },
  { value: "afternoon", label: "Tarde" },
  { value: "evening", label: "Noche" }
];

type Props = {
  categories: Category[];
  onCreated: () => void;
};

export function MoodForm({ categories, onCreated }: Props) {
  const [selectedEmotion, setSelectedEmotion] = useState(emotions[0]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createMood({
        emotion: selectedEmotion.emotion,
        emoji: selectedEmotion.emoji,
        note,
        timeOfDay,
        date: `${date}T12:00:00.000Z`,
        categoryIds
      });
      setNote("");
      setCategoryIds([]);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(id: string) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form className="panel mood-form" onSubmit={handleSubmit}>
      <div className="section-title">
        <span>Registro rapido</span>
        <strong>{selectedEmotion.emoji}</strong>
      </div>

      <div className="emotion-grid">
        {emotions.map((item) => (
          <button
            className={item.emotion === selectedEmotion.emotion ? "emotion active" : "emotion"}
            key={item.emotion}
            type="button"
            onClick={() => setSelectedEmotion(item)}
          >
            <span>{item.emoji}</span>
            {item.emotion}
          </button>
        ))}
      </div>

      <div className="form-row">
        <label>
          Momento
          <select value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value as TimeOfDay)}>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>

      <label>
        Nota
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Que paso? Que necesitas recordar?" />
      </label>

      <div className="chips">
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={categoryIds.includes(category.id) ? "chip selected" : "chip"}
            onClick={() => toggleCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <button className="primary-action" disabled={saving}>
        {saving ? "Guardando..." : "Guardar registro"}
      </button>
    </form>
  );
}
