import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { AlertTriangle, CheckCircle, Layers, Info } from 'lucide-react';
import {
  getInstalledPlaysForWeek,
  bucketCounts,
  findCoverageGaps,
  analyzeBalance,
  applyPlayFilters,
  computePlayHistory,
  generateChartData
} from '../../../utils/qcAnalysis';

// Default colors for charts
const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function InstallAudit({
  plays,
  playsArray,
  weeks,
  setupConfig,
  practiceGrades,
  gameGrades,
  weekIds,
  filters,
  expanded
}) {
  // Get installed plays for selected weeks
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

  // Apply filters
  const filteredPlays = useMemo(() => {
    return applyPlayFilters(installedPlays, filters, setupConfig);
  }, [installedPlays, filters, setupConfig]);

  // Add history data to plays if grading data exists
  const playsWithHistory = useMemo(() => {
    return filteredPlays.map(play => ({
      ...play,
      history: computePlayHistory(play.id, practiceGrades, gameGrades, weekIds)
    }));
  }, [filteredPlays, practiceGrades, gameGrades, weekIds]);

  // Get QC definitions
  const qcDefs = setupConfig?.qualityControlDefinitions || {};
  const playPurposes = qcDefs.playPurposes || [];
  const fieldZones = setupConfig?.fieldZones || [];
  const downDistanceCategories = setupConfig?.downDistanceCategories || [];
  const specialSituations = setupConfig?.specialSituations || [];
  const playBuckets = (setupConfig?.playBuckets || []).filter(b => b.phase === 'OFFENSE');

  // Distribution by purpose
  const purposeDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'playPurpose');
    const colorMap = Object.fromEntries(playPurposes.map(p => [p.id, p.color]));
    const nameMap = Object.fromEntries(playPurposes.map(p => [p.id, p.name]));

    return generateChartData(counts, playPurposes.map(p => p.id), colorMap).map(d => ({
      ...d,
      name: nameMap[d.name] || d.name
    }));
  }, [filteredPlays, playPurposes]);

  // Distribution by bucket
  const bucketDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'bucketId');
    const colorMap = Object.fromEntries(playBuckets.map(b => [b.id, b.color ? `#${b.color.replace('#', '')}` : '#6b7280']));
    const nameMap = Object.fromEntries(playBuckets.map(b => [b.id, b.name]));

    return Object.entries(counts).map(([key, value]) => ({
      name: nameMap[key] || key,
      value,
      fill: colorMap[key] || '#6b7280'
    }));
  }, [filteredPlays, playBuckets]);

  // Distribution by field zone
  const zoneDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'fieldZones');
    return fieldZones.map(zone => ({
      name: zone.name || zone.id || zone,
      value: counts[zone.id || zone] || 0,
      fill: zone.color || '#6b7280'
    }));
  }, [filteredPlays, fieldZones]);

  // Distribution by down/distance
  const downDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'downDistances');
    return downDistanceCategories.map(dd => ({
      name: dd.name || dd.id || dd,
      value: counts[dd.id || dd] || 0,
      fill: dd.color || '#6b7280'
    }));
  }, [filteredPlays, downDistanceCategories]);

  // Find gaps in coverage
  const gaps = useMemo(() => {
    const zoneIds = fieldZones.map(z => z.id || z);
    const downIds = downDistanceCategories.map(d => d.id || d);
    const sitIds = specialSituations.map(s => s.id || s);
    return findCoverageGaps(filteredPlays, zoneIds, downIds, sitIds);
  }, [filteredPlays, fieldZones, downDistanceCategories, specialSituations]);

  // Balance analysis by bucket
  const bucketBalance = useMemo(() => {
    return analyzeBalance(filteredPlays, 'bucketId', 50);
  }, [filteredPlays]);

  // Stats cards data
  const stats = useMemo(() => {
    const hasGradingData = playsWithHistory.some(
      p => p.history?.practice?.totalReps > 0 || p.history?.game?.totalCalls > 0
    );

    let avgEfficiency = null;
    let avgExplosive = null;

    if (hasGradingData) {
      let totalReps = 0;
      let totalEfficient = 0;
      let totalExplosive = 0;

      playsWithHistory.forEach(p => {
        totalReps += p.history?.practice?.totalReps || 0;
        totalEfficient += p.history?.practice?.efficientReps || 0;
        totalExplosive += p.history?.practice?.explosiveReps || 0;
      });

      if (totalReps > 0) {
        avgEfficiency = ((totalEfficient / totalReps) * 100).toFixed(1);
        avgExplosive = ((totalExplosive / totalReps) * 100).toFixed(1);
      }
    }

    return {
      totalPlays: filteredPlays.length,
      byPurpose: purposeDistribution.reduce((acc, d) => {
        acc[d.name] = d.value;
        return acc;
      }, {}),
      gapCount: gaps.fieldZones.length + gaps.downDistances.length + gaps.crossGaps.length,
      hasGradingData,
      avgEfficiency,
      avgExplosive
    };
  }, [filteredPlays, purposeDistribution, gaps, playsWithHistory]);

  if (installedPlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Layers size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">No Installed Plays</h3>
        <p className="text-sm text-slate-500">
          No plays have been installed for the selected week(s).
          Use the Install Manager to add plays.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Installed"
          value={stats.totalPlays}
          icon={Layers}
          color="sky"
        />
        <StatCard
          label="Coverage Gaps"
          value={stats.gapCount}
          icon={stats.gapCount > 0 ? AlertTriangle : CheckCircle}
          color={stats.gapCount > 0 ? 'amber' : 'emerald'}
        />
        {stats.avgEfficiency && (
          <StatCard
            label="Avg Efficiency"
            value={`${stats.avgEfficiency}%`}
            icon={CheckCircle}
            color="emerald"
          />
        )}
        {stats.avgExplosive && (
          <StatCard
            label="Avg Explosive"
            value={`${stats.avgExplosive}%`}
            icon={CheckCircle}
            color="purple"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className={`grid ${expanded ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Purpose Distribution */}
        {purposeDistribution.length > 0 && purposeDistribution.some(d => d.value > 0) && (
          <ChartCard title="By Play Purpose">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={purposeDistribution.filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {purposeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Bucket Distribution */}
        {bucketDistribution.length > 0 && (
          <ChartCard title="By Play Bucket">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bucketDistribution} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {bucketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Field Zone Distribution */}
        {zoneDistribution.length > 0 && zoneDistribution.some(d => d.value > 0) && (
          <ChartCard title="By Field Zone">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={zoneDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {zoneDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Down/Distance Distribution */}
        {downDistribution.length > 0 && downDistribution.some(d => d.value > 0) && (
          <ChartCard title="By Down & Distance">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={downDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Balance Warnings */}
      {bucketBalance.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Balance Warning</span>
          </div>
          <ul className="text-sm text-amber-200/80 space-y-1">
            {bucketBalance.warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Coverage Gaps */}
      {(gaps.fieldZones.length > 0 || gaps.downDistances.length > 0 || gaps.crossGaps.length > 0) && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-white">Coverage Gaps</span>
          </div>

          <div className="space-y-3 text-sm">
            {gaps.fieldZones.length > 0 && (
              <div>
                <span className="text-slate-400">Missing Field Zones: </span>
                <span className="text-amber-300">
                  {gaps.fieldZones.map(z => {
                    const zone = fieldZones.find(fz => (fz.id || fz) === z);
                    return zone?.name || z;
                  }).join(', ')}
                </span>
              </div>
            )}

            {gaps.downDistances.length > 0 && (
              <div>
                <span className="text-slate-400">Missing Down/Distance: </span>
                <span className="text-amber-300">
                  {gaps.downDistances.map(d => {
                    const dd = downDistanceCategories.find(cat => (cat.id || cat) === d);
                    return dd?.name || d;
                  }).join(', ')}
                </span>
              </div>
            )}

            {gaps.crossGaps.length > 0 && gaps.crossGaps.length <= 10 && (
              <div>
                <span className="text-slate-400">Missing Combinations: </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {gaps.crossGaps.map((g, i) => {
                    const zoneName = fieldZones.find(z => (z.id || z) === g.zone)?.name || g.zone;
                    const downName = downDistanceCategories.find(d => (d.id || d) === g.down)?.name || g.down;
                    return (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs"
                      >
                        {zoneName} + {downName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {gaps.crossGaps.length > 10 && (
              <div className="text-amber-300">
                {gaps.crossGaps.length} zone/down combinations have no plays
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plays Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">Installed Plays ({filteredPlays.length})</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Play</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Purpose</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Bucket</th>
                {stats.hasGradingData && (
                  <>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Reps</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Eff%</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {playsWithHistory.map(play => {
                const purpose = playPurposes.find(p => p.id === play.playPurpose);
                const bucket = playBuckets.find(b => b.id === play.bucketId);

                return (
                  <tr key={play.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-white">{play.name || play.callText || play.id}</td>
                    <td className="px-3 py-2">
                      {purpose && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: `${purpose.color}30`, color: purpose.color }}
                        >
                          {purpose.name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{bucket?.name || play.bucketId || '-'}</td>
                    {stats.hasGradingData && (
                      <>
                        <td className="px-3 py-2 text-right text-slate-300">
                          {play.history?.practice?.totalReps || '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {play.history?.practice?.efficiencyRate ? (
                            <span className={
                              parseFloat(play.history.practice.efficiencyRate) >= 50
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }>
                              {play.history.practice.efficiencyRate}%
                            </span>
                          ) : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
