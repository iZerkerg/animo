import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { timeOfDayLabels, uiText } from "../constants/text";
import type { MoodEntry } from "../services/api";
import { formatDateObjectShort, formatLocalTime24, getLocalTimeOfDayInMinutes, isSameCivilDay } from "../utils/date";
import { getDominantEmotion, getEntryEmotions } from "../utils/emotions";
import { EntryActionsMenu, type EntryAction } from "./EntryActionsMenu";

type Props = {
  entries: MoodEntry[];
};

export function CalendarView({ entries }: Props) {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openMenuEntryId, setOpenMenuEntryId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState("");
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
  }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const leadingEmptyDays = (getDay(monthStart) + 6) % 7;
    return {
      leadingEmptyDays,
      days: eachDayOfInterval({ start: monthStart, end: endOfMonth(month) })
    };
  }, [month]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, MoodEntry[]>();
    entries.forEach((entry) => {
      const key = format(new Date(entry.date), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), entry]);
    });
    return map;
  }, [entries]);

  const selectedEntries = useMemo(
    () =>
      entries
        .filter((entry) => isSameCivilDay(entry.date, selectedDate))
        .sort(compareEntriesByLocalTime),
    [entries, selectedDate]
  );

  function getDayEntries(day: Date) {
    return entriesByDay.get(format(day, "yyyy-MM-dd")) ?? [];
  }

  function selectDay(day: Date) {
    setOpenMenuEntryId(null);
    setSelectedDate(day);
  }

  function handleUnavailableAction(action: EntryAction, _entry: MoodEntry) {
    setActionNotice(action === "edit" ? "Edición disponible próximamente." : "Eliminación disponible próximamente.");
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setActionNotice(""), 3000);
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

      <div className="calendar-grid" aria-label="Calendario emocional mensual">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
          <span className="weekday" key={`${day}-${index}`}>
            {day}
          </span>
        ))}
        {Array.from({ length: calendarDays.leadingEmptyDays }).map((_, index) => (
          <span className="calendar-day calendar-day-empty" aria-hidden="true" key={`empty-${index}`} />
        ))}
        {calendarDays.days.map((day) => {
          const dayEntries = getDayEntries(day);
          const dominant = getDominantEmotion(dayEntries);
          const isSelected =
            day.getFullYear() === selectedDate.getFullYear() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getDate() === selectedDate.getDate();
          const className = [
            "calendar-day",
            dominant ? "has-entry" : "",
            dominant?.className ?? "",
            isSelected ? "selected" : ""
          ].filter(Boolean).join(" ");

          return (
            <button
              aria-label={`${formatDateObjectShort(day)}${dominant ? `, predomina ${dominant.emotion}` : ""}`}
              className={className}
              key={day.toISOString()}
              type="button"
              onClick={() => selectDay(day)}
            >
              <span>{format(day, "d")}</span>
              {dominant && (
                <strong title={`Predomina ${dominant.emotion}`}>
                  {dominant.emoji}
                  <small>{dominant.count}</small>
                </strong>
              )}
            </button>
          );
        })}
      </div>

      <div className="day-detail">
        <h3>{formatDateObjectShort(selectedDate)}</h3>
        {actionNotice && <p className="entry-action-notice" role="status">{actionNotice}</p>}
        {selectedEntries.length === 0 ? (
          <p className="empty-state">{uiText.calendar.noEntries}</p>
        ) : (
          selectedEntries.map((entry) => (
            <article key={entry.id}>
              <div className="entry-detail-header">
                <strong>{timeOfDayLabels[entry.timeOfDay]}</strong>
                <span aria-hidden="true">·</span>
                <time dateTime={entry.createdAt}>{formatLocalTime24(entry.createdAt)}</time>
              </div>
              <EntryActionsMenu
                entry={entry}
                isOpen={openMenuEntryId === entry.id}
                onClose={() => setOpenMenuEntryId(null)}
                onOpen={() => setOpenMenuEntryId(entry.id)}
                onSelect={handleUnavailableAction}
              />
              <div className="emotion-pills">
                {getEntryEmotions(entry).map((item) => (
                  <span className="emotion-pill" key={`${entry.id}-${item.emotion}`}>
                    {item.emoji} {item.emotion}
                    <small>{item.intensity ?? 3}/5</small>
                  </span>
                ))}
              </div>
              <p>{entry.note || uiText.home.noNote}</p>
              <div className="category-list">
                {entry.categories.length ? entry.categories.map((category) => (
                  <span key={category.id}>{category.name}</span>
                )) : <span>{uiText.calendar.noCategories}</span>}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function compareEntriesByLocalTime(a: MoodEntry, b: MoodEntry) {
  // MoodEntry has no separate clock-time field. The visible local time comes from createdAt.
  // Entries sharing the same displayed HH:mm are ordered by the complete creation instant.
  const minuteDifference = getLocalTimeOfDayInMinutes(a.createdAt) - getLocalTimeOfDayInMinutes(b.createdAt);
  if (minuteDifference !== 0) return minuteDifference;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}
