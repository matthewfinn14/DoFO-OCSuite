import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AlertTriangle, CheckCircle, FileText, Calendar, Layers } from 'lucide-react';
import {
  getInstalledPlaysForWeek,
  getScriptedPlaysForWeek,
  compareInstalledVsScripted,
  bucketCounts,
  applyPlayFilters
} from '../../../utils/qcAnalysis';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function PracticeScriptAudit({
  plays,
  weeks,
  setupConfig,
  weekIds,
  filters,
  expanded
}) {
  // Get current week data
  const weekData = useMemo(() => {
    if (!weekIds || weekIds.length === 0) return null;

    // For single week, get detailed breakdown
    if (weekIds.length === 1) {
      const weekId = weekIds[0];
      const week = weeks?.find(w => w.id === weekId);
      const installedPlays = getInstalledPlaysForWeek(plays, weeks, weekId);
      const scripted = getScriptedPlaysForWeek(plays, weeks, weekId);

      return {
        week,
        installedPlays,
        scriptedPlays: scripted.all,
        byDay: scripted.byDay,
        bySegment: scripted.bySegment,
        comparison: compareInstalledVsScripted(installedPlays, scripted.all)
      };
    }

    // For multiple weeks, aggregate
    const allInstalled = [];
    const allScripted = [];
    const seenInstalledIds = new Set();
    const seenScriptedIds = new Set();

    weekIds.forEach(weekId => {
      const installed = getInstalledPlaysForWeek(plays, weeks, weekId);
      installed.forEach(p => {
        if (!seenInstalledIds.has(p.id)) {
          seenInstalledIds.add(p.id);
          allInstalled.push(p);
        }
      });

      const scripted = getScriptedPlaysForWeek(plays, weeks, weekId);
      scripted.all.forEach(p => {
        if (!seenScriptedIds.has(p.id)) {
          seenScriptedIds.add(p.id);
          allScripted.push(p);
        }
      });
    });

    return {
      week: null,
      installedPlays: allInstalled,
      scriptedPlays: allScripted,
      byDay: {},
      bySegment: {},
      comparison: compareInstalledVsScripted(allInstalled, allScripted)
    };
  }, [plays, weeks, weekIds]);

  // Apply filters to missing plays
  const filteredMissing = useMemo(() => {
    if (!weekData?.comparison?.missingFromScript) return [];
    return applyPlayFilters(weekData.comparison.missingFromScript, filters, setupConfig);
  }, [weekData, filters, setupConfig]);

  // Get practice days from week
  const practiceDays = useMemo(() => {
    if (!weekData?.week?.practicePlans) return [];
    return weekData.week.practicePlans.map(plan => ({
      name: plan.name || plan.date,
      date: plan.date,
      uniquePlays: weekData.byDay[plan.date || plan.name]?.length || 0,
      segments: (plan.segments || []).map(seg => ({
        name: seg.name,
        type: seg.type,
        focus: seg.focus,
        playCount: weekData.bySegment[seg.id || seg.name]?.length || 0
      }))
    }));
  }, [weekData]);

  // Coverage by bucket
  const bucketCoverage = useMemo(() => {
    if (!weekData) return [];

    const playBuckets = (setupConfig?.playBuckets || []).filter(b => b.phase === 'OFFENSE');
    const installedCounts = bucketCounts(weekData.installedPlays, 'bucketId');
    const scriptedCounts = bucketCounts(weekData.scriptedPlays, 'bucketId');

    return playBuckets.map(bucket => ({
      name: bucket.name,
      installed: installedCounts[bucket.id] || 0,
      scripted: scriptedCounts[bucket.id] || 0,
      fill: bucket.color || '#6b7280'
    }));
  }, [weekData, setupConfig]);

  // Coverage by purpose
  const purposeCoverage = useMemo(() => {
    if (!weekData) return [];

    const playPurposes = setupConfig?.qualityControlDefinitions?.playPurposes || [];
    const installedCounts = bucketCounts(weekData.installedPlays, 'playPurpose');
    const scriptedCounts = bucketCounts(weekData.scriptedPlays, 'playPurpose');

    return playPurposes.map(purpose => ({
      name: purpose.name,
      installed: installedCounts[purpose.id] || 0,
      scripted: scriptedCounts[purpose.id] || 0,
      fill: purpose.color
    }));
  }, [weekData, setupConfig]);

  if (!weekData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <FileText size={48} className="text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">Select a Week</h3>
        <p className="text-sm text-slate-500">
          Choose a week to analyze practice script coverage.
        </p>
      </div>
    );
  }

  const { comparison } = weekData;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Installed Plays"
          value={comparison.installed}
          icon={Layers}
          color="sky"
        />
        <StatCard
          label="Scripted Plays"
          value={comparison.scripted}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          label="Coverage Rate"
          value={`${comparison.coverageRate}%`}
          icon={parseFloat(comparison.coverageRate) >= 80 ? CheckCircle : AlertTriangle}
          color={parseFloat(comparison.coverageRate) >= 80 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Missing from Script"
          value={comparison.missingFromScript.length}
          icon={comparison.missingFromScript.length > 0 ? AlertTriangle : CheckCircle}
          color={comparison.missingFromScript.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Coverage Charts */}
      <div className={`grid ${expanded ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Bucket Coverage */}
        {bucketCoverage.length > 0 && (
          <ChartCard title="Coverage by Bucket">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bucketCoverage} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="installed" fill="#3b82f6" name="Installed" />
                <Bar dataKey="scripted" fill="#22c55e" name="Scripted" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500"></span>
                Installed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span>
                Scripted
              </span>
            </div>
          </ChartCard>
        )}

        {/* Purpose Coverage */}
        {purposeCoverage.length > 0 && purposeCoverage.some(p => p.installed > 0) && (
          <ChartCard title="Coverage by Purpose">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={purposeCoverage}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="installed" fill="#3b82f6" name="Installed" />
                <Bar dataKey="scripted" fill="#22c55e" name="Scripted" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Practice Days Breakdown */}
      {practiceDays.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-sky-400" />
            <h3 className="text-sm font-medium text-white">Practice Days</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {practiceDays.map((day, idx) => (
              <div key={idx} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{day.name}</span>
                  <span className="text-sm text-slate-400">
                    {day.uniquePlays} unique plays
                  </span>
                </div>
                {day.segments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {day.segments.map((seg, sidx) => (
                      <div
                        key={sidx}
                        className="px-2 py-1 bg-slate-700/50 rounded text-xs"
                      >
                        <span className="text-slate-300">{seg.name}</span>
                        {seg.focus && (
                          <span className="text-slate-500 ml-1">({seg.focus})</span>
                        )}
                        <span className="text-sky-400 ml-2">{seg.playCount} plays</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gap Warning */}
      {filteredMissing.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              Installed but Not Scripted ({filteredMissing.length} plays)
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-500/10 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-300">Play</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-300">Bucket</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-300">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/20">
                {filteredMissing.map(play => {
                  const bucket = setupConfig?.playBuckets?.find(b => b.id === play.bucketId);
                  const purpose = setupConfig?.qualityControlDefinitions?.playPurposes?.find(
                    p => p.id === play.playPurpose
                  );

                  return (
                    <tr key={play.id} className="hover:bg-amber-500/5">
                      <td className="px-3 py-2 text-amber-100">
                        {play.name || play.callText || play.id}
                      </td>
                      <td className="px-3 py-2 text-amber-200/70">
                        {bucket?.name || play.bucketId || '-'}
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
      )}

      {/* Extra Plays Warning */}
      {comparison.extraInScript.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              Scripted but Not Installed ({comparison.extraInScript.length} plays)
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            These plays are in your practice scripts but weren't marked as installed for this week.
          </p>
          <div className="flex flex-wrap gap-1">
            {comparison.extraInScript.slice(0, 10).map(play => (
              <span
                key={play.id}
                className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
              >
                {play.name || play.callText || play.id}
              </span>
            ))}
            {comparison.extraInScript.length > 10 && (
              <span className="px-2 py-0.5 text-slate-500 text-xs">
                +{comparison.extraInScript.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* All Good Message */}
      {comparison.missingFromScript.length === 0 && comparison.extraInScript.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle size={24} className="text-emerald-400" />
          <div>
            <div className="text-sm font-medium text-emerald-400">Full Coverage</div>
            <div className="text-xs text-emerald-300/70">
              All installed plays are scripted for practice.
            </div>
          </div>
        </div>
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
