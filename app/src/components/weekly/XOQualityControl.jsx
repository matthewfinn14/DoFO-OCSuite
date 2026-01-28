import { useState, useMemo, useCallback } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  ClipboardCheck,
  Layers,
  FileText,
  Activity,
  Clipboard,
  Trophy,
  ChevronDown,
  Filter,
  X,
  Calendar,
  Info
} from 'lucide-react';

// Import audit sub-components
import InstallAudit from './qc/InstallAudit';
import PracticeScriptAudit from './qc/PracticeScriptAudit';
import PracticePerformanceAudit from './qc/PracticePerformanceAudit';
import GameplanAudit from './qc/GameplanAudit';
import PostGameAudit from './qc/PostGameAudit';

// Audit modes configuration
const AUDIT_MODES = [
  { id: 'install', label: 'Install', icon: Layers, description: 'Installed plays distribution & gaps' },
  { id: 'practice-script', label: 'Practice Script', icon: FileText, description: 'Scripted vs installed coverage' },
  { id: 'practice-perf', label: 'Practice Performance', icon: Activity, description: 'Rep grades & trends' },
  { id: 'gameplan', label: 'Gameplan', icon: Clipboard, description: 'Call sheet balance & anatomy' },
  { id: 'postgame', label: 'Post Game', icon: Trophy, description: 'Game grades & efficacy' }
];

// Scope types
const SCOPE_TYPES = [
  { id: 'week', label: 'Single Week' },
  { id: 'season', label: 'Season (Multi-Week)' }
];

export default function XOQualityControl({ weekId: propWeekId, expanded = false }) {
  const {
    plays,
    weeks,
    gamePlans,
    setupConfig,
    practiceGrades,
    gameGrades,
    currentWeekId
  } = useSchool();

  // Use prop weekId or fall back to context
  const initialWeekId = propWeekId || currentWeekId;

  // State
  const [mode, setMode] = useState('install');
  const [scopeType, setScopeType] = useState('week');
  const [selectedWeekId, setSelectedWeekId] = useState(initialWeekId);
  const [selectedWeekIds, setSelectedWeekIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    personnel: [],
    formation: [],
    bucket: [],
    concept: [],
    purpose: []
  });

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks?.find(w => w.id === selectedWeekId);
  }, [weeks, selectedWeekId]);

  // Get weeks for season scope
  const seasonWeeks = useMemo(() => {
    if (!weeks) return [];
    // Group by phase and sort
    return weeks
      .filter(w => !w.isOffseason)
      .sort((a, b) => {
        if (a.phaseId !== b.phaseId) {
          return (a.phaseOrder || 0) - (b.phaseOrder || 0);
        }
        return (a.weekNum || 0) - (b.weekNum || 0);
      });
  }, [weeks]);

  // Get plays as array
  const playsArray = useMemo(() => {
    return Object.entries(plays || {}).map(([id, play]) => ({ ...play, id }));
  }, [plays]);

  // Get filter options from plays and setupConfig
  const filterOptions = useMemo(() => {
    const personnelSet = new Set();
    const formationSet = new Set();

    playsArray.forEach(play => {
      if (play.personnel) personnelSet.add(play.personnel);
      if (play.formation) formationSet.add(play.formation);
    });

    return {
      personnel: Array.from(personnelSet).sort(),
      formation: Array.from(formationSet).sort(),
      bucket: (setupConfig?.playBuckets || []).filter(b => b.phase === 'OFFENSE'),
      concept: setupConfig?.conceptGroups || [],
      purpose: setupConfig?.qualityControlDefinitions?.playPurposes || []
    };
  }, [playsArray, setupConfig]);

  // Active week IDs based on scope
  const activeWeekIds = useMemo(() => {
    if (scopeType === 'week') {
      return selectedWeekId ? [selectedWeekId] : [];
    }
    return selectedWeekIds;
  }, [scopeType, selectedWeekId, selectedWeekIds]);

  // Handle filter change
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter(v => v !== value)
        : [...prev[filterKey], value]
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      personnel: [],
      formation: [],
      bucket: [],
      concept: [],
      purpose: []
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(arr => arr.length > 0);
  }, [filters]);

  // Toggle week selection for season scope
  const toggleWeekSelection = useCallback((weekId) => {
    setSelectedWeekIds(prev =>
      prev.includes(weekId)
        ? prev.filter(id => id !== weekId)
        : [...prev, weekId]
    );
  }, []);

  // Select all weeks in a phase
  const selectPhaseWeeks = useCallback((phaseId) => {
    const phaseWeekIds = seasonWeeks
      .filter(w => w.phaseId === phaseId)
      .map(w => w.id);
    setSelectedWeekIds(prev => {
      const newIds = new Set([...prev, ...phaseWeekIds]);
      return Array.from(newIds);
    });
  }, [seasonWeeks]);

  // Render mode content
  const renderModeContent = () => {
    const commonProps = {
      plays,
      playsArray,
      weeks,
      gamePlans,
      setupConfig,
      practiceGrades,
      gameGrades,
      weekIds: activeWeekIds,
      currentWeek,
      filters,
      expanded
    };

    switch (mode) {
      case 'install':
        return <InstallAudit {...commonProps} />;
      case 'practice-script':
        return <PracticeScriptAudit {...commonProps} />;
      case 'practice-perf':
        return <PracticePerformanceAudit {...commonProps} />;
      case 'gameplan':
        return <GameplanAudit {...commonProps} />;
      case 'postgame':
        return <PostGameAudit {...commonProps} />;
      default:
        return <InstallAudit {...commonProps} />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 ${expanded ? 'p-6' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <ClipboardCheck size={24} className="text-sky-400" />
        <div>
          <h2 className="text-lg font-semibold text-white">X&O Quality Control</h2>
          <p className="text-xs text-slate-400">Audit alignment from install to game results</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-1 mb-4">
        {AUDIT_MODES.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === m.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={m.description}
            >
              <Icon size={14} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scope Selector */}
      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs text-slate-400">Scope:</span>
          {SCOPE_TYPES.map(st => (
            <label key={st.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scopeType === st.id}
                onChange={() => setScopeType(st.id)}
                className="text-sky-500 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-300">{st.label}</span>
            </label>
          ))}
        </div>

        {scopeType === 'week' ? (
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <select
              value={selectedWeekId || ''}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
            >
              <option value="">Select Week...</option>
              {seasonWeeks.map(week => (
                <option key={week.id} value={week.id}>
                  {week.name} {week.opponent ? `vs ${week.opponent}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 mb-2">
              Select weeks to include ({selectedWeekIds.length} selected)
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {/* Group by phase */}
              {Array.from(new Set(seasonWeeks.map(w => w.phaseId))).map(phaseId => {
                const phaseWeeks = seasonWeeks.filter(w => w.phaseId === phaseId);
                const phaseName = phaseWeeks[0]?.phaseName || phaseId;
                return (
                  <div key={phaseId} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-400">{phaseName}</span>
                      <button
                        onClick={() => selectPhaseWeeks(phaseId)}
                        className="text-xs text-sky-400 hover:text-sky-300"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {phaseWeeks.map(week => (
                        <button
                          key={week.id}
                          onClick={() => toggleWeekSelection(week.id)}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            selectedWeekIds.includes(week.id)
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {week.name.replace(/Week\s*/i, 'W')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Filter size={14} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 bg-sky-600 text-white text-xs rounded">
              {Object.values(filters).flat().length}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {showFilters && (
          <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
            {/* Personnel Filter */}
            {filterOptions.personnel.length > 0 && (
              <FilterGroup
                label="Personnel"
                options={filterOptions.personnel}
                selected={filters.personnel}
                onChange={(v) => handleFilterChange('personnel', v)}
              />
            )}

            {/* Formation Filter */}
            {filterOptions.formation.length > 0 && (
              <FilterGroup
                label="Formation"
                options={filterOptions.formation.slice(0, 10)}
                selected={filters.formation}
                onChange={(v) => handleFilterChange('formation', v)}
              />
            )}

            {/* Bucket Filter */}
            {filterOptions.bucket.length > 0 && (
              <FilterGroup
                label="Bucket"
                options={filterOptions.bucket.map(b => b.id)}
                labels={Object.fromEntries(filterOptions.bucket.map(b => [b.id, b.name]))}
                selected={filters.bucket}
                onChange={(v) => handleFilterChange('bucket', v)}
              />
            )}

            {/* Purpose Filter */}
            {filterOptions.purpose.length > 0 && (
              <FilterGroup
                label="Purpose"
                options={filterOptions.purpose.map(p => p.id)}
                labels={Object.fromEntries(filterOptions.purpose.map(p => [p.id, p.name]))}
                colors={Object.fromEntries(filterOptions.purpose.map(p => [p.id, p.color]))}
                selected={filters.purpose}
                onChange={(v) => handleFilterChange('purpose', v)}
              />
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <X size={12} />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mode Content */}
      <div className="flex-1 overflow-y-auto">
        {activeWeekIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Info size={48} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">Select a Week</h3>
            <p className="text-sm text-slate-500">
              Choose a week above to view quality control data
            </p>
          </div>
        ) : (
          renderModeContent()
        )}
      </div>
    </div>
  );
}

// Filter Group Component
function FilterGroup({ label, options, labels = {}, colors = {}, selected, onChange }) {
  return (
    <div>
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => {
          const isSelected = selected.includes(opt);
          const displayLabel = labels[opt] || opt;
          const color = colors[opt];

          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                isSelected
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              style={color && isSelected ? { backgroundColor: color } : undefined}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
