import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { timeOfDayLabels, uiText } from "../constants/text";
import type { MoodEntry } from "../services/api";

type Props = {
  entries: MoodEntry[];
};

const scoreByEmotion: Record<string, number> = {
  Feliz: 5,
  Tranquila: 4,
  Motivada: 5,
  Cansada: 2,
  Ansiosa: 2,
  Estresada: 2,
  Triste: 1,
  Enojada: 1
};

const colors = ["var(--primary)", "var(--chart-secondary)", "#f9d46b", "#a7c7e7", "#cdb4db", "#ffb4a2"];

export function DashboardCharts({ entries }: Props) {
  const emotionEvents = entries.flatMap((entry) =>
    getEntryEmotions(entry).map((emotion) => ({ ...emotion, entry }))
  );
  const byEmotion = groupCount(emotionEvents, (item) => item.emotion);
  const byTime = groupCount(emotionEvents, (item) => timeOfDayLabels[item.entry.timeOfDay]);
  const byCategory = groupCount(
    emotionEvents.flatMap((item) => item.entry.categories.map((category) => ({ name: category.name, emotion: item.emotion }))),
    (item) => `${item.name} - ${item.emotion}`
  ).slice(0, 8);
  const evolution = entries.slice(-14).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }),
    score: entryScore(entry),
    emotion: getEntryEmotions(entry).map((item) => item.emotion).join(", ")
  }));

  const weeklyAverage = average(entries.slice(-7));
  const monthlyAverage = average(entries.slice(-30));

  return (
    <div className="dashboard-grid">
      <div className="panel metric-card">
        <span>{uiText.dashboard.weeklyAverage}</span>
        <strong>{weeklyAverage.toFixed(1)}</strong>
      </div>
      <div className="panel metric-card">
        <span>{uiText.dashboard.monthlyAverage}</span>
        <strong>{monthlyAverage.toFixed(1)}</strong>
      </div>

      <div className="panel chart-card wide">
        <h2>{uiText.dashboard.recentEvolution}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolution} margin={{ top: 8, right: 12, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="var(--chart-primary)" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-card">
        <h2>{uiText.dashboard.frequentEmotions}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byEmotion} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickFormatter={shortLabel} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {byEmotion.map((_, index) => (
                <Cell fill={colors[index % colors.length]} key={index} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-card">
        <h2>{uiText.dashboard.timeOfDay}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={byTime} dataKey="total" nameKey="name" outerRadius="76%" label>
              {byTime.map((_, index) => (
                <Cell fill={colors[index % colors.length]} key={index} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-card wide">
        <h2>{uiText.dashboard.emotionsByCategory}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCategory} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={118} tick={{ fontSize: 11 }} tickFormatter={shortLabel} />
            <Tooltip />
            <Bar dataKey="total" fill="var(--chart-secondary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function groupCount<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  items.forEach((item) => map.set(key(item), (map.get(key(item)) ?? 0) + 1));
  return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

function average(entries: MoodEntry[]) {
  if (!entries.length) return 0;
  return entries.reduce((sum, entry) => sum + entryScore(entry), 0) / entries.length;
}

function shortLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

function getEntryEmotions(entry: MoodEntry) {
  return entry.emotions?.length ? entry.emotions : [{ emotion: entry.emotion, emoji: entry.emoji, intensity: null }];
}

function entryScore(entry: MoodEntry) {
  const values = getEntryEmotions(entry).map((item) => item.intensity ?? scoreByEmotion[item.emotion] ?? 3);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
