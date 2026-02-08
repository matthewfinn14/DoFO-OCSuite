import { useState, useMemo } from 'react';
import { usePracticeCoverage } from '../../hooks/usePracticeCoverage';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Target,
  Layers,
  ListChecks,
  Calendar,
  Lightbulb,
  BarChart3,
  HelpCircle,
  X,
  ArrowRight,
  ClipboardList,
  Star,
  Zap
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Summary card component for KPI display
 */
function SummaryCard({ label, value, subtext, color = 'sky', isLight }) {
  const colorClasses = {
    sky: isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    emerald: isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    purple: isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className={`text-xs uppercase tracking-wide mb-1 ${isLight ? 'opacity-70' : 'opacity-80'}`}>
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && (
        <div className={`text-xs mt-1 ${isLight ? 'opacity-60' : 'opacity-60'}`}>
          {subtext}
        </div>
      )}
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status, isLight }) {
  const configs = {
    met: {
      bg: isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400',
      icon: CheckCircle2,
      label: 'Met'
    },
    partial: {
      bg: isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400',
      icon: AlertTriangle,
      label: 'Partial'
    },
    unmet: {
      bg: isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400',
      icon: AlertTriangle,
      label: 'Unmet'
    },
    warning: {
      bg: isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400',
      icon: AlertTriangle,
      label: 'Warning'
    }
  };

  const config = configs[status] || configs.met;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

/**
 * Progress bar for bucket/quota visualization
 */
function ProgressBar({ value, max, color = '#3b82f6', showLabel = true, isLight }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium w-10 text-right ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
          {percentage}%
        </span>
      )}
    </div>
  );
}

/**
 * Bucket Balance Tab Content
 */
function BucketBalanceTab({ buckets, isLight }) {
  const totalReps = buckets.reduce((sum, b) => sum + b.reps, 0);

  return (
    <div className="space-y-4">
      {/* Visual Bar Chart */}
      <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
        <div className="flex items-end justify-around h-32 gap-2">
          {buckets.map(bucket => {
            const height = totalReps > 0 ? Math.max(8, (bucket.reps / totalReps) * 100) : 8;
            return (
              <div key={bucket.bucketId} className="flex flex-col items-center flex-1">
                <div className="text-xs font-medium mb-1" style={{ color: bucket.color }}>
                  {bucket.reps}
                </div>
                <div
                  className="w-full max-w-[40px] rounded-t transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    backgroundColor: bucket.color,
                    minHeight: '8px'
                  }}
                />
                <div className={`text-[10px] mt-2 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {bucket.label}
                </div>
                <div className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                  {bucket.percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Table */}
      <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800'}`}>
              <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Bucket</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Reps</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Target</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Delta</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map(bucket => (
              <tr key={bucket.bucketId} className={`border-b ${isLight ? 'border-gray-100' : 'border-slate-700/50'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: bucket.color }} />
                    <span className={isLight ? 'text-gray-900' : 'text-white'}>{bucket.label}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {bucket.reps}
                </td>
                <td className={`px-4 py-3 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {bucket.targetReps > 0 ? bucket.targetReps : '-'}
                </td>
                <td className={`px-4 py-3 text-center font-medium ${
                  bucket.delta >= 0
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                    : isLight ? 'text-red-600' : 'text-red-400'
                }`}>
                  {bucket.targetReps > 0 ? (bucket.delta >= 0 ? '+' : '') + bucket.delta : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {bucket.targetReps > 0 ? <StatusBadge status={bucket.status} isLight={isLight} /> : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Concepts Tab Content
 */
function ConceptsTab({ concepts, isLight }) {
  // Group by parent bucket
  const groupedConcepts = useMemo(() => {
    const groups = {};
    concepts.forEach(concept => {
      const key = concept.parentBucketId;
      if (!groups[key]) {
        groups[key] = {
          bucketId: key,
          bucketLabel: concept.parentBucketLabel,
          bucketColor: concept.parentBucketColor,
          concepts: []
        };
      }
      groups[key].concepts.push(concept);
    });
    return Object.values(groups);
  }, [concepts]);

  if (concepts.length === 0) {
    return (
      <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
        No concept data available. Scripts may not have plays assigned.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedConcepts.map(group => (
        <div key={group.bucketId} className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <div className={`px-4 py-2 flex items-center gap-2 ${isLight ? 'bg-gray-50 border-b border-gray-200' : 'bg-slate-700/50 border-b border-slate-700'}`}>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: group.bucketColor }} />
            <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{group.bucketLabel}</span>
          </div>
          <div className="p-4 space-y-3">
            {group.concepts.map(concept => (
              <div key={concept.conceptId} className="flex items-center gap-3">
                <span className={`flex-1 text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  {concept.conceptName}
                </span>
                <span className={`text-sm font-medium w-10 text-right ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {concept.reps}
                </span>
                <div className="w-32">
                  <ProgressBar
                    value={concept.percentageOfBucket}
                    max={100}
                    color={group.bucketColor}
                    isLight={isLight}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Call Sheet Plays Tab Content
 */
function CallSheetTab({ callSheetPlays, isLight }) {
  const [filter, setFilter] = useState('all');

  const filteredPlays = useMemo(() => {
    if (filter === 'all') return callSheetPlays;
    if (filter === 'unpracticed') return callSheetPlays.filter(p => p.reps === 0);
    if (filter === 'practiced') return callSheetPlays.filter(p => p.reps > 0);
    return callSheetPlays;
  }, [callSheetPlays, filter]);

  const counts = useMemo(() => ({
    all: callSheetPlays.length,
    unpracticed: callSheetPlays.filter(p => p.reps === 0).length,
    practiced: callSheetPlays.filter(p => p.reps > 0).length
  }), [callSheetPlays]);

  if (callSheetPlays.length === 0) {
    return (
      <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
        No plays on the call sheet yet. Add plays to your game plan boxes first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unpracticed', label: 'Unpracticed' },
          { key: 'practiced', label: 'Practiced' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? f.key === 'unpracticed'
                  ? isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                  : isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-400'
                : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800'}`}>
              <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Play</th>
              <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Box(es)</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Reps</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlays.map(play => (
              <tr key={play.playId} className={`border-b ${isLight ? 'border-gray-100' : 'border-slate-700/50'} ${play.reps === 0 ? (isLight ? 'bg-red-50/50' : 'bg-red-500/5') : ''}`}>
                <td className={`px-4 py-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {play.formation ? `${play.formation} ${play.playName}` : play.playName}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {play.boxes.map(box => (
                      <span
                        key={box.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${box.color}20`,
                          color: box.color,
                          border: `1px solid ${box.color}40`
                        }}
                      >
                        {box.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold ${
                    play.reps === 0
                      ? isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                      : isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {play.reps}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {counts.unpracticed > 0 && (
        <div className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
          {counts.unpracticed} play{counts.unpracticed !== 1 ? 's' : ''} on the call sheet ha{counts.unpracticed !== 1 ? 've' : 's'}n't been scripted yet.
        </div>
      )}
    </div>
  );
}

/**
 * Quality badge for execution rating
 */
function QualityBadge({ qualityStatus, avgRating, ratedReps, isLight }) {
  if (!qualityStatus || ratedReps === 0) {
    return <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>—</span>;
  }

  const configs = {
    'game-ready': {
      bg: isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400',
      label: 'Game Ready'
    },
    'solid': {
      bg: isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-400',
      label: 'Solid'
    },
    'needs-work': {
      bg: isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400',
      label: 'Needs Work'
    },
    'struggling': {
      bg: isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400',
      label: 'Struggling'
    }
  };

  const config = configs[qualityStatus] || configs['needs-work'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      <span className="text-amber-400">★</span>
      {avgRating?.toFixed(1)}
    </span>
  );
}

/**
 * Play Quotas Tab Content
 */
function QuotasTab({ quotas, isLight }) {
  const [filter, setFilter] = useState('all');

  const filteredQuotas = useMemo(() => {
    if (filter === 'all') return quotas;
    if (filter === 'struggling') return quotas.filter(q => q.qualityStatus === 'struggling' || q.qualityStatus === 'needs-work');
    if (filter === 'ready') return quotas.filter(q => q.qualityStatus === 'game-ready' || q.qualityStatus === 'solid');
    return quotas.filter(q => q.status === filter);
  }, [quotas, filter]);

  const counts = useMemo(() => ({
    all: quotas.length,
    unmet: quotas.filter(q => q.status === 'unmet').length,
    partial: quotas.filter(q => q.status === 'partial').length,
    met: quotas.filter(q => q.status === 'met').length,
    struggling: quotas.filter(q => q.qualityStatus === 'struggling' || q.qualityStatus === 'needs-work').length,
    ready: quotas.filter(q => q.qualityStatus === 'game-ready' || q.qualityStatus === 'solid').length
  }), [quotas]);

  if (quotas.length === 0) {
    return (
      <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
        No play quotas set. Add rep targets in Priority Plays.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'unmet', label: 'Unmet' },
          { key: 'partial', label: 'Partial' },
          { key: 'met', label: 'Met' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-400'
                : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
        <span className={`mx-1 ${isLight ? 'text-gray-300' : 'text-slate-600'}`}>|</span>
        {counts.struggling > 0 && (
          <button
            onClick={() => setFilter('struggling')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'struggling'
                ? isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Struggling ({counts.struggling})
          </button>
        )}
        {counts.ready > 0 && (
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'ready'
                ? isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Game Ready ({counts.ready})
          </button>
        )}
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800'}`}>
              <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Play</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Target</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Actual</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Delta</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Status</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Quality</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotas.map(quota => (
              <tr key={quota.playId} className={`border-b ${isLight ? 'border-gray-100' : 'border-slate-700/50'} ${
                quota.qualityStatus === 'struggling' ? (isLight ? 'bg-red-50/50' : 'bg-red-500/5') :
                quota.qualityStatus === 'game-ready' ? (isLight ? 'bg-emerald-50/50' : 'bg-emerald-500/5') : ''
              }`}>
                <td className={`px-4 py-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {quota.formation ? `${quota.formation} ${quota.playName}` : quota.playName}
                </td>
                <td className={`px-4 py-3 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {quota.target}
                </td>
                <td className={`px-4 py-3 text-center font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {quota.actual}
                </td>
                <td className={`px-4 py-3 text-center font-medium ${
                  quota.delta >= 0
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                    : isLight ? 'text-red-600' : 'text-red-400'
                }`}>
                  {(quota.delta >= 0 ? '+' : '') + quota.delta}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={quota.status} isLight={isLight} />
                </td>
                <td className="px-4 py-3 text-center">
                  <QualityBadge
                    qualityStatus={quota.qualityStatus}
                    avgRating={quota.avgRating}
                    ratedReps={quota.ratedReps}
                    isLight={isLight}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quality Legend */}
      <div className={`text-xs flex items-center gap-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
        <span className="font-medium">Quality:</span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
          Game Ready (4-5★)
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-sky-500' : 'bg-sky-400'}`} />
          Solid (3-4★)
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-amber-500' : 'bg-amber-400'}`} />
          Needs Work (2-3★)
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'}`} />
          Struggling (&lt;2★)
        </span>
      </div>
    </div>
  );
}

/**
 * Situations Tab Content
 */
function SituationsTab({ situations, week, onUpdateMinimum, isLight }) {
  const [filter, setFilter] = useState('callsheet');

  const filteredSituations = useMemo(() => {
    if (filter === 'callsheet') return situations.filter(s => s.onCallSheet);
    if (filter === 'all') return situations;
    return situations.filter(s => s.type === filter);
  }, [situations, filter]);

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('callsheet')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'callsheet'
              ? isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-400'
              : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          On Call Sheet
        </button>
        <button
          onClick={() => setFilter('fieldZone')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'fieldZone'
              ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-400'
              : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Field Zones
        </button>
        <button
          onClick={() => setFilter('downDistance')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'downDistance'
              ? isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
              : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Down/Distance
        </button>
        <button
          onClick={() => setFilter('special')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'special'
              ? isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
              : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          Special
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'all'
              ? isLight ? 'bg-gray-200 text-gray-700' : 'bg-slate-600 text-slate-200'
              : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          All
        </button>
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800'}`}>
              <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Situation</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Plays</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Min</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Reps</th>
              <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSituations.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-4 py-8 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  No situations match the current filter.
                </td>
              </tr>
            ) : (
              filteredSituations.map(situation => (
                <tr key={situation.situationId} className={`border-b ${isLight ? 'border-gray-100' : 'border-slate-700/50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={isLight ? 'text-gray-900' : 'text-white'}>{situation.name}</span>
                      {situation.onCallSheet && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400'}`}>
                          Call Sheet
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    {situation.playsAvailable || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {onUpdateMinimum ? (
                      <input
                        type="number"
                        min="0"
                        value={situation.minRequired}
                        onChange={(e) => onUpdateMinimum(situation.situationId, parseInt(e.target.value) || 0)}
                        className={`w-14 px-2 py-1 text-center rounded border text-sm ${
                          isLight
                            ? 'bg-white border-gray-300 text-gray-900'
                            : 'bg-slate-700 border-slate-600 text-white'
                        }`}
                      />
                    ) : (
                      <span className={isLight ? 'text-gray-500' : 'text-slate-400'}>
                        {situation.minRequired || '-'}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-center font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {situation.repsScripted}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={situation.status} isLight={isLight} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Execution Quality Tab Content
 */
function ExecutionTab({ executionIssues, quotas, isLight }) {
  const playsWithQuality = useMemo(() => {
    return quotas.filter(q => q.ratedReps > 0).sort((a, b) => (a.avgRating || 0) - (b.avgRating || 0));
  }, [quotas]);

  const strugglingPlays = playsWithQuality.filter(q => q.qualityStatus === 'struggling' || q.qualityStatus === 'needs-work');
  const gameReadyPlays = playsWithQuality.filter(q => q.qualityStatus === 'game-ready');

  return (
    <div className="space-y-6">
      {/* Overall Quality Summary */}
      {executionIssues?.overallAvgRating && (
        <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Overall Execution Quality
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                Based on {executionIssues.totalRatedReps} rated reps from Practice Review
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= Math.round(executionIssues.overallAvgRating || 0)
                      ? 'text-amber-400 fill-amber-400'
                      : isLight ? 'text-gray-300' : 'text-slate-600'
                    }
                  />
                ))}
              </div>
              <span className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {executionIssues.overallAvgRating?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Common Issues */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* What Worked */}
        <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-emerald-200' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
          <div className={`px-4 py-2 ${isLight ? 'bg-emerald-50' : 'bg-emerald-500/20'}`}>
            <h4 className={`font-medium flex items-center gap-2 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
              <Zap size={14} />
              What's Working
            </h4>
          </div>
          <div className="p-4">
            {executionIssues?.workedTagsSummary?.length > 0 ? (
              <div className="space-y-2">
                {executionIssues.workedTagsSummary.slice(0, 5).map(tag => (
                  <div key={tag.tagId} className="flex items-center justify-between">
                    <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>{tag.label}</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                No "worked" tags recorded yet. Use Practice Review to tag successful reps.
              </p>
            )}
          </div>
        </div>

        {/* What Didn't Work */}
        <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-red-200' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className={`px-4 py-2 ${isLight ? 'bg-red-50' : 'bg-red-500/20'}`}>
            <h4 className={`font-medium flex items-center gap-2 ${isLight ? 'text-red-800' : 'text-red-400'}`}>
              <AlertTriangle size={14} />
              Areas to Address
            </h4>
          </div>
          <div className="p-4">
            {executionIssues?.didntWorkTagsSummary?.length > 0 ? (
              <div className="space-y-2">
                {executionIssues.didntWorkTagsSummary.slice(0, 5).map(tag => (
                  <div key={tag.tagId} className="flex items-center justify-between">
                    <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>{tag.label}</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'}`}>
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                No issues recorded yet. Use Practice Review to tag failed reps.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Struggling Plays */}
      {strugglingPlays.length > 0 && (
        <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <div className={`px-4 py-2 ${isLight ? 'bg-red-50 border-b border-red-200' : 'bg-red-500/10 border-b border-red-500/30'}`}>
            <h4 className={`font-medium ${isLight ? 'text-red-800' : 'text-red-400'}`}>
              Plays Needing Attention ({strugglingPlays.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {strugglingPlays.slice(0, 10).map(play => (
              <div key={play.playId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {play.formation ? `${play.formation} ${play.playName}` : play.playName}
                  </div>
                  <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    {play.ratedReps} rated rep{play.ratedReps !== 1 ? 's' : ''} • {play.lowRatedReps} below average
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className={`font-bold ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                    {play.avgRating?.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Ready Plays */}
      {gameReadyPlays.length > 0 && (
        <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <div className={`px-4 py-2 ${isLight ? 'bg-emerald-50 border-b border-emerald-200' : 'bg-emerald-500/10 border-b border-emerald-500/30'}`}>
            <h4 className={`font-medium ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
              Game Ready ({gameReadyPlays.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {gameReadyPlays.slice(0, 5).map(play => (
              <div key={play.playId} className="px-4 py-3 flex items-center justify-between">
                <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {play.formation ? `${play.formation} ${play.playName}` : play.playName}
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    {play.avgRating?.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {!executionIssues?.overallAvgRating && playsWithQuality.length === 0 && (
        <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          <Star size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No execution data yet</p>
          <p className="text-sm mt-1">
            Use Practice Review to rate reps and tag what worked/didn't work.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * By Day Tab Content
 */
function ByDayTab({ days, buckets, isLight }) {
  const bucketLabels = useMemo(() => {
    const labels = {};
    buckets.forEach(b => { labels[b.bucketId] = b.label; });
    return labels;
  }, [buckets]);

  const bucketColors = useMemo(() => {
    const colors = {};
    buckets.forEach(b => { colors[b.bucketId] = b.color; });
    return colors;
  }, [buckets]);

  return (
    <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800'}`}>
            <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Day</th>
            <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Total Reps</th>
            <th className={`px-4 py-2 text-center ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Unique Plays</th>
            <th className={`px-4 py-2 text-left ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Bucket Breakdown</th>
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day.dayName} className={`border-b ${isLight ? 'border-gray-100' : 'border-slate-700/50'}`}>
              <td className={`px-4 py-3 font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {day.dayName}
              </td>
              <td className={`px-4 py-3 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {day.totalReps}
              </td>
              <td className={`px-4 py-3 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {day.uniquePlays}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(day.bucketReps || {}).map(([bucketId, reps]) => (
                    <span key={bucketId} className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: bucketColors[bucketId] || '#6b7280' }}
                      />
                      <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        {bucketLabels[bucketId] || bucketId}: {reps}
                      </span>
                    </span>
                  ))}
                  {Object.keys(day.bucketReps || {}).length === 0 && (
                    <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No plays scripted</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Recommendations Section
 */
function RecommendationsSection({ recommendations, isLight }) {
  const [isOpen, setIsOpen] = useState(true);

  if (recommendations.length === 0) return null;

  const severityColors = {
    high: isLight ? 'border-l-red-500 bg-red-50' : 'border-l-red-500 bg-red-500/10',
    medium: isLight ? 'border-l-amber-500 bg-amber-50' : 'border-l-amber-500 bg-amber-500/10',
    low: isLight ? 'border-l-sky-500 bg-sky-50' : 'border-l-sky-500 bg-sky-500/10'
  };

  return (
    <div className={`rounded-lg overflow-hidden ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 ${isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-700/50'}`}
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className={isLight ? 'text-amber-500' : 'text-amber-400'} />
          <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Recommendations ({recommendations.length})
          </span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`border-l-4 pl-3 py-2 rounded-r ${severityColors[rec.severity]}`}>
              <div className={`font-medium text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {rec.message}
              </div>
              <div className={`text-xs mt-0.5 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                {rec.suggestedAction}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main Practice Coverage Panel Component
 */
export default function PracticeCoveragePanel({ week, plays, setupConfig, onUpdateWeek, isLight = false }) {
  const [activeTab, setActiveTab] = useState('buckets');
  const [viewScope, setViewScope] = useState('week'); // 'week' or day name
  const [bucketFilter, setBucketFilter] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const coverage = usePracticeCoverage(week, plays, setupConfig);

  const tabs = [
    { id: 'buckets', label: 'Buckets', icon: BarChart3 },
    { id: 'concepts', label: 'Concepts', icon: Layers },
    { id: 'callsheet', label: 'Call Sheet', icon: ClipboardList },
    { id: 'quotas', label: 'Quotas', icon: Target },
    { id: 'situations', label: 'Situations', icon: ListChecks },
    { id: 'execution', label: 'Execution', icon: Star },
    { id: 'byday', label: 'By Day', icon: Calendar }
  ];

  const handleUpdateMinimum = (situationId, value) => {
    if (!onUpdateWeek) return;
    const currentMins = week?.situationMinimums || {};
    onUpdateWeek({
      situationMinimums: {
        ...currentMins,
        [situationId]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Script QC
            </h2>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              Practice coverage analysis for {week?.name || 'this week'}
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              showHelp
                ? 'bg-sky-500 text-white'
                : isLight
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
            }`}
            title="How to use Script QC"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={viewScope}
            onChange={(e) => setViewScope(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              isLight
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-slate-700 border-slate-600 text-white'
            }`}
          >
            <option value="week">Whole Week</option>
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className={`rounded-lg border p-5 ${isLight ? 'bg-sky-50 border-sky-200' : 'bg-sky-500/10 border-sky-500/30'}`}>
          <div className="flex items-start justify-between mb-4">
            <h3 className={`font-semibold ${isLight ? 'text-sky-900' : 'text-sky-300'}`}>
              How to Use Script QC
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              className={`p-1 rounded ${isLight ? 'hover:bg-sky-100 text-sky-700' : 'hover:bg-sky-500/20 text-sky-400'}`}
            >
              <X size={16} />
            </button>
          </div>

          <div className={`space-y-4 text-sm ${isLight ? 'text-sky-800' : 'text-sky-200'}`}>
            <p>
              Script QC helps you audit your practice scripts to ensure balanced rep distribution and adequate coverage of your game plan before game day.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${isLight ? 'bg-white/70' : 'bg-slate-800/50'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-sky-900' : 'text-white'}`}>
                  <BarChart3 size={14} /> Buckets
                </h4>
                <p className={`text-xs ${isLight ? 'text-sky-700' : 'text-slate-300'}`}>
                  Shows your Run/Pass/Screen/RPO balance. Use this to verify your scripts match your game plan philosophy.
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isLight ? 'bg-white/70' : 'bg-slate-800/50'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-sky-900' : 'text-white'}`}>
                  <Layers size={14} /> Concepts
                </h4>
                <p className={`text-xs ${isLight ? 'text-sky-700' : 'text-slate-300'}`}>
                  Breaks down reps by concept family (Inside Zone, Power, Mesh, etc). Watch for over-reliance on one concept - if it's 50%+ of a bucket, consider diversifying.
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isLight ? 'bg-white/70' : 'bg-slate-800/50'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-sky-900' : 'text-white'}`}>
                  <Target size={14} /> Quotas
                </h4>
                <p className={`text-xs ${isLight ? 'text-sky-700' : 'text-slate-300'}`}>
                  Compares scripted reps to your rep targets. <strong>Set quotas in Priority Plays</strong> by clicking a play and setting its "Rep Target" for the week. Plays with 0 reps but a quota show as "Unmet".
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isLight ? 'bg-white/70' : 'bg-slate-800/50'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-sky-900' : 'text-white'}`}>
                  <ListChecks size={14} /> Situations
                </h4>
                <p className={`text-xs ${isLight ? 'text-sky-700' : 'text-slate-300'}`}>
                  Shows which call sheet situations have been practiced. Set minimum reps per situation directly in the table. Situations with 0 reps are flagged.
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/30'}`}>
              <h4 className={`font-medium mb-2 ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                Recommended Workflow
              </h4>
              <ol className={`text-xs space-y-1.5 ${isLight ? 'text-amber-700' : 'text-amber-200'}`}>
                <li className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>1.</span>
                  <span><strong>Add priority plays</strong> for the week and set rep targets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>2.</span>
                  <span><strong>Build your call sheet</strong> with situation boxes (Red Zone, 3rd Down, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>3.</span>
                  <span><strong>Script practice</strong> in the Scripts tab, assigning plays to each period</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>4.</span>
                  <span><strong>Check QC</strong> to verify coverage - address any red flags before practice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>5.</span>
                  <span><strong>Review recommendations</strong> at the bottom for specific action items</span>
                </li>
              </ol>
            </div>

            <p className={`text-xs ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
              Tip: Use the "By Day" tab to see distribution across the week. Front-load important plays early in the week so there's time to correct issues.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Reps"
          value={coverage.summary.totalReps}
          subtext={`${coverage.summary.uniquePlays} unique plays`}
          color="sky"
          isLight={isLight}
        />
        <SummaryCard
          label="Unique Plays"
          value={coverage.summary.uniquePlays}
          color="purple"
          isLight={isLight}
        />
        <SummaryCard
          label="Quotas Met"
          value={coverage.summary.quotasMetPercent !== null ? `${coverage.summary.quotasMetPercent}%` : 'N/A'}
          subtext={coverage.summary.quotasTotal > 0 ? `${coverage.summary.quotasMet}/${coverage.summary.quotasTotal}` : 'No quotas set'}
          color={coverage.summary.quotasMetPercent !== null && coverage.summary.quotasMetPercent >= 80 ? 'emerald' : 'amber'}
          isLight={isLight}
        />
        <SummaryCard
          label="Situations"
          value={coverage.summary.situationsCoveredPercent !== null ? `${coverage.summary.situationsCoveredPercent}%` : 'N/A'}
          subtext={coverage.summary.situationsOnSheet > 0 ? `${coverage.summary.situationsCovered}/${coverage.summary.situationsOnSheet} covered` : 'None on call sheet'}
          color={coverage.summary.situationsCoveredPercent !== null && coverage.summary.situationsCoveredPercent >= 80 ? 'emerald' : 'amber'}
          isLight={isLight}
        />
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? isLight ? 'bg-white text-gray-900 shadow' : 'bg-slate-700 text-white'
                  : isLight ? 'text-gray-600 hover:text-gray-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'buckets' && (
          <BucketBalanceTab buckets={coverage.buckets} isLight={isLight} />
        )}
        {activeTab === 'concepts' && (
          <ConceptsTab concepts={coverage.concepts} isLight={isLight} />
        )}
        {activeTab === 'callsheet' && (
          <CallSheetTab callSheetPlays={coverage.callSheetPlays} isLight={isLight} />
        )}
        {activeTab === 'quotas' && (
          <QuotasTab quotas={coverage.quotas} isLight={isLight} />
        )}
        {activeTab === 'situations' && (
          <SituationsTab
            situations={coverage.situations}
            week={week}
            onUpdateMinimum={onUpdateWeek ? handleUpdateMinimum : null}
            isLight={isLight}
          />
        )}
        {activeTab === 'execution' && (
          <ExecutionTab
            executionIssues={coverage.executionIssues}
            quotas={coverage.quotas}
            isLight={isLight}
          />
        )}
        {activeTab === 'byday' && (
          <ByDayTab days={coverage.days} buckets={coverage.buckets} isLight={isLight} />
        )}
      </div>

      {/* Recommendations */}
      <RecommendationsSection recommendations={coverage.recommendations} isLight={isLight} />
    </div>
  );
}
