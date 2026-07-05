import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const colors = ["#f7a8c4", "#9bd6c5", "#f9d46b", "#a7c7e7", "#cdb4db", "#ffb4a2"];

export function DashboardCharts({ entries }: Props) {
  const byEmotion = groupCount(entries, (entry) => entry.emotion);
  const byTime = groupCount(entries, (entry) => entry.timeOfDay);
  const byCategory = groupCount(
    entries.flatMap((entry) => entry.categories.map((category) => ({ name: category.name, emotion: entry.emotion }))),
    (item) => `${item.name} - ${item.emotion}`
  ).slice(0, 8);
  const evolution = entries.slice(-14).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }),
    score: scoreByEmotion[entry.emotion] ?? 3,
    emotion: entry.emotion
  }));

  const weeklyAverage = average(entries.slice(-7));
  const monthlyAverage = average(entries.slice(-30));

  return (
    <div className="dashboard-grid">
      <div className="panel metric-card">
        <span>Promedio semanal</span>
        <strong>{weeklyAverage.toFixed(1)}</strong>
      </div>
      <div className="panel metric-card">
        <span>Promedio mensual</span>
        <strong>{monthlyAverage.toFixed(1)}</strong>
      </div>

      <div className="panel chart-card wide">
        <h2>Evolucion reciente</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eadfe8" />
            <XAxis dataKey="date" />
            <YAxis domain={[1, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#e66f9e" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-card">
        <h2>Emociones frecuentes</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byEmotion}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eadfe8" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
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
        <h2>Momento del dia</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={byTime} dataKey="total" nameKey="name" outerRadius={86} label>
              {byTime.map((_, index) => (
                <Cell fill={colors[index % colors.length]} key={index} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-card wide">
        <h2>Emociones por categoria</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eadfe8" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill="#9bd6c5" radius={[8, 8, 0, 0]} />
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
  return entries.reduce((sum, entry) => sum + (scoreByEmotion[entry.emotion] ?? 3), 0) / entries.length;
}
