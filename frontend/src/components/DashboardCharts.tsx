import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { uiText } from "../constants/text";
import type { MoodEntry } from "../services/api";
import { getEmotionEvents } from "../utils/emotions";
import {
  buildEmotionFrequency,
  buildMoodTrend,
  filterEntriesByRange,
  formatAnalysisRangeLabel,
  getDefaultCustomRange,
  getEmotionalBalanceCategory,
  getTimeRangeLabel,
  resolveDateRange,
  timeRangeOptions,
  type TimeRangePreset
} from "../utils/stats";

type Props = {
  entries: MoodEntry[];
};

const colors = [
  "var(--chart-primary)",
  "var(--chart-secondary)",
  "var(--chart-tertiary)",
  "var(--chart-quaternary)",
  "var(--chart-quinary)",
  "var(--chart-senary)"
];

export function DashboardCharts({ entries }: Props) {
  const defaultCustomRange = useMemo(() => getDefaultCustomRange(), []);
  const [rangePreset, setRangePreset] = useState<TimeRangePreset>("1w");
  const [customStart, setCustomStart] = useState(defaultCustomRange.start);
  const [customEnd, setCustomEnd] = useState(defaultCustomRange.end);
  const [isBalanceTooltipOpen, setIsBalanceTooltipOpen] = useState(false);

  const range = useMemo(() => resolveDateRange(rangePreset, customStart, customEnd), [customEnd, customStart, rangePreset]);
  const rangeError = rangePreset === "custom" && !range ? uiText.dashboard.invalidRange : "";
  const filteredEntries = useMemo(() => filterEntriesByRange(entries, range), [entries, range]);
  const emotionEvents = useMemo(() => getEmotionEvents(filteredEntries), [filteredEntries]);
  const frequency = useMemo(() => buildEmotionFrequency(filteredEntries), [filteredEntries]);
  const isSingleDayRange = rangePreset === "1d";
  const moodTrend = useMemo(() => buildMoodTrend(filteredEntries, range, isSingleDayRange), [filteredEntries, isSingleDayRange, range]);
  const trendPointsWithData = moodTrend.filter((item) => item.score !== null).length;
  const hasEnoughTrendData = trendPointsWithData >= 2;
  const topEmotion = frequency[0];
  const maxFrequencyTotal = topEmotion?.total ?? 0;
  const averageMoodScore = moodTrend
    .filter((item) => item.score !== null)
    .reduce((sum, item, _, source) => sum + (item.score ?? 0) / source.length, 0);
  const emotionalBalanceScore = trendPointsWithData ? averageMoodScore : null;
  const emotionalBalanceCategory = getEmotionalBalanceCategory(emotionalBalanceScore);
  const emotionalBalancePosition = emotionalBalanceScore === null ? 50 : ((Math.max(-5, Math.min(5, emotionalBalanceScore)) + 5) / 10) * 100;

  return (
    <div className="dashboard-grid">
      <div className="panel chart-card wide controls-card analysis-period-card">
        <div className="chart-heading-row">
          <div>
            <h2>{uiText.dashboard.period}</h2>
            <p>{uiText.dashboard.viewing.replace("{period}", getTimeRangeLabel(rangePreset))}</p>
          </div>
          <label className="range-select">
            <span>{uiText.dashboard.timeRange}</span>
            <select value={rangePreset} onChange={(event) => setRangePreset(event.target.value as TimeRangePreset)}>
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {rangePreset === "custom" && (
          <div className="custom-range">
            <label>
              {uiText.dashboard.startDate}
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
            </label>
            <label>
              {uiText.dashboard.endDate}
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </label>
          </div>
        )}
        {rangeError && <p className="error-text">{rangeError}</p>}
        <div className="analysis-period-facts">
          <strong>{formatAnalysisRangeLabel(range)}</strong>
          <div className="analysis-period-counts">
            <span>{filteredEntries.length} {filteredEntries.length === 1 ? uiText.dashboard.recordAnalyzed : uiText.dashboard.recordsAnalyzed}</span>
            <span>{emotionEvents.length} {emotionEvents.length === 1 ? uiText.dashboard.emotionAnalyzed : uiText.dashboard.emotionsAnalyzed}</span>
          </div>
        </div>
      </div>

      <div className="analysis-summary-grid wide">
        <div className="panel metric-card">
          <span>{uiText.dashboard.topEmotion}</span>
          <strong>{topEmotion ? `${topEmotion.emoji} ${topEmotion.name}` : "-"}</strong>
          <small>{topEmotion ? topEmotion.label : uiText.dashboard.noFrequencyData}</small>
        </div>
        <div className="panel metric-card emotional-balance-card">
          <div className="emotional-balance-heading">
            <span>{uiText.dashboard.emotionalBalance}</span>
            <button
              aria-describedby="emotional-balance-tooltip"
              aria-expanded={isBalanceTooltipOpen}
              aria-label={`Información sobre ${uiText.dashboard.emotionalBalance}`}
              className="balance-info"
              type="button"
              onBlur={() => setIsBalanceTooltipOpen(false)}
              onClick={() => setIsBalanceTooltipOpen((open) => !open)}
            >
              <Info aria-hidden="true" size={16} />
              <span
                className={isBalanceTooltipOpen ? "balance-tooltip is-open" : "balance-tooltip"}
                id="emotional-balance-tooltip"
                role="tooltip"
              >
                {uiText.dashboard.emotionalBalanceTooltip}
              </span>
            </button>
          </div>

          <div className="emotional-balance-result">
            <strong>{emotionalBalanceScore === null ? "-" : formatSignedScore(emotionalBalanceScore)}</strong>
            <span>{emotionalBalanceCategory?.label ?? uiText.dashboard.emotionalBalanceNoData}</span>
          </div>

          <div className="emotional-balance-scale" aria-label={emotionalBalanceScore === null ? uiText.dashboard.emotionalBalanceNoData : `${uiText.dashboard.emotionalBalance}: ${formatSignedScore(emotionalBalanceScore)} de -5 a +5`}>
            <div className="balance-scale-labels" aria-hidden="true">
              <span>{uiText.dashboard.emotionalBalanceNegative}</span>
              <span>{uiText.dashboard.emotionalBalanceNeutral}</span>
              <span>{uiText.dashboard.emotionalBalancePositive}</span>
            </div>
            <div className="balance-track" aria-hidden="true">
              <span className="balance-center" />
              {emotionalBalanceScore !== null && <span className="balance-marker" style={{ left: `${emotionalBalancePosition}%` }} />}
            </div>
            <div className="balance-scale-values" aria-hidden="true">
              <span>-5</span>
              <span>0</span>
              <span>+5</span>
            </div>
          </div>

          <p className="emotional-balance-explanation">
            {emotionalBalanceCategory?.explanation ?? uiText.dashboard.emotionalBalanceNoData}
          </p>
        </div>
      </div>

      <div className="panel chart-card wide">
        <div className="chart-heading-row">
          <div>
            <h2>{uiText.dashboard.frequentEmotions}</h2>
            <p>{uiText.dashboard.frequencyHint}</p>
          </div>
        </div>
        {frequency.length === 0 ? (
          <p className="empty-state">{uiText.dashboard.noFrequencyData}</p>
        ) : (
          <div className="emotion-ranking">
            {frequency.map((item, index) => {
              const visualWidth = maxFrequencyTotal ? Math.max(10, Math.round((item.total / maxFrequencyTotal) * 100)) : 0;
              return (
                <article className="emotion-rank-row" key={item.name}>
                  <div className="emotion-rank-label">
                    <span>{item.emoji}</span>
                    <strong>{item.name}</strong>
                  </div>
                  <div className="emotion-rank-track" aria-hidden="true">
                    <span style={{ width: `${visualWidth}%`, background: colors[index % colors.length] }} />
                  </div>
                  <strong className="emotion-rank-value">{item.label}</strong>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel chart-card wide">
        <div className="chart-heading-row">
          <div>
            <h2>{uiText.dashboard.moodTrend}</h2>
            <p>{uiText.dashboard.moodTrendHint}</p>
            <p>{uiText.dashboard.moodTrendScaleHint}</p>
          </div>
        </div>
        {!hasEnoughTrendData ? (
          <p className="empty-state">{isSingleDayRange ? uiText.dashboard.singleDayEvolutionHint : uiText.dashboard.notEnoughEvolutionData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={moodTrend} margin={{ top: 8, right: 14, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis domain={[-5, 5]} ticks={[-5, -2.5, 0, 2.5, 5]} tick={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="4 4" />
              <Tooltip content={<MoodTrendTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--surface-solid)", strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function MoodTrendTooltip({ active, payload, label }: { active?: boolean; label?: string; payload?: Array<{ payload: { score: number | null; emotions: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>{item.score === null ? uiText.dashboard.noDataForDay : `${formatSignedScore(item.score)} / +5 · ${item.emotions} emociones`}</span>
      <small>{uiText.dashboard.moodTrendHint}</small>
    </div>
  );
}

function formatSignedScore(score: number) {
  return `${score > 0 ? "+" : ""}${score.toFixed(1)}`;
}
