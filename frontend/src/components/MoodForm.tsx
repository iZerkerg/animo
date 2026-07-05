import { useState } from "react";
import { format } from "date-fns";
import { emotions, timeOfDayLabels, uiText } from "../constants/text";
import type { Category, MoodEntryEmotion, TimeOfDay } from "../services/api";
import { api } from "../services/api";

const timeOptions: Array<{ value: TimeOfDay; label: string }> = [
  { value: "morning", label: timeOfDayLabels.morning },
  { value: "afternoon", label: timeOfDayLabels.afternoon },
  { value: "evening", label: timeOfDayLabels.evening }
];

type Props = {
  categories: Category[];
  onCreated: () => void;
};

export function MoodForm({ categories, onCreated }: Props) {
  const [selectedEmotions, setSelectedEmotions] = useState<MoodEntryEmotion[]>([
    { emotion: emotions[0].emotion, emoji: emotions[0].emoji, intensity: 3 }
  ]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedEmotions.length) return;
    setSaving(true);
    try {
      await api.createMood({
        emotions: selectedEmotions.map((item) => ({
          emotion: item.emotion,
          emoji: item.emoji,
          intensity: item.intensity ?? undefined
        })),
        note,
        timeOfDay,
        date: `${date}T12:00:00.000Z`,
        categoryIds
      });
      setNote("");
      setCategoryIds([]);
      setSelectedEmotions([{ emotion: emotions[0].emotion, emoji: emotions[0].emoji, intensity: 3 }]);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(id: string) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleEmotion(item: { emotion: string; emoji: string }) {
    setSelectedEmotions((current) => {
      const exists = current.some((selected) => selected.emotion === item.emotion);
      if (exists) return current.filter((selected) => selected.emotion !== item.emotion);
      return [...current, { emotion: item.emotion, emoji: item.emoji, intensity: 3 }];
    });
  }

  function updateIntensity(emotion: string, intensity: number) {
    setSelectedEmotions((current) =>
      current.map((item) => (item.emotion === emotion ? { ...item, intensity } : item))
    );
  }

  function handleIntensityKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, emotion: string, currentLevel: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      updateIntensity(emotion, Math.min(currentLevel + 1, 5));
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      updateIntensity(emotion, Math.max(currentLevel - 1, 1));
    }

    if (event.key === "Home") {
      event.preventDefault();
      updateIntensity(emotion, 1);
    }

    if (event.key === "End") {
      event.preventDefault();
      updateIntensity(emotion, 5);
    }
  }

  return (
    <form className="panel mood-form" onSubmit={handleSubmit}>
      <div className="section-title">
        <span>{uiText.moodForm.title}</span>
        <strong>{selectedEmotions.map((item) => item.emoji).join("") || "?"}</strong>
      </div>

      <div className="emotion-grid">
        {emotions.map((item) => (
          <button
            aria-pressed={selectedEmotions.some((selected) => selected.emotion === item.emotion)}
            className={selectedEmotions.some((selected) => selected.emotion === item.emotion) ? "emotion active" : "emotion"}
            key={item.emotion}
            type="button"
            onClick={() => toggleEmotion(item)}
          >
            <span>{item.emoji}</span>
            {item.emotion}
          </button>
        ))}
      </div>

      <div className="selected-emotions">
        <span>{uiText.moodForm.selected}</span>
        {selectedEmotions.length === 0 ? (
          <p>{uiText.moodForm.chooseEmotion}</p>
        ) : (
          selectedEmotions.map((item) => (
            <div className="selected-emotion" key={item.emotion}>
              <button type="button" onClick={() => toggleEmotion(item)}>
                {item.emoji} {item.emotion}
              </button>
              <div className="intensity-picker" role="radiogroup" aria-label={`${uiText.moodForm.intensity} ${item.emotion}`}>
                <span>{uiText.moodForm.intensity} {item.intensity ?? 3}/5</span>
                <div className="intensity-dots">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const selectedLevel = item.intensity ?? 3;
                    const isSelected = selectedLevel === level;
                    const isFilled = selectedLevel >= level;

                    return (
                      <button
                        aria-checked={isSelected}
                        aria-label={`${uiText.moodForm.intensity} ${level} de 5`}
                        className={isFilled ? "intensity-dot filled" : "intensity-dot"}
                        key={level}
                        role="radio"
                        type="button"
                        onClick={() => updateIntensity(item.emotion, level)}
                        onKeyDown={(event) => handleIntensityKeyDown(event, item.emotion, selectedLevel)}
                      >
                        <span>{level}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="form-row">
        <label>
          {uiText.moodForm.timeOfDay}
          <select value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value as TimeOfDay)}>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {uiText.moodForm.date}
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>

      <label>
        {uiText.moodForm.note}
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={uiText.moodForm.notePlaceholder} />
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

      <button className="primary-action" disabled={saving || selectedEmotions.length === 0}>
        {saving ? uiText.moodForm.saving : uiText.moodForm.save}
      </button>
    </form>
  );
}
