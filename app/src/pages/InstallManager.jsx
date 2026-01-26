import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  CheckSquare,
  Square,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  CheckCircle
} from 'lucide-react';

// Install status options
const STATUS_OPTIONS = [
  { id: 'not_started', label: 'Not Started', color: '#6b7280' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'installed', label: 'Installed', color: '#22c55e' },
  { id: 'mastered', label: 'Mastered', color: '#3b82f6' }
];

export default function InstallManager() {
  const { plays, weeks, settings, updatePlays } = useSchool();

  const [filterPhase, setFilterPhase] = useState('offense');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    plays.filter(p => p.phase === filterPhase).forEach(p => {
      if (p.bucket) cats.add(p.bucket);
    });
    return Array.from(cats).sort();
  }, [plays, filterPhase]);

  // Filter and group plays
  const groupedPlays = useMemo(() => {
    const filtered = plays.filter(p => {
      if (p.archived) return false;
      if (p.phase !== filterPhase) return false;
      if (filterStatus !== 'all' && (p.installStatus || 'not_started') !== filterStatus) return false;
      if (filterCategory !== 'all' && p.bucket !== filterCategory) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!p.name?.toLowerCase().includes(search) &&
            !p.formation?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });

    // Group by category
    const groups = {};
    filtered.forEach(play => {
      const category = play.bucket || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(play);
    });

    return groups;
  }, [plays, filterPhase, filterStatus, filterCategory, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const phasePlays = plays.filter(p => p.phase === filterPhase && !p.archived);
    const counts = {
      total: phasePlays.length,
      not_started: 0,
      in_progress: 0,
      installed: 0,
      mastered: 0
    };

    phasePlays.forEach(p => {
      const status = p.installStatus || 'not_started';
      counts[status]++;
    });

    return counts;
  }, [plays, filterPhase]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Update play install status
  const updatePlayStatus = (playId, status) => {
    const newPlays = plays.map(p =>
      p.id === playId
        ? { ...p, installStatus: status, installDate: status === 'installed' || status === 'mastered' ? new Date().toISOString() : p.installDate }
        : p
    );
    updatePlays(newPlays);
  };

  // Get status config
  const getStatusConfig = (statusId) =>
    STATUS_OPTIONS.find(s => s.id === statusId) || STATUS_OPTIONS[0];

  // Progress percentage
  const progressPercent = stats.total > 0
    ? Math.round(((stats.installed + stats.mastered) / stats.total) * 100)
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Install Manager</h1>
          <p className="text-slate-400">Track play installation progress</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-slate-400">Total Plays</div>
        </div>
        {STATUS_OPTIONS.map(status => (
          <div key={status.id} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <div className="text-2xl font-bold" style={{ color: status.color }}>
              {stats[status.id]}
            </div>
            <div className="text-sm text-slate-400">{status.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Installation Progress</span>
          <span className="text-slate-400">{progressPercent}% complete</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(to right, #22c55e, #3b82f6)`
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Phase tabs */}
          <div className="flex gap-2">
            {['offense', 'defense', 'special_teams'].map(phase => (
              <button
                key={phase}
                onClick={() => setFilterPhase(phase)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterPhase === phase
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {phase === 'special_teams' ? 'Special Teams' : phase.charAt(0).toUpperCase() + phase.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-700" />

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search plays..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Plays by Category */}
      {Object.keys(groupedPlays).length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <Play size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Plays Found</h3>
          <p className="text-slate-400">
            No plays match your current filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedPlays).map(([category, categoryPlays]) => {
            const isExpanded = expandedCategories[category] !== false;
            const installedCount = categoryPlays.filter(p =>
              p.installStatus === 'installed' || p.installStatus === 'mastered'
            ).length;

            return (
              <div
                key={category}
                className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50"
                >
                  {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                  <span className="font-semibold text-white">{category}</span>
                  <span className="text-sm text-slate-500">
                    {installedCount}/{categoryPlays.length} installed
                  </span>
                  <div className="flex-1" />
                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(installedCount / categoryPlays.length) * 100}%` }}
                    />
                  </div>
                </button>

                {/* Plays List */}
                {isExpanded && (
                  <div className="border-t border-slate-800">
                    {categoryPlays.map((play, idx) => {
                      const status = getStatusConfig(play.installStatus || 'not_started');

                      return (
                        <div
                          key={play.id}
                          className={`flex items-center gap-4 px-4 py-3 ${
                            idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white">{play.name}</div>
                            <div className="text-sm text-slate-500">{play.formation || 'No formation'}</div>
                          </div>

                          {/* Status Selector */}
                          <div className="flex gap-2">
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s.id}
                                onClick={() => updatePlayStatus(play.id, s.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                  (play.installStatus || 'not_started') === s.id
                                    ? 'ring-2 ring-offset-2 ring-offset-slate-900'
                                    : 'opacity-50 hover:opacity-100'
                                }`}
                                style={{
                                  backgroundColor: `${s.color}20`,
                                  color: s.color,
                                  ringColor: s.color
                                }}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>

                          {play.installDate && (play.installStatus === 'installed' || play.installStatus === 'mastered') && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock size={12} />
                              {new Date(play.installDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
