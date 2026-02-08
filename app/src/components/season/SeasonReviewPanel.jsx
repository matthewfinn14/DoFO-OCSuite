import { useState, useMemo } from 'react';
import {
  BarChart3, PieChart, Target, Map, Eye, Lightbulb, ClipboardList,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, Info, Zap, XCircle
} from 'lucide-react';

/**
 * 7-Tab Analytics Panel for Season Review
 * Tabs: Executive Summary, Bucket Performance, Concept Performance,
 *       Situation Analysis, Tendency/Self-Scout, Insights, Recommendations
 */
export default function SeasonReviewPanel({ report, insights }) {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Executive Summary', icon: BarChart3 },
    { id: 'buckets', label: 'Buckets', icon: PieChart },
    { id: 'concepts', label: 'Concepts', icon: Target },
    { id: 'situations', label: 'Situations', icon: Map },
    { id: 'tendencies', label: 'Self-Scout', icon: Eye },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'recommendations', label: 'Actions', icon: ClipboardList }
  ];

  if (!report || report.gamesCount === 0) {
    return (
      <div className="p-8 text-center">
        <BarChart3 size={48} className="text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
        <p className="text-slate-400">Import game data to see season analytics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary Cards (Always Visible) */}
      <SummaryCards metrics={report.metrics} trends={insights?.trends} />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-700 overflow-x-auto">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'summary' && <ExecutiveSummaryTab report={report} insights={insights} />}
        {activeTab === 'buckets' && <BucketPerformanceTab buckets={report.buckets} />}
        {activeTab === 'concepts' && <ConceptPerformanceTab concepts={report.concepts} buckets={report.buckets} />}
        {activeTab === 'situations' && <SituationAnalysisTab situations={report.situations} />}
        {activeTab === 'tendencies' && <TendencyTab tendencies={report.tendencies} />}
        {activeTab === 'insights' && <InsightsTab insights={insights} />}
        {activeTab === 'recommendations' && <RecommendationsTab recommendations={insights?.recommendations} />}
      </div>
    </div>
  );
}

// ============================================================================
// SUMMARY CARDS
// ============================================================================

function SummaryCards({ metrics, trends }) {
  const cards = [
    {
      label: 'Yards/Play',
      value: metrics.yardsPerPlay?.toFixed(1) || '0.0',
      trend: trends?.yardsPerPlay?.trend,
      color: 'sky'
    },
    {
      label: 'Efficiency',
      value: `${metrics.efficiency || 0}%`,
      trend: trends?.efficiency?.trend,
      color: 'emerald'
    },
    {
      label: 'Explosive Rate',
      value: `${metrics.explosiveRate || 0}%`,
      trend: trends?.explosiveRate?.trend,
      color: 'amber'
    },
    {
      label: '3rd Down',
      value: `${metrics.thirdDownConversion || 0}%`,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-3 p-4 border-b border-slate-700">
      {cards.map(card => (
        <div key={card.label} className="bg-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">{card.label}</span>
            {card.trend && <TrendIndicator trend={card.trend} />}
          </div>
          <p className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function TrendIndicator({ trend }) {
  if (trend === 'improving') {
    return <TrendingUp size={14} className="text-emerald-400" />;
  }
  if (trend === 'declining') {
    return <TrendingDown size={14} className="text-red-400" />;
  }
  return <Minus size={14} className="text-slate-500" />;
}

// ============================================================================
// TAB: EXECUTIVE SUMMARY
// ============================================================================

function ExecutiveSummaryTab({ report, insights }) {
  const { metrics, gameByGame } = report;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Snaps" value={metrics.totalSnaps} />
        <KPICard label="Snaps/Game" value={metrics.snapsPerGame} />
        <KPICard label="Total Yards" value={metrics.totalYards} />
        <KPICard label="1st Downs/Game" value={metrics.firstDownsPerGame} />
        <KPICard label="Explosive Plays" value={metrics.explosivePlays} color="amber" />
        <KPICard label="Negative Plays" value={metrics.negativePlays} color="red" />
        <KPICard label="Negative Rate" value={`${metrics.negativeRate}%`} color="red" />
        <KPICard label="Games" value={report.gamesCount} />
      </div>

      {/* Game-by-Game Sparklines */}
      {gameByGame.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Season Progression</h3>
          <div className="grid grid-cols-2 gap-4">
            <SparklineCard
              label="Efficiency"
              data={gameByGame.map(g => g.efficiency)}
              games={gameByGame}
              color="emerald"
            />
            <SparklineCard
              label="Yards/Play"
              data={gameByGame.map(g => parseFloat(g.yardsPerPlay))}
              games={gameByGame}
              color="sky"
            />
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {insights?.summary && (
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Season Overview</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendIndicator trend={insights.summary.overallTrend} />
              <span className="text-slate-400">
                Season trend: <span className="text-white capitalize">{insights.summary.overallTrend}</span>
              </span>
            </div>
            <div className="text-slate-400">
              Issues: <span className="text-red-400 font-medium">{insights.summary.totalIssues}</span>
            </div>
            <div className="text-slate-400">
              Opportunities: <span className="text-emerald-400 font-medium">{insights.summary.totalOpportunities}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, color = 'white' }) {
  const colorClasses = {
    white: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    sky: 'text-sky-400'
  };

  return (
    <div className="bg-slate-700/30 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

function SparklineCard({ label, data, games, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="bg-slate-700/30 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <div className="flex items-end gap-1 h-12">
        {data.map((value, idx) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={idx}
              className={`flex-1 bg-${color}-500/50 hover:bg-${color}-500 rounded-t transition-colors`}
              style={{ height: `${Math.max(height, 10)}%` }}
              title={`${games[idx]?.opponent || `Game ${idx + 1}`}: ${value}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAB: BUCKET PERFORMANCE
// ============================================================================

function BucketPerformanceTab({ buckets }) {
  return (
    <div className="space-y-6">
      {/* Bucket Distribution Chart */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Play Type Distribution</h3>
        <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden">
          {buckets.map(bucket => (
            <div
              key={bucket.bucketId}
              className="h-full flex items-center justify-center text-xs font-medium text-white"
              style={{
                width: `${bucket.percentage}%`,
                backgroundColor: bucket.color || '#64748b',
                minWidth: bucket.percentage > 0 ? '40px' : '0'
              }}
            >
              {bucket.percentage > 5 && `${bucket.percentage}%`}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {buckets.map(bucket => (
            <div key={bucket.bucketId} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: bucket.color || '#64748b' }} />
              {bucket.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bucket Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
              <th className="pb-2 pr-4">Bucket</th>
              <th className="pb-2 pr-4 text-right">Snaps</th>
              <th className="pb-2 pr-4 text-right">Yards</th>
              <th className="pb-2 pr-4 text-right">Yds/Play</th>
              <th className="pb-2 pr-4 text-right">Efficiency</th>
              <th className="pb-2 pr-4 text-right">Explosive</th>
              <th className="pb-2 pr-4 text-right">Negative</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {buckets.map(bucket => (
              <tr key={bucket.bucketId} className="border-b border-slate-700/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: bucket.color || '#64748b' }} />
                    <span className="text-white font-medium">{bucket.label}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-slate-300">{bucket.snaps}</td>
                <td className="py-3 pr-4 text-right text-slate-300">{bucket.yards}</td>
                <td className="py-3 pr-4 text-right text-slate-300">{bucket.yardsPerPlay}</td>
                <td className="py-3 pr-4 text-right">
                  <span className={bucket.efficiency >= 50 ? 'text-emerald-400' : 'text-amber-400'}>
                    {bucket.efficiency}%
                  </span>
                </td>
                <td className="py-3 pr-4 text-right text-amber-400">{bucket.explosiveRate}%</td>
                <td className="py-3 pr-4 text-right text-red-400">{bucket.negativeRate}%</td>
                <td className="py-3">
                  <StatusBadge status={bucket.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    strong: 'bg-emerald-500/20 text-emerald-400',
    'needs-work': 'bg-amber-500/20 text-amber-400',
    'low-sample': 'bg-slate-500/20 text-slate-400'
  };

  const labels = {
    strong: 'Strong',
    'needs-work': 'Needs Work',
    'low-sample': 'Low Sample'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles['low-sample']}`}>
      {labels[status] || status}
    </span>
  );
}

// ============================================================================
// TAB: CONCEPT PERFORMANCE
// ============================================================================

function ConceptPerformanceTab({ concepts, buckets }) {
  const [expandedBucket, setExpandedBucket] = useState(null);

  // Group concepts by parent bucket
  const conceptsByBucket = useMemo(() => {
    const grouped = {};
    concepts.forEach(concept => {
      const bucketId = concept.parentBucketId || 'unknown';
      if (!grouped[bucketId]) {
        grouped[bucketId] = [];
      }
      grouped[bucketId].push(concept);
    });
    return grouped;
  }, [concepts]);

  return (
    <div className="space-y-4">
      {buckets.map(bucket => {
        const bucketConcepts = conceptsByBucket[bucket.bucketId] || [];
        if (bucketConcepts.length === 0) return null;

        const isExpanded = expandedBucket === bucket.bucketId || expandedBucket === null;

        return (
          <div key={bucket.bucketId} className="bg-slate-700/30 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedBucket(isExpanded ? 'none' : bucket.bucketId)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: bucket.color || '#64748b' }} />
                <span className="text-white font-medium">{bucket.label}</span>
                <span className="text-slate-400 text-sm">({bucketConcepts.length} concepts)</span>
              </div>
              {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="p-3 pt-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400">
                      <th className="pb-2">Concept</th>
                      <th className="pb-2 text-right">Snaps</th>
                      <th className="pb-2 text-right">Yds/Play</th>
                      <th className="pb-2 text-right">Efficiency</th>
                      <th className="pb-2 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bucketConcepts.sort((a, b) => b.snaps - a.snaps).map(concept => (
                      <tr key={concept.conceptId} className="border-t border-slate-700/50">
                        <td className="py-2 text-white">{concept.name}</td>
                        <td className="py-2 text-right text-slate-300">{concept.snaps}</td>
                        <td className="py-2 text-right text-slate-300">{concept.yardsPerPlay}</td>
                        <td className="py-2 text-right">
                          <span className={concept.efficiency >= 50 ? 'text-emerald-400' : 'text-amber-400'}>
                            {concept.efficiency}%
                          </span>
                        </td>
                        <td className="py-2 text-right text-slate-400">{concept.variance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// TAB: SITUATION ANALYSIS
// ============================================================================

function SituationAnalysisTab({ situations }) {
  const { byFieldZone, byDownDistance, bySpecialSituation } = situations;

  return (
    <div className="space-y-6">
      {/* Field Zone Heat Map */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Field Zone Performance</h3>
        <div className="flex items-stretch gap-1 h-16 rounded-lg overflow-hidden">
          {byFieldZone.map(zone => (
            <div
              key={zone.zoneId}
              className="flex-1 flex flex-col items-center justify-center text-xs"
              style={{
                backgroundColor: getEfficiencyColor(zone.efficiency)
              }}
            >
              <span className="font-medium text-white">{zone.efficiency}%</span>
              <span className="text-white/70">{zone.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Down & Distance Matrix */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Down & Distance</h3>
        <div className="grid grid-cols-5 gap-2">
          {byDownDistance.map(dd => (
            <div
              key={dd.categoryId}
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: getEfficiencyColor(dd.efficiency, 0.3) }}
            >
              <p className="text-xs text-slate-400">{dd.name}</p>
              <p className="text-lg font-semibold text-white">{dd.efficiency}%</p>
              {dd.conversionRate !== null && (
                <p className="text-xs text-slate-400">Conv: {dd.conversionRate}%</p>
              )}
              <p className="text-xs text-slate-500">{dd.snaps} snaps</p>
            </div>
          ))}
        </div>
      </div>

      {/* Special Situations */}
      {bySpecialSituation.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Special Situations</h3>
          <div className="grid grid-cols-3 gap-3">
            {bySpecialSituation.map(sit => (
              <div key={sit.situationId} className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-sm text-white font-medium">{sit.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">{sit.snaps} snaps</span>
                  <span className={`text-sm font-medium ${sit.efficiency >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {sit.efficiency}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getEfficiencyColor(efficiency, alpha = 0.5) {
  if (efficiency >= 60) return `rgba(16, 185, 129, ${alpha})`; // emerald
  if (efficiency >= 45) return `rgba(245, 158, 11, ${alpha})`; // amber
  return `rgba(239, 68, 68, ${alpha})`; // red
}

// ============================================================================
// TAB: TENDENCY / SELF-SCOUT
// ============================================================================

function TendencyTab({ tendencies }) {
  const { predictabilityIndex, formationTendencies, personnelTendencies, downDistanceTendencies } = tendencies;

  return (
    <div className="space-y-6">
      {/* Predictability Gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#334155"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={predictabilityIndex > 50 ? '#ef4444' : predictabilityIndex > 30 ? '#f59e0b' : '#10b981'}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(predictabilityIndex / 100) * 352} 352`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{predictabilityIndex}%</span>
            <span className="text-xs text-slate-400">Predictable</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-2">Predictability Score</h3>
          <p className="text-slate-400 text-sm">
            {predictabilityIndex > 50
              ? 'High predictability detected. Opponents may anticipate your play calling.'
              : predictabilityIndex > 30
              ? 'Moderate predictability. Some tendencies are exploitable.'
              : 'Low predictability. Play calling appears balanced.'}
          </p>
        </div>
      </div>

      {/* Formation Tendencies */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Formation Tendencies</h3>
        <div className="space-y-2">
          {formationTendencies.slice(0, 8).map(formation => (
            <div key={formation.formation} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
              <span className="text-white font-medium w-40 truncate">{formation.formation}</span>
              <div className="flex-1 h-4 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full ${formation.isPredictable ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${formation.dominantPercent}%` }}
                />
              </div>
              <span className="text-sm text-slate-400 w-24 text-right">
                {formation.dominantPercent}% {formation.dominantBucket}
              </span>
              {formation.isPredictable && (
                <AlertTriangle size={14} className="text-red-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personnel Tendencies */}
      {personnelTendencies.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Personnel Tendencies</h3>
          <div className="grid grid-cols-2 gap-2">
            {personnelTendencies.slice(0, 6).map(personnel => (
              <div key={personnel.personnel} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                <span className="text-white">{personnel.personnel}</span>
                <span className={`text-sm ${personnel.isPredictable ? 'text-red-400' : 'text-slate-400'}`}>
                  {personnel.dominantPercent}% {personnel.dominantBucket}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB: INSIGHTS
// ============================================================================

function InsightsTab({ insights }) {
  const { anomalies, trends, smartFilters } = insights || {};

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Season Trends</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(trends || {}).map(([key, trend]) => (
            <div key={key} className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
              <div className="flex items-center gap-2">
                <TrendIndicator trend={trend.trend} />
                <span className={`text-sm font-medium ${
                  trend.trend === 'improving' ? 'text-emerald-400' :
                  trend.trend === 'declining' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {trend.pctChange > 0 ? '+' : ''}{trend.pctChange}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Filters */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Smart Filters</h3>
        {(!smartFilters || smartFilters.length === 0) ? (
          <p className="text-slate-400 text-sm">No significant patterns detected.</p>
        ) : (
          <div className="space-y-2">
            {smartFilters.map(filter => (
              <SmartFilterCard key={filter.filterId} filter={filter} />
            ))}
          </div>
        )}
      </div>

      {/* Anomalies */}
      {anomalies?.highPerformers?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">High Performers</h3>
          <div className="flex flex-wrap gap-2">
            {anomalies.highPerformers.map(item => (
              <div key={item.conceptId} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                <Zap size={14} />
                {item.name}: {item.efficiency}%
              </div>
            ))}
          </div>
        </div>
      )}

      {anomalies?.lowPerformers?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Underperformers</h3>
          <div className="flex flex-wrap gap-2">
            {anomalies.lowPerformers.map(item => (
              <div key={item.conceptId} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm">
                <XCircle size={14} />
                {item.name}: {item.efficiency}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SmartFilterCard({ filter }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityStyles = {
    high: 'bg-red-500/10 border-red-500/30 text-red-400',
    medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    opportunity: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    low: 'bg-slate-500/10 border-slate-500/30 text-slate-400'
  };

  return (
    <div className={`border rounded-lg ${severityStyles[filter.severity]}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3"
      >
        <div className="flex items-center gap-2">
          {filter.severity === 'high' && <AlertTriangle size={16} />}
          {filter.severity === 'opportunity' && <Lightbulb size={16} />}
          <span className="font-medium">{filter.label}</span>
          <span className="text-sm opacity-70">({filter.count})</span>
        </div>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-sm opacity-80 mb-2">{filter.description}</p>
          <div className="space-y-1">
            {filter.matches.slice(0, 5).map((match, idx) => (
              <div key={idx} className="text-sm flex items-center justify-between">
                <span>{match.name}</span>
                <span className="opacity-70">{match.snaps} snaps</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB: RECOMMENDATIONS
// ============================================================================

function RecommendationsTab({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Actionable Items</h3>
        <p className="text-slate-400">Your offense is performing well with no major issues detected.</p>
      </div>
    );
  }

  const priorityLabels = {
    1: 'High Priority',
    2: 'Medium Priority',
    3: 'Low Priority'
  };

  const priorityStyles = {
    1: 'border-red-500/30 bg-red-500/5',
    2: 'border-amber-500/30 bg-amber-500/5',
    3: 'border-slate-500/30 bg-slate-500/5'
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec, idx) => (
        <div key={idx} className={`border rounded-lg p-4 ${priorityStyles[rec.priority]}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-xs font-medium text-slate-400">{priorityLabels[rec.priority]}</span>
              <h4 className="text-white font-medium">{rec.title}</h4>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${
              rec.category === 'issue' ? 'bg-red-500/20 text-red-400' :
              rec.category === 'opportunity' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {rec.category}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2">{rec.description}</p>
          <div className="flex items-center gap-2 text-sm">
            <Info size={14} className="text-sky-400" />
            <span className="text-sky-400">{rec.action}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
