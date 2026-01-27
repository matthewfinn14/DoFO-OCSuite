import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Minus,
  Star,
  Sparkles,
  Copy,
  Trash2,
  ArrowLeft
} from 'lucide-react';

export default function InstallManager() {
  const { weekId } = useParams();
  const {
    playsArray,
    weeks,
    updateWeek,
    settings,
    setupConfig
  } = useSchool();

  // Get current week
  const currentWeek = weeks.find(w => w.id === weekId);
  const isOffseason = currentWeek?.name === 'Offseason' || currentWeek?.phaseId?.includes('offseason');

  // Local state
  const [activePhase, setActivePhase] = useState('OFFENSE');
  const [expandedBuckets, setExpandedBuckets] = useState({});

  // Get play buckets and concept families from settings/setupConfig
  const playBuckets = setupConfig?.playBuckets || settings?.playBuckets || [];
  const conceptGroups = setupConfig?.conceptGroups || settings?.conceptGroups || [];

  // Current install list and new install IDs from week
  const installList = currentWeek?.installList || [];
  const newInstallIds = currentWeek?.newInstallIds || [];

  // Get installed plays (hydrated)
  const installedPlays = useMemo(() => {
    return installList
      .map(id => playsArray.find(p => p.id === id))
      .filter(Boolean);
  }, [installList, playsArray]);

  // Filter installed plays by phase
  const phaseInstalledPlays = useMemo(() => {
    return installedPlays.filter(p => (p.phase || 'OFFENSE') === activePhase);
  }, [installedPlays, activePhase]);

  // Group installed plays by bucket and concept family
  const bucketData = useMemo(() => {
    // Filter buckets by current phase
    const phaseBuckets = playBuckets.filter(bucket =>
      (bucket.phase || 'OFFENSE') === activePhase
    );

    const buckets = phaseBuckets.map(bucket => {
      // Get concept families for this bucket
      const bucketFamilies = conceptGroups.filter(cf => cf.categoryId === bucket.id);

      const families = bucketFamilies.map(family => {
        const familyPlays = phaseInstalledPlays
          .filter(p => p.bucketId === bucket.id && p.conceptFamily === family.label)
          .sort((a, b) => {
            // Priority first, then alphabetical
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            return (a.name || '').localeCompare(b.name || '');
          });

        return { ...family, plays: familyPlays };
      }).filter(f => f.plays.length > 0);

      const totalPlays = families.reduce((sum, f) => sum + f.plays.length, 0);
      return { ...bucket, families, totalPlays };
    }).filter(b => b.totalPlays > 0 || b.families.length > 0);

    // Unassigned plays (installed but not in a bucket)
    const unassignedPlays = phaseInstalledPlays.filter(p => {
      if (!p.bucketId || !p.conceptFamily) return true;
      const bucketExists = playBuckets.some(bucket => bucket.id === p.bucketId);
      const familyExists = conceptGroups.some(cf => cf.categoryId === p.bucketId && cf.label === p.conceptFamily);
      return !bucketExists || !familyExists;
    }).sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    if (unassignedPlays.length > 0) {
      buckets.push({
        id: 'unassigned',
        label: 'Unassigned',
        color: '#64748b',
        families: [{ id: 'unassigned-family', label: 'Other Plays', plays: unassignedPlays }],
        totalPlays: unassignedPlays.length
      });
    }

    return buckets;
  }, [phaseInstalledPlays, playBuckets, conceptGroups, activePhase]);

  // Stats
  const stats = useMemo(() => {
    const phaseTotal = phaseInstalledPlays.length;
    const priorityCount = phaseInstalledPlays.filter(p => p.priority).length;
    const newCount = phaseInstalledPlays.filter(p => newInstallIds.includes(p.id)).length;
    return { total: phaseTotal, priority: priorityCount, new: newCount };
  }, [phaseInstalledPlays, newInstallIds]);

  // Toggle bucket expansion
  const toggleBucket = useCallback((bucketId) => {
    setExpandedBuckets(prev => ({ ...prev, [bucketId]: !prev[bucketId] }));
  }, []);

  // Remove play from install
  const handleRemoveFromInstall = useCallback((playId) => {
    if (!currentWeek) return;
    const newList = installList.filter(id => id !== playId);
    const newNewIds = newInstallIds.filter(id => id !== playId);
    updateWeek(weekId, { installList: newList, newInstallIds: newNewIds });
  }, [currentWeek, installList, newInstallIds, weekId, updateWeek]);

  // Toggle priority
  const handleTogglePriority = useCallback((playId) => {
    const play = playsArray.find(p => p.id === playId);
    if (!play) return;
    // Update the play's priority field directly
    // Note: This would require updatePlay from context, but for now we'll manage it
    // through the week's priority tracking if available
  }, [playsArray]);

  // Toggle new play marker
  const handleToggleNewPlay = useCallback((playId) => {
    if (!currentWeek) return;
    let newIds;
    if (newInstallIds.includes(playId)) {
      newIds = newInstallIds.filter(id => id !== playId);
    } else {
      newIds = [...newInstallIds, playId];
    }
    updateWeek(weekId, { newInstallIds: newIds });
  }, [currentWeek, newInstallIds, weekId, updateWeek]);

  // Copy from previous week
  const handleCopyFromPreviousWeek = useCallback(() => {
    if (!currentWeek) return;

    // Find current week index and get previous week
    const weekIndex = weeks.findIndex(w => w.id === weekId);
    if (weekIndex <= 0) {
      alert('No previous week available');
      return;
    }

    const prevWeek = weeks[weekIndex - 1];
    if (!prevWeek.installList || prevWeek.installList.length === 0) {
      alert('Previous week has no installed plays');
      return;
    }

    const confirm = window.confirm(
      `Copy ${prevWeek.installList.length} plays from "${prevWeek.name || prevWeek.opponent || 'Previous Week'}"?\n\nThis will replace your current install list.`
    );
    if (!confirm) return;

    updateWeek(weekId, {
      installList: [...prevWeek.installList],
      newInstallIds: [...(prevWeek.newInstallIds || [])]
    });
  }, [currentWeek, weeks, weekId, updateWeek]);

  // Clear all installs
  const handleClearAll = useCallback(() => {
    if (!currentWeek) return;
    const confirm = window.confirm('Clear all installed plays for this week? This cannot be undone.');
    if (!confirm) return;
    updateWeek(weekId, { installList: [], newInstallIds: [] });
  }, [currentWeek, weekId, updateWeek]);

  // No week selected state
  if (!currentWeek) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Layers size={64} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Install Manager</h1>
          <p className="text-slate-400 mb-6">
            Select a week from the sidebar to manage play installations.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Install Manager</h1>
              <p className="text-sm text-slate-400">
                {currentWeek.name || currentWeek.opponent || `Week ${currentWeek.weekNumber || ''}`}
                {currentWeek.opponent && ` vs ${currentWeek.opponent}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyFromPreviousWeek}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                <Copy size={14} />
                Copy from Previous
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          </div>

          {/* Phase Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].map(phase => (
                <button
                  key={phase}
                  onClick={() => setActivePhase(phase)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activePhase === phase
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.charAt(0) + phase.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-slate-700" />

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Installed:</span>
                <span className="font-bold text-white">{stats.total}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Star size={12} className="fill-amber-400" />
                <span>{stats.priority}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles size={12} />
                <span>{stats.new} new</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bucket Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {bucketData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <Layers size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Plays Installed</h3>
                <p className="text-slate-400 text-sm">
                  Add plays from the Master Playbook on the left to build your weekly install.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bucketData.map(bucket => {
                const isExpanded = expandedBuckets[bucket.id] !== false;

                return (
                  <div
                    key={bucket.id}
                    className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
                  >
                    {/* Bucket Header */}
                    <button
                      onClick={() => toggleBucket(bucket.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors"
                      style={{ borderLeft: `4px solid ${bucket.color || '#3b82f6'}` }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-slate-500" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-500" />
                      )}
                      <span className="font-semibold text-white">{bucket.label}</span>
                      <span className="text-sm text-slate-500">
                        {bucket.totalPlays} play{bucket.totalPlays !== 1 ? 's' : ''}
                      </span>
                    </button>

                    {/* Concept Families */}
                    {isExpanded && (
                      <div className="border-t border-slate-800">
                        {bucket.families.map(family => (
                          <div key={family.id} className="border-b border-slate-800 last:border-b-0">
                            {/* Family Header */}
                            <div className="px-4 py-2 bg-slate-800/30 flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-300">
                                {family.label}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({family.plays.length})
                              </span>
                            </div>

                            {/* Play Cards */}
                            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                              {family.plays.map(play => {
                                const isNew = newInstallIds.includes(play.id);
                                const isPriority = play.priority;

                                return (
                                  <div
                                    key={play.id}
                                    className={`relative p-2 rounded border transition-colors ${
                                      isPriority
                                        ? 'bg-amber-500/10 border-amber-500/30'
                                        : isNew
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                    }`}
                                  >
                                    {/* Badges */}
                                    <div className="absolute -top-1 -right-1 flex gap-0.5">
                                      {isPriority && (
                                        <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                          <Star size={10} className="text-white fill-white" />
                                        </span>
                                      )}
                                      {isNew && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                                          NEW
                                        </span>
                                      )}
                                    </div>

                                    {/* Play Call (Formation + Name) */}
                                    <div className="text-sm font-medium text-white truncate pr-6">
                                      {play.formation ? `${play.formation} ${play.name}` : play.name}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 mt-2">
                                      <button
                                        onClick={() => handleToggleNewPlay(play.id)}
                                        className={`p-1 rounded text-xs ${
                                          isNew
                                            ? 'bg-emerald-500/30 text-emerald-400'
                                            : 'bg-slate-700 text-slate-400 hover:text-emerald-400'
                                        }`}
                                        title={isNew ? 'Remove new marker' : 'Mark as new'}
                                      >
                                        <Sparkles size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveFromInstall(play.id)}
                                        className="p-1 rounded bg-slate-700 text-slate-400 hover:text-red-400"
                                        title="Remove from install"
                                      >
                                        <Minus size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}
