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
  Cell
} from 'recharts';
import { Clipboard, AlertTriangle, CheckCircle, LayoutGrid, Layers } from 'lucide-react';
import {
  getGamePlanPlaysForWeek,
  bucketCounts,
  analyzeBalance,
  applyPlayFilters
} from '../../../utils/qcAnalysis';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function GameplanAudit({
  plays,
  gamePlans,
  setupConfig,
  weekIds,
  filters,
  expanded
}) {
  // Get game plan data for selected weeks
  const gamePlanData = useMemo(() => {
    if (!weekIds || weekIds.length === 0) return null;

    // For single week
    if (weekIds.length === 1) {
      const weekId = weekIds[0];
      const gpData = getGamePlanPlaysForWeek(plays, gamePlans, weekId);
      const gamePlan = gamePlans?.[weekId];

      return {
        plays: gpData.all,
        bySection: gpData.bySection,
        sections: gamePlan?.sections || []
      };
    }

    // For multiple weeks, aggregate
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

    return {
      plays: allPlays,
      bySection: {},
      sections: []
    };
  }, [plays, gamePlans, weekIds]);

  // Apply filters
  const filteredPlays = useMemo(() => {
    if (!gamePlanData) return [];
    return applyPlayFilters(gamePlanData.plays, filters, setupConfig);
  }, [gamePlanData, filters, setupConfig]);

  // Get setup data
  const playBuckets = (setupConfig?.playBuckets || []).filter(b => b.phase === 'OFFENSE');
  const playPurposes = setupConfig?.qualityControlDefinitions?.playPurposes || [];
  const fieldZones = setupConfig?.fieldZones || [];

  // Distribution by bucket
  const bucketDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'bucketId');
    return playBuckets.map(bucket => ({
      name: bucket.name,
      value: counts[bucket.id] || 0,
      fill: bucket.color || '#6b7280'
    }));
  }, [filteredPlays, playBuckets]);

  // Distribution by purpose
  const purposeDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'playPurpose');
    return playPurposes.map(purpose => ({
      name: purpose.name,
      value: counts[purpose.id] || 0,
      fill: purpose.color
    })).filter(d => d.value > 0);
  }, [filteredPlays, playPurposes]);

  // Distribution by formation
  const formationDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'formation');
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], idx) => ({
        name: name || '(none)',
        value,
        fill: CHART_COLORS[idx % CHART_COLORS.length]
      }));
  }, [filteredPlays]);

  // Distribution by concept group
  const conceptDistribution = useMemo(() => {
    const counts = bucketCounts(filteredPlays, 'conceptGroupId');
    const conceptGroups = setupConfig?.conceptGroups || [];

    return Object.entries(counts)
      .map(([id, value]) => {
        const concept = conceptGroups.find(c => c.id === id);
        return {
          name: concept?.name || id || '(none)',
          value,
          fill: concept?.color || '#6b7280'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredPlays, setupConfig]);

  // Balance analysis
  const bucketBalance = useMemo(() => {
    return analyzeBalance(filteredPlays, 'bucketId', 50);
  }, [filteredPlays]);

  const formationBalance = useMemo(() => {
    return analyzeBalance(filteredPlays, 'formation', 50);
  }, [filteredPlays]);

  // Section analysis
  const sectionAnalysis = useMemo(() => {
    if (!gamePlanData?.sections) return [];

    return gamePlanData.sections.map(section => {
      const sectionPlays = gamePlanData.bySection[section.id || section.name] || [];
      const bucketCts = bucketCounts(sectionPlays, 'bucketId');
      const formationCts = bucketCounts(sectionPlays, 'formation');

      // Get top formation
      const topFormation = Object.entries(formationCts)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        id: section.id,
        name: section.name,
        playCount: sectionPlays.length,
        bucketBreakdown: bucketCts,
        topFormation: topFormation ? topFormation[0] : null,
        topFormationCount: topFormation ? topFormation[1] : 0
      };
    });
  }, [gamePlanData]);

  if (!gamePlanData || filteredPlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Clipboard size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">No Game Plan</h3>
        <p className="text-sm text-slate-500">
          No game plan found for the selected week(s).
          Use the Game Plan/Call Sheet tool to build your call sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Plays"
          value={filteredPlays.length}
          icon={Clipboard}
          color="sky"
        />
        <StatCard
          label="Formations Used"
          value={Object.keys(bucketCounts(filteredPlays, 'formation')).length}
          icon={LayoutGrid}
          color="emerald"
        />
        <StatCard
          label="Sections"
          value={sectionAnalysis.length}
          icon={Layers}
          color="purple"
        />
        <StatCard
          label="Balance Issues"
          value={bucketBalance.warnings.length + formationBalance.warnings.length}
          icon={bucketBalance.isBalanced && formationBalance.isBalanced ? CheckCircle : AlertTriangle}
          color={bucketBalance.isBalanced && formationBalance.isBalanced ? 'emerald' : 'amber'}
        />
      </div>

      {/* Balance Warnings */}
      {(bucketBalance.warnings.length > 0 || formationBalance.warnings.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Balance Warnings</span>
          </div>
          <ul className="text-sm text-amber-200/80 space-y-1">
            {bucketBalance.warnings.map((w, i) => (
              <li key={`bucket-${i}`}>
                Bucket: {playBuckets.find(b => b.id === w.category)?.name || w.category} - {w.percentage}%
              </li>
            ))}
            {formationBalance.warnings.map((w, i) => (
              <li key={`form-${i}`}>
                Formation: {w.category} - {w.percentage}%
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts Row */}
      <div className={`grid ${expanded ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Bucket Distribution */}
        {bucketDistribution.some(d => d.value > 0) && (
          <ChartCard title="By Play Bucket">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={bucketDistribution.filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {bucketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Purpose Distribution */}
        {purposeDistribution.length > 0 && (
          <ChartCard title="By Play Purpose">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={purposeDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {purposeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Formation Distribution */}
        {formationDistribution.length > 0 && (
          <ChartCard title="Top Formations">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={formationDistribution} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {formationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Concept Distribution */}
        {conceptDistribution.length > 0 && (
          <ChartCard title="Top Concepts">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={conceptDistribution} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Section Breakdown */}
      {sectionAnalysis.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Layers size={16} className="text-sky-400" />
            <h3 className="text-sm font-medium text-white">Call Sheet Sections</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {sectionAnalysis.map(section => (
              <div key={section.id || section.name} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{section.name}</span>
                  <span className="text-sm text-slate-400">
                    {section.playCount} plays
                  </span>
                </div>

                {/* Bucket breakdown chips */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {playBuckets.map(bucket => {
                    const count = section.bucketBreakdown[bucket.id] || 0;
                    if (count === 0) return null;

                    return (
                      <span
                        key={bucket.id}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${bucket.color || '#6b7280'}30`,
                          color: bucket.color || '#9ca3af'
                        }}
                      >
                        {bucket.name}: {count}
                      </span>
                    );
                  })}
                </div>

                {/* Top formation */}
                {section.topFormation && (
                  <div className="text-xs text-slate-500">
                    Primary formation: <span className="text-slate-300">{section.topFormation}</span>
                    <span className="text-slate-600 ml-1">({section.topFormationCount} plays)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Plays Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">Game Plan Plays ({filteredPlays.length})</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Play</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Formation</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Bucket</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPlays.map(play => {
                const bucket = playBuckets.find(b => b.id === play.bucketId);
                const purpose = playPurposes.find(p => p.id === play.playPurpose);

                return (
                  <tr key={play.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-white">
                      {play.name || play.callText || play.id}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {play.formation || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {bucket && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: `${bucket.color || '#6b7280'}30`,
                            color: bucket.color || '#9ca3af'
                          }}
                        >
                          {bucket.name}
                        </span>
                      )}
                    </td>
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
