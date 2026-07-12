import { MoodForm } from "../components/MoodForm";
import { uiText } from "../constants/text";
import type { Category, UnlockedAchievement } from "../services/api";

type Props = {
  categories: Category[];
  onCreated: (unlockedAchievements: UnlockedAchievement[]) => void;
};

export function NewMoodPage({ categories, onCreated }: Props) {
  return (
    <div className="new-mood-view">
      <p className="status-text">{uiText.moodForm.subtitle}</p>
      <MoodForm categories={categories} onCreated={onCreated} />
    </div>
  );
}
