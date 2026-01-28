import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Trophy,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';
import {
  getGamePlanPlaysForWeek,
  computePlayHistory,
  calculateGradingSummary,
  bucketCounts,
  applyPlayFilters
} from '../../../utils/qcAnalysis';
import GradingModal from './GradingModal';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PostGameAudit({
  plays,
  weeks,
  gamePlans,
  setupConfig,
  practiceGrades,
  gameGrades,
  weekIds,
  currentWeek,
  filters,
  expanded
}) {
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Get game plan plays for selected weeks
  const gamePlanPlays = useMemo(() => {
    if (!weekIds || weekIds.length === 0) return [];

    const allPlays = [];
    const seenIds = new Set();

    weekIds.forEach(weekId => {
      const gpData = getGamePlanPlaysForWeek(plays, gamePlans, weekId);
      gpData.all.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          allPlays.push(p);
        }
      });
    });

    return allPlays;
  }, [plays, gamePlans, weekIds]);

  // Get game grading sessions for selected weeks
  const weekSessions = useMemo(() => {
    if (!gameGrades || !weekIds) return [];
    return gameGrades
      .filter(g => weekIds.includes(g.weekId))
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [gameGrades, weekIds]);

  // Add history to plays
  const playsWithHistory = useMemo(() => {
    return gamePlanPlays.map(play => ({
      ...play,
      history: computePlayHistory(play.id, practiceGrades, gameGrades, weekIds)
    }));
  }, [gamePlanPlays, practiceGrades, gameGrades, weekIds]);

  // Apply filters
  const filteredPlays = useMemo(() => {
    return applyPlayFilters(playsWithHistory, filters, setupConfig);
  }, [playsWithHistory, filters, setupConfig]);

  // Calculate summary stats
  const qcDefs = setupConfig?.qualityControlDefinitions || {};
  const minimumVolume = qcDefs.minimumVolume || { practice: 3, game: 2 };

  const gameSummary = useMemo(() => {
    return calculateGradingSummary(filteredPlays, 'game', minimumVolume);
  }, [filteredPlays, minimumVolume]);

  const practiceSummary = useMemo(() => {
    return calculateGradingSummary(filteredPlays, 'practice', minimumVolume);
  }, [filteredPlays, minimumVolume]);

  // Get setup data
  const playBuckets = (setupConfig?.playBuckets || []).filter(b => b.phase === 'OFFENSE');
  const playPurposes = setupConfig?.qualityControlDefinitions?.playPurposes || [];
  const fieldZones = setupConfig?.fieldZones || [];

  // Efficiency by bucket
  const bucketEfficiency = useMemo(() => {
    const results = [];

    playBuckets.forEach(bucket => {
      const bucketPlays = filteredPlays.filter(p => p.bucketId === bucket.id);
      let totalCalls = 0;
      let efficientCalls = 0;
      let explosiveCalls = 0;

      bucketPlays.forEach(p => {
        totalCalls += p.history?.game?.totalCalls || 0;
        efficientCalls += p.history?.game?.efficientCalls || 0;
        explosiveCalls += p.history?.game?.explosiveCalls || 0;
      });

      if (totalCalls >= minimumVolume.game) {
        results.push({
          name: bucket.name,
          efficiency: ((efficientCalls / totalCalls) * 100).toFixed(1),
          explosive: ((explosiveCalls / totalCalls) * 100).toFixed(1),
          calls: totalCalls,
          fill: bucket.color || '#6b7280'
        });
      }
    });

    return results;
  }, [filteredPlays, playBuckets, minimumVolume]);

  // Efficiency by field zone
  const zoneEfficiency = useMemo(() => {
    const results = [];

    fieldZones.forEach(zone => {
      const zoneId = zone.id || zone;
      const zonePlays = filteredPlays.filter(p =>
        (p.fieldZones || []).includes(zoneId)
      );

      let totalCalls = 0;
      let efficientCalls = 0;

      zonePlays.forEach(p => {
        totalCalls += p.history?.game?.totalCalls || 0;
        efficientCalls += p.history?.game?.efficientCalls || 0;
      });

      if (totalCalls >= minimumVolume.game) {
        results.push({
          name: zone.name || zoneId,
          efficiency: ((efficientCalls / totalCalls) * 100).toFixed(1),
          calls: totalCalls
        });
      }
    });

    return results;
  }, [filteredPlays, fieldZones, minimumVolume]);

  // Practice vs Game comparison
  const practiceVsGame = useMemo(() => {
    return filteredPlays
      .filter(p =>
        p.history?.practice?.totalReps >= minimumVolume.practice &&
        p.history?.game?.totalCalls >= minimumVolume.game
      )
      .map(p => ({
        name: p.name || p.callText || p.id,
        practiceEff: parseFloat(p.history.practice.efficiencyRate) || 0,
        gameEff: parseFloat(p.history.game.efficiencyRate) || 0,
        gameCalls: p.history.game.totalCalls
      }));
  }, [filteredPlays, minimumVolume]);

  // Week-over-week trend
  const weeklyTrend = useMemo(() => {
    if (weekIds.length <= 1) return [];

    return weekIds.map(weekId => {
      const week = weeks?.find(w => w.id === weekId);
      const weekSession = gameGrades?.filter(g => g.weekId === weekId) || [];

      let totalCalls = 0;
      let efficientCalls = 0;
      let explosiveCalls = 0;

      weekSession.forEach(session => {
        (session.grades || []).forEach(g => {
          totalCalls += g.calls || 0;
          efficientCalls += g.efficientCalls || 0;
          explosiveCalls += g.explosiveCalls || 0;
        });
      });

      return {
        name: week?.name?.replace(/Week\s*/i, 'W') || weekId,
        opponent: week?.opponent || '',
        efficiency: totalCalls > 0 ? ((efficientCalls / totalCalls) * 100).toFixed(1) : 0,
        explosive: totalCalls > 0 ? ((explosiveCalls / totalCalls) * 100).toFixed(1) : 0,
        calls: totalCalls
      };
    });
  }, [weekIds, weeks, gameGrades]);

  // Handle opening grading modal
  const handleAddGrades = () => {
    setSelectedSession(null);
    setShowGradingModal(true);
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setShowGradingModal(true);
  };

  if (gamePlanPlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Trophy size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">No Game Plan</h3>
        <p className="text-sm text-slate-500">
          Build a game plan first to track post-game performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {weekSessions.length} game{weekSessions.length !== 1 ? 's' : ''} graded
        </div>
        <button
          onClick={handleAddGrades}
          className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
        >
          <Plus size={16} />
          Add Game Grades
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Calls"
          value={gameSummary.totalVolume}
          icon={Trophy}
          color="sky"
        />
        <StatCard
          label="Plays Graded"
          value={`${gameSummary.graded}/${gameSummary.totalPlays}`}
          icon={CheckCircle}
          color={gameSummary.graded === gameSummary.totalPlays ? 'emerald' : 'slate'}
        />
        <StatCard
          label="Game Efficiency"
          value={gameSummary.meanEfficiency ? `${gameSummary.meanEfficiency}%` : '-'}
          icon={gameSummary.meanEfficiency && parseFloat(gameSummary.meanEfficiency) >= 50 ? TrendingUp : TrendingDown}
          color={gameSummary.meanEfficiency && parseFloat(gameSummary.meanEfficiency) >= 50 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Explosive Rate"
          value={gameSummary.meanExplosive ? `${gameSummary.meanExplosive}%` : '-'}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Practice vs Game Comparison */}
      {practiceSummary.meanEfficiency && gameSummary.meanEfficiency && (
        <div className={`grid ${expanded ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-white mb-4">Practice vs Game</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Practice Efficiency</div>
                <div className={`text-2xl font-bold ${
                  parseFloat(practiceSummary.meanEfficiency) >= 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {practiceSummary.meanEfficiency}%
                </div>
                <div className="text-xs text-slate-500">{practiceSummary.totalVolume} reps</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Game Efficiency</div>
                <div className={`text-2xl font-bold ${
                  parseFloat(gameSummary.meanEfficiency) >= 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {gameSummary.meanEfficiency}%
                </div>
                <div className="text-xs text-slate-500">{gameSummary.totalVolume} calls</div>
              </div>
            </div>
            {/* Difference indicator */}
            <div className="mt-3 pt-3 border-t border-slate-700 text-center">
              {(() => {
                const diff = parseFloat(gameSummary.meanEfficiency) - parseFloat(practiceSummary.meanEfficiency);
                const isPositive = diff >= 0;
                return (
                  <span className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{diff.toFixed(1)}% in games
                    {isPositive
                      ? ' (performing better than practice)'
                      : ' (below practice level)'}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Scatter plot of practice vs game efficiency */}
          {practiceVsGame.length > 0 && (
            <ChartCard title="Play-by-Play Comparison">
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <XAxis
                    type="number"
                    dataKey="practiceEff"
                    name="Practice"
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Practice %', position: 'bottom', fontSize: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="gameEff"
                    name="Game"
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Game %', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <ZAxis type="number" dataKey="gameCalls" range={[50, 200]} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-slate-600 rounded p-2 text-xs">
                          <div className="text-white font-medium">{data.name}</div>
                          <div className="text-slate-400">Practice: {data.practiceEff}%</div>
                          <div className="text-slate-400">Game: {data.gameEff}%</div>
                          <div className="text-slate-500">{data.gameCalls} calls</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={practiceVsGame} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Weekly Trend */}
      {weeklyTrend.length > 1 && (
        <ChartCard title="Weekly Trend">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyTrend}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-800 border border-slate-600 rounded p-2 text-xs">
                      <div className="text-white font-medium">{label} {data.opponent && `vs ${data.opponent}`}</div>
                      <div className="text-emerald-400">Efficiency: {data.efficiency}%</div>
                      <div className="text-purple-400">Explosive: {data.explosive}%</div>
                      <div className="text-slate-500">{data.calls} calls</div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e' }}
              />
              <Line
                type="monotone"
                dataKey="explosive"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Efficiency by Bucket */}
      {bucketEfficiency.length > 0 && (
        <ChartCard title="Efficiency by Bucket">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bucketEfficiency}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="efficiency" name="Efficiency %" radius={[4, 4, 0, 0]}>
                {bucketEfficiency.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Efficiency by Field Zone */}
      {zoneEfficiency.length > 0 && (
        <ChartCard title="Efficiency by Field Zone">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={zoneEfficiency} layout="vertical">
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Top/Bottom Performers */}
      <div className={`grid ${expanded ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {gameSummary.topPerformers.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Best Plays</span>
            </div>
            <div className="space-y-2">
              {gameSummary.topPerformers.map(play => (
                <div
                  key={play.id}
                  className="flex items-center justify-between py-1 border-b border-emerald-500/20 last:border-0"
                >
                  <span className="text-sm text-emerald-100 truncate max-w-[150px]">
                    {play.name || play.callText || play.id}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{play.volume}</span>
                    <span className="text-emerald-400">{play.efficiencyRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameSummary.needsWork.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Struggled</span>
            </div>
            <div className="space-y-2">
              {gameSummary.needsWork.map(play => (
                <div
                  key={play.id}
                  className="flex items-center justify-between py-1 border-b border-amber-500/20 last:border-0"
                >
                  <span className="text-sm text-amber-100 truncate max-w-[150px]">
                    {play.name || play.callText || play.id}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{play.volume}</span>
                    <span className="text-amber-400">{play.efficiencyRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Calls</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Efficient</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Explosive</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Eff %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPlays.map(play => {
                const history = play.history?.game;
                const hasData = history?.totalCalls > 0;
                const effRate = history?.efficiencyRate;

                return (
                  <tr key={play.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-white">
                      {play.name || play.callText || play.id}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {history?.totalCalls || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400">
                      {history?.efficientCalls || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-purple-400">
                      {history?.explosiveCalls || 0}
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
          type="game"
          weekId={weekIds[0]}
          currentWeek={currentWeek}
          plays={gamePlanPlays}
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
