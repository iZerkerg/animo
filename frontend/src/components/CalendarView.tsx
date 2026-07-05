import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { timeOfDayLabels, uiText } from "../constants/text";
import type { MoodEntry } from "../services/api";

type Props = {
  entries: MoodEntry[];
};

const emotionClass: Record<string, string> = {
  Feliz: "happy",
  Tranquila: "calm",
  Motivada: "motivated",
  Ansiosa: "anxious",
  Triste: "sad",
  Enojada: "angry",
  Cansada: "tired",
  Estresada: "stressed"
};

export function CalendarView({ entries }: Props) {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }), [month]);
  const selectedEntries = entries.filter((entry) => isSameDay(new Date(entry.date), selectedDate));

  function dominantEmotion(day: Date) {
    const dayEntries = entries.filter((entry) => isSameDay(new Date(entry.date), day));
    const counts = new Map<string, { total: number; emoji: string }>();
    dayEntries.forEach((entry) => {
      counts.set(entry.emotion, { total: (counts.get(entry.emotion)?.total ?? 0) + 1, emoji: entry.emoji });
    });
    return [...counts.entries()].sort((a, b) => b[1].total - a[1].total)[0];
  }

  return (
    <div className="panel calendar-panel">
      <div className="calendar-header">
        <button aria-label={uiText.calendar.previousMonth} type="button" onClick={() => setMonth(subMonths(month, 1))}>
          <ChevronLeft size={18} />
        </button>
        <h2>{format(month, "MMMM yyyy", { locale: es })}</h2>
        <button aria-label={uiText.calendar.nextMonth} type="button" onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-grid">
        {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
          <span className="weekday" key={day}>
            {day}
          </span>
        ))}
        {days.map((day) => {
          const dominant = dominantEmotion(day);
          const className = dominant ? `calendar-day has-entry ${emotionClass[dominant[0]] ?? ""}` : "calendar-day";
          return (
            <button className={className} key={day.toISOString()} type="button" onClick={() => setSelectedDate(day)}>
              <span>{format(day, "d")}</span>
              {dominant && <strong>{dominant[1].emoji}</strong>}
            </button>
          );
        })}
      </div>

      <div className="day-detail">
        <h3>{format(selectedDate, "dd/MM/yyyy")}</h3>
        {selectedEntries.length === 0 ? (
          <p>{uiText.calendar.noEntries}</p>
        ) : (
          selectedEntries.map((entry) => (
            <article key={entry.id}>
              <strong>
                {entry.emoji} {entry.emotion}
              </strong>
              <span>{timeOfDayLabels[entry.timeOfDay]}</span>
              <p>{entry.note || uiText.home.noNote}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
