import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { getStats } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import './StatsPage.css';

interface WeekCount {
  week: string;
  count: number;
}

interface ExerciseCount {
  name: string;
  count: number;
}

interface ProgressionPoint {
  date: string;
  max_weight: number;
}

interface VolumePoint {
  week: string;
  duration: number;
  avg_intensity: number | null;
}

interface StatsData {
  sessions_per_week: WeekCount[];
  top_exercises: ExerciseCount[];
  top_exercises_prev: Record<string, number> | null;
  exercise_progression: Record<string, ProgressionPoint[]>;
  volume_per_week: VolumePoint[];
  volume_by_exercise: Record<string, VolumePoint[]>;
}

function formatWeekLabel(weekLabel: string): string {
  const [yearStr, weekPart] = weekLabel.split('-');
  const year = parseInt(yearStr);
  const week = parseInt((weekPart || '').replace('W', ''));
  if (!year || !week) return weekLabel;
  const jan4 = new Date(year, 0, 4);
  const dow = (jan4.getDay() + 6) % 7;
  const w1Mon = new Date(jan4.getTime() - dow * 86400000);
  const monday = new Date(w1Mon.getTime() + (week - 1) * 7 * 86400000);
  if (monday.getDate() <= 7) {
    return monday.toLocaleDateString('sv-SE', { month: 'short' });
  }
  return '';
}

// Custom tooltip style for recharts
const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  color: '#e2e8f0',
  fontSize: '0.85rem',
};

const tooltipLabelStyle = {
  color: '#94a3b8',
  marginBottom: '4px',
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedVolumeExercise, setSelectedVolumeExercise] = useState('__all__');
  const [exerciseDays, setExerciseDays] = useState<string>('__all__');

  const DAYS_OPTIONS = [
    { value: '__all__', label: 'All time' },
    { value: '7', label: '7 dagar' },
    { value: '14', label: '14 dagar' },
    { value: '30', label: '1 månad' },
    { value: '90', label: '3 månader' },
    { value: '180', label: '6 månader' },
    { value: '365', label: '1 år' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const days = exerciseDays !== '__all__' ? parseInt(exerciseDays) : undefined;
        const data = await getStats(days);
        setStats(data);
        const firstWithWeight = data.top_exercises.find(
          (ex: ExerciseCount) => (data.exercise_progression[ex.name] ?? []).length > 0
        );
        if (firstWithWeight) setSelectedExercise(firstWithWeight.name);
      } catch {
        setError('Could not load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [exerciseDays]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="stats-loading">
          <div className="stats-spinner" />
          <span>Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <p className="stats-error">{error}</p>
      </div>
    );
  }

  const progressionData = stats && selectedExercise
    ? stats.exercise_progression[selectedExercise] ?? []
    : [];

  const totalSessions = stats ? stats.sessions_per_week.reduce((s, w) => s + w.count, 0) : 0;

  const totalDurationMin = stats
    ? stats.volume_per_week.reduce((s, w) => s + w.duration, 0)
    : 0;
  const totalDurationHours = Math.round(totalDurationMin / 60);

  const topPR: { name: string; weight: number } | null = stats
    ? Object.entries(stats.exercise_progression).reduce(
        (best, [name, points]) => {
          const max = Math.max(...points.map((p) => p.max_weight));
          return max > (best?.weight ?? 0) ? { name, weight: max } : best;
        },
        null as { name: string; weight: number } | null
      )
    : null;

  const prWeight = progressionData.length > 0
    ? Math.max(...progressionData.map((p) => p.max_weight))
    : null;

  const nonEmptyWeeks = stats ? stats.sessions_per_week.filter((w) => w.count > 0) : [];
  const avgSessions = nonEmptyWeeks.length > 0
    ? nonEmptyWeeks.reduce((s, w) => s + w.count, 0) / nonEmptyWeeks.length
    : 0;

  return (
    <div className="page-container">
      <div className="stats-header">
        <h1>Statistics</h1>
        <p className="stats-subtitle">An overview of your training activity</p>
      </div>

      <div className="stats-grid">
        {/* Summary cards */}
        {stats && (
          <div className="stats-summary-row">
            <div className="stats-summary-card">
              <span className="stats-summary-value">{totalSessions}</span>
              <span className="stats-summary-label">Pass totalt</span>
            </div>
            <div className="stats-summary-card">
              <span className="stats-summary-value">{totalDurationHours}h</span>
              <span className="stats-summary-label">Cardiotid totalt</span>
            </div>
            {topPR && (
              <div className="stats-summary-card">
                <span className="stats-summary-value">{topPR.weight} kg</span>
                <span className="stats-summary-label">Bästa lyft · {topPR.name}</span>
              </div>
            )}
          </div>
        )}
        {/* Duration & Intensitet */}
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Duration & Intensity</h2>
            {stats && Object.keys(stats.volume_by_exercise).length > 0 && (
              <CustomSelect
                value={selectedVolumeExercise}
                onChange={setSelectedVolumeExercise}
                options={[
                  { value: '__all__', label: 'Alla övningar' },
                  ...Object.keys(stats.volume_by_exercise).map((n) => ({ value: n, label: n })),
                ]}
              />
            )}
          </div>
          {stats && (() => {
            const data = selectedVolumeExercise === '__all__'
              ? stats.volume_per_week
              : (stats.volume_by_exercise[selectedVolumeExercise] ?? []);
            return data.some((w) => w.duration > 0 || w.avg_intensity != null);
          })() ? (() => {
            const rawData = selectedVolumeExercise === '__all__'
              ? stats!.volume_per_week
              : (stats!.volume_by_exercise[selectedVolumeExercise] ?? []);
            const hasDuration = rawData.some((w) => w.duration > 0);
            const chartData = rawData.map((w) => ({ ...w }));
            return (
            <>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: hasDuration ? -8 : -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatWeekLabel} />
                {hasDuration && <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit=" min" allowDecimals={false} />}
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                  formatter={(value, name) => {
                    if (name === 'Duration') return Number(value) === 0 ? null : [`${value} min`, 'Duration'];
                    if (value == null) return null;
                    return [`${value}/10`, 'Snittintensitet'];
                  }}
                />
                {hasDuration && <Bar yAxisId="left" dataKey="duration" name="Duration" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />}
                <Line yAxisId="right" type="monotone" dataKey="avg_intensity" name="avg_intensity" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} connectNulls />
                <defs>
                  <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {hasDuration && <span className="chart-legend-item"><span className="chart-legend-bar" />Duration</span>}
              <span className="chart-legend-item"><span className="chart-legend-dot" />Intensitet</span>
            </div>
            </>
            );
          })() : (
            <p className="no-data-message">Fyll i duration eller intensitet på dina övningar för att se data här.</p>
          )}
        </div>

        {/* Most trained exercises */}
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Most trained exercises</h2>
            <CustomSelect
              value={exerciseDays}
              onChange={setExerciseDays}
              options={DAYS_OPTIONS}
            />
          </div>
          {stats && stats.top_exercises.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.top_exercises}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar
                  dataKey="count"
                  name="Times used"
                  fill="url(#barGradientH)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={36}
                >
                  <LabelList
                    dataKey="count"
                    position="right"
                    content={(props: unknown) => {
                      const { x = 0, y = 0, width = 0, height = 0, value, name } = props as { x?: number; y?: number; width?: number; height?: number; value?: number; name?: string };
                      const prev = stats?.top_exercises_prev;
                      if (!prev || !name) return null;
                      const prevCount = prev[name];
                      if (prevCount == null) return null;
                      const diff = (value ?? 0) - prevCount;
                      const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '−';
                      const color = diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#94a3b8';
                      return (
                        <text x={Number(x) + Number(width) + 8} y={Number(y) + Number(height) / 2} fill={color} fontSize={12} fontWeight={700} dominantBaseline="middle">
                          {arrow}
                        </text>
                      );
                    }}
                  />
                </Bar>
                <defs>
                  <linearGradient id="barGradientH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-message">No exercise data available</p>
          )}
        </div>

        {/* Weight progression */}
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Weight progression</h2>
            {stats && stats.top_exercises.length > 0 && (
              <CustomSelect
                value={selectedExercise}
                onChange={setSelectedExercise}
                options={stats.top_exercises
                  .filter((ex) => (stats.exercise_progression[ex.name] ?? []).length > 0)
                  .map((ex) => ({ value: ex.name, label: ex.name }))}
              />
            )}
          </div>
          {progressionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={progressionData}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => {
                    // Short date: "Mar 1"
                    const d = new Date(v);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => [`${value} kg`, 'Max weight']}
                />
                <Line
                  type="monotone"
                  dataKey="max_weight"
                  name="Max weight"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={(props: { cx?: number; cy?: number; payload?: { max_weight: number } }) => {
                    const { cx = 0, cy = 0, payload } = props;
                    const isPR = prWeight != null && payload?.max_weight === prWeight;
                    if (isPR) {
                      return (
                        <g key={`pr-${cx}-${cy}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#f59e0b" stroke="#0f172a" strokeWidth={2} />
                          <text x={cx} y={cy - 13} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight={700}>PR</text>
                        </g>
                      );
                    }
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#6366f1" />;
                  }}
                  activeDot={{ fill: '#8b5cf6', strokeWidth: 0, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-message">
              {stats && stats.top_exercises.length === 0
                ? 'No exercise data available'
                : `No weight data recorded for ${selectedExercise}`}
            </p>
          )}
        </div>
        {/* Workouts per week */}
        <div className="stats-card">
          <h2>Workouts per week</h2>
          {stats && stats.sessions_per_week.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.sessions_per_week}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatWeekLabel}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar
                  dataKey="count"
                  name="Sessions"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                {avgSessions > 0 && (
                  <ReferenceLine
                    y={avgSessions}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{ value: `snitt ${avgSessions.toFixed(1)}/v`, position: 'insideTopRight', fill: '#6366f1', fontSize: 10 }}
                  />
                )}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-message">No session data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
