import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getStats } from '../services/api';
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

interface StatsData {
  sessions_per_week: WeekCount[];
  top_exercises: ExerciseCount[];
  exercise_progression: Record<string, ProgressionPoint[]>;
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
        if (data.top_exercises.length > 0) {
          setSelectedExercise(data.top_exercises[0].name);
        }
      } catch {
        setError('Could not load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  return (
    <div className="page-container">
      <div className="stats-header">
        <h1>Statistics</h1>
        <p className="stats-subtitle">An overview of your training activity</p>
      </div>

      <div className="stats-grid">
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
                  tickFormatter={(v: string) => {
                    // Show only the "W10" part
                    const parts = v.split('-');
                    return parts[1] ?? v;
                  }}
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

        {/* Most trained exercises */}
        <div className="stats-card">
          <h2>Most trained exercises</h2>
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
                />
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
              <select
                className="exercise-select"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                {stats.top_exercises.map((ex) => (
                  <option key={ex.name} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {progressionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={progressionData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
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
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
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
      </div>
    </div>
  );
}
