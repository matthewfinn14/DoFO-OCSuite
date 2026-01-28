import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import {
  getInstalledPlaysForWeek,
  computePlayHistory,
  calculateGradingSummary,
  applyPlayFilters
} from '../../../utils/qcAnalysis';
import GradingModal from './GradingModal';

export default function PracticePerformanceAudit({
  plays,
  weeks,
  setupConfig,
  practiceGrades,
  weekIds,
  currentWeek,
  filters,
  expanded
}) {
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Get installed plays for current week(s)
  const installedPlays = useMemo(() => {
    if (!weekIds || weekIds.length === 0) return [];

    const allInstalled = [];
    const seenIds = new Set();

    weekIds.forEach(weekId => {
      const weekPlays = getInstalledPlaysForWeek(plays, weeks, weekId);
      weekPlays.forEach(play => {
        if (!seenIds.has(play.id)) {
          seenIds.add(play.id);
          allInstalled.push(play);
        }
      });
    });

    return allInstalled;
  }, [plays, weeks, weekIds]);

  // Get practice grading sessions for selected weeks
  const weekSessions = useMemo(() => {
    if (!practiceGrades || !weekIds) return [];
    return practiceGrades
      .filter(g => weekIds.includes(g.weekId))
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [practiceGrades, weekIds]);

  // Add history to installed plays
  const playsWithHistory = useMemo(() => {
    return installedPlays.map(play => ({
      ...play,
      history: computePlayHistory(play.id, practiceGrades, [], weekIds)
    }));
  }, [installedPlays, practiceGrades, weekIds]);

  // Apply filters
  const filteredPlays = useMemo(() => {
    return applyPlayFilters(playsWithHistory, filters, setupConfig);
  }, [playsWithHistory, filters, setupConfig]);

  // Calculate summary stats
  const qcDefs = setupConfig?.qualityControlDefinitions || {};
  const minimumVolume = qcDefs.minimumVolume || { practice: 3, game: 2 };

  const summary = useMemo(() => {
    return calculateGradingSummary(filteredPlays, 'practice', minimumVolume);
  }, [filteredPlays, minimumVolume]);

  // Trend data for multi-week view
  const trendData = useMemo(() => {
    if (weekIds.length <= 1) return [];

    return weekIds.map(weekId => {
      const week = weeks?.find(w => w.id === weekId);
      const weekSessions = practiceGrades?.filter(g => g.weekId === weekId) || [];

      let totalReps = 0;
      let efficientReps = 0;
      let explosiveReps = 0;

      weekSessions.forEach(session => {
        (session.grades || []).forEach(g => {
          totalReps += g.reps || 0;
          efficientReps += g.efficientReps || 0;
          explosiveReps += g.explosiveReps || 0;
        });
      });

      return {
        name: week?.name?.replace(/Week\s*/i, 'W') || weekId,
        efficiency: totalReps > 0 ? ((efficientReps / totalReps) * 100).toFixed(1) : 0,
        explosive: totalReps > 0 ? ((explosiveReps / totalReps) * 100).toFixed(1) : 0,
        reps: totalReps
      };
    });
  }, [weekIds, weeks, practiceGrades]);

  // Handle opening grading modal
  const handleAddGrades = () => {
    setSelectedSession(null);
    setShowGradingModal(true);
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setShowGradingModal(true);
  };

  if (installedPlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Activity size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">No Installed Plays</h3>
        <p className="text-sm text-slate-500">
          Install plays for this week to track practice performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {weekSessions.length} grading session{weekSessions.length !== 1 ? 's' : ''} recorded
        </div>
        <button
          onClick={handleAddGrades}
          className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
        >
          <Plus size={16} />
          Add Practice Grades
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Reps"
          value={summary.totalVolume}
          icon={Activity}
          color="sky"
        />
        <StatCard
          label="Plays Graded"
          value={`${summary.graded}/${summary.totalPlays}`}
          icon={CheckCircle}
          color={summary.graded === summary.totalPlays ? 'emerald' : 'slate'}
        />
        <StatCard
          label="Efficiency Rate"
          value={summary.meanEfficiency ? `${summary.meanEfficiency}%` : '-'}
          icon={summary.meanEfficiency && parseFloat(summary.meanEfficiency) >= 50 ? TrendingUp : TrendingDown}
          color={summary.meanEfficiency && parseFloat(summary.meanEfficiency) >= 50 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Explosive Rate"
          value={summary.meanExplosive ? `${summary.meanExplosive}%` : '-'}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Trend Chart (multi-week) */}
      {trendData.length > 1 && (
        <ChartCard title="Weekly Trends">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e' }}
                name="Efficiency %"
              />
              <Line
                type="monotone"
                dataKey="explosive"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
                name="Explosive %"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              Efficiency
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-500"></span>
              Explosive
            </span>
          </div>
        </ChartCard>
      )}

      {/* Top Performers */}
      {summary.topPerformers.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Top Performers</span>
          </div>
          <div className="space-y-2">
            {summary.topPerformers.map((play, idx) => (
              <div
                key={play.id}
                className="flex items-center justify-between py-1 border-b border-emerald-500/20 last:border-0"
              >
                <span className="text-sm text-emerald-100">
                  {play.name || play.callText || play.id}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{play.volume} reps</span>
                  <span className="text-emerald-400">{play.efficiencyRate}% eff</span>
                  <span className="text-purple-400">{play.explosiveRate}% exp</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Work */}
      {summary.needsWork.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Needs Work</span>
          </div>
          <div className="space-y-2">
            {summary.needsWork.map((play, idx) => (
              <div
                key={play.id}
                className="flex items-center justify-between py-1 border-b border-amber-500/20 last:border-0"
              >
                <span className="text-sm text-amber-100">
                  {play.name || play.callText || play.id}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{play.volume} reps</span>
                  <span className="text-amber-400">{play.efficiencyRate}% eff</span>
                  <span className="text-purple-400">{play.explosiveRate}% exp</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insufficient Data */}
      {summary.insufficientData.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              Insufficient Data ({summary.insufficientData.length} plays)
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            These plays need more reps for meaningful analysis (min: {minimumVolume.practice})
          </p>
          <div className="flex flex-wrap gap-1">
            {summary.insufficientData.slice(0, 8).map(({ play, volume, needed }) => (
              <span
                key={play.id}
                className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
                title={`${volume} reps, needs ${needed} more`}
              >
                {play.name || play.callText || play.id}
                <span className="text-slate-500 ml-1">({volume}/{minimumVolume.practice})</span>
              </span>
            ))}
            {summary.insufficientData.length > 8 && (
              <span className="px-2 py-0.5 text-slate-500 text-xs">
                +{summary.insufficientData.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grading Sessions */}
      {weekSessions.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-sky-400" />
            <h3 className="text-sm font-medium text-white">Grading Sessions</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {weekSessions.map(session => {
              const week = weeks?.find(w => w.id === session.weekId);
              const totalReps = (session.grades || []).reduce((sum, g) => sum + (g.reps || 0), 0);
              const efficientReps = (session.grades || []).reduce((sum, g) => sum + (g.efficientReps || 0), 0);

              return (
                <div
                  key={session.id}
                  className="p-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => handleEditSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-white">
                        {session.dayLabel || 'Practice'}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {session.date || week?.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {(session.grades || []).length} plays | {totalReps} reps |{' '}
                      <span className={totalReps > 0 && (efficientReps / totalReps) >= 0.5 ? 'text-emerald-400' : 'text-amber-400'}>
                        {totalReps > 0 ? ((efficientReps / totalReps) * 100).toFixed(0) : 0}% eff
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Plays Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">All Plays ({filteredPlays.length})</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Play</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Reps</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Efficient</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Explosive</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Eff %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPlays.map(play => {
                const history = play.history?.practice;
                const hasData = history?.totalReps > 0;
                const effRate = history?.efficiencyRate;

                return (
                  <tr key={play.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-white">
                      {play.name || play.callText || play.id}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {history?.totalReps || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400">
                      {history?.efficientReps || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-purple-400">
                      {history?.explosiveReps || 0}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {hasData ? (
                        <span className={
                          parseFloat(effRate) >= 50 ? 'text-emerald-400' : 'text-amber-400'
                        }>
                          {effRate}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {showGradingModal && (
        <GradingModal
          type="practice"
          weekId={weekIds[0]}
          currentWeek={currentWeek}
          plays={installedPlays}
          session={selectedSession}
          setupConfig={setupConfig}
          onClose={() => setShowGradingModal(false)}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color = 'slate' }) {
  const colorClasses = {
    sky: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    slate: 'bg-slate-700/50 border-slate-600 text-slate-300'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <Icon size={14} />
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, children }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h4 className="text-sm font-medium text-white mb-3">{title}</h4>
      {children}
    </div>
  );
}
