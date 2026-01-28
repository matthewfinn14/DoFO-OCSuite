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

// Play Card Component for split view
function PlayCard({ play, isNew, isPriority, onToggleNew, onRemove, isLight }) {
  return (
    <div
      className={`relative p-2.5 rounded-lg border transition-colors ${
        isPriority
          ? 'bg-amber-500/10 border-amber-500/30'
          : isNew
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isLight
          ? 'bg-gray-100 border-gray-300 hover:border-gray-400'
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Priority Badge */}
      {isPriority && (
        <div className="absolute -top-1 -right-1">
          <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
            <Star size={12} className="text-white fill-white" />
          </span>
        </div>
      )}

      {/* Play Call (Formation + Name) */}
      <div className={`text-sm font-medium truncate pr-5 ${isLight ? 'text-gray-900' : 'text-white'}`}>
        {play.formation ? `${play.formation} ${play.name}` : play.name}
      </div>

      {/* Bucket/Category info */}
      {play.bucketLabel && (
        <div className={`text-xs truncate mt-0.5 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
          {play.bucketLabel}
          {play.conceptFamily && ` • ${play.conceptFamily}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2">
        <button
          onClick={onToggleNew}
          className={`p-1.5 rounded text-xs transition-colors ${
            isNew
              ? 'bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/40'
              : isLight
              ? 'bg-gray-200 text-gray-500 hover:text-emerald-500 hover:bg-gray-300'
              : 'bg-slate-700 text-slate-400 hover:text-emerald-400 hover:bg-slate-600'
          }`}
          title={isNew ? 'Move to Review' : 'Mark as New'}
        >
          <Sparkles size={12} />
        </button>
        <button
          onClick={onRemove}
          className={`p-1.5 rounded transition-colors ${
            isLight
              ? 'bg-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-100'
              : 'bg-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-500/20'
          }`}
          title="Remove from install"
        >
          <Minus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function InstallManager() {
  const { weekId } = useParams();
  const {
    playsArray,
    weeks,
    updateWeek,
    settings,
    setupConfig,
    school
  } = useSchool();

  // Theme detection
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

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
        <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Install Manager</h1>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                {currentWeek.name || currentWeek.opponent || `Week ${currentWeek.weekNumber || ''}`}
                {currentWeek.opponent && ` vs ${currentWeek.opponent}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyFromPreviousWeek}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded ${
                  isLight
                    ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Copy size={14} />
                Copy from Previous
              </button>
              <button
                onClick={handleClearAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded ${
                  isLight
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
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
                      : isLight
                      ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:text-gray-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.charAt(0) + phase.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className={`h-5 w-px ${isLight ? 'bg-gray-300' : 'bg-slate-700'}`} />

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>Installed:</span>
                <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.total}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <Star size={12} className="fill-amber-500" />
                <span>{stats.priority}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Sparkles size={12} />
                <span>{stats.new} new</span>
              </div>
            </div>
          </div>
        </div>

        {/* Split View: New vs Review */}
        <div className="flex-1 overflow-hidden p-4">
          {phaseInstalledPlays.length === 0 ? (
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
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* NEW INSTALL Column */}
              <div className="flex flex-col bg-slate-900 rounded-lg border border-emerald-500/30 overflow-hidden">
                <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-emerald-400">New Install</h3>
                  <span className="ml-auto text-sm text-emerald-400/70">
                    {stats.new} play{stats.new !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {(() => {
                    const newPlays = phaseInstalledPlays
                      .filter(p => newInstallIds.includes(p.id))
                      .sort((a, b) => {
                        // Priority first, then alphabetical
                        if (a.priority && !b.priority) return -1;
                        if (!a.priority && b.priority) return 1;
                        return (a.name || '').localeCompare(b.name || '');
                      });

                    // Split into priority and regular
                    const priorityPlays = newPlays.filter(p => p.priority);
                    const regularPlays = newPlays.filter(p => !p.priority);

                    if (newPlays.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <Sparkles size={32} className="text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No new plays this week</p>
                            <p className="text-slate-600 text-xs mt-1">Click the sparkle icon on a play to mark as new</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {/* Priority New Plays */}
                        {priorityPlays.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Star size={14} className="text-amber-400 fill-amber-400" />
                              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Priority</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {priorityPlays.map(play => (
                                <PlayCard
                                  key={play.id}
                                  play={play}
                                  isNew={true}
                                  isPriority={true}
                                  onToggleNew={() => handleToggleNewPlay(play.id)}
                                  onRemove={() => handleRemoveFromInstall(play.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Regular New Plays */}
                        {regularPlays.length > 0 && (
                          <div>
                            {priorityPlays.length > 0 && (
                              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Other New</div>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {regularPlays.map(play => (
                                <PlayCard
                                  key={play.id}
                                  play={play}
                                  isNew={true}
                                  isPriority={false}
                                  onToggleNew={() => handleToggleNewPlay(play.id)}
                                  onRemove={() => handleRemoveFromInstall(play.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* REVIEW Column */}
              <div className="flex flex-col bg-slate-900 rounded-lg border border-sky-500/30 overflow-hidden">
                <div className="px-4 py-3 bg-sky-500/10 border-b border-sky-500/30 flex items-center gap-2">
                  <Layers size={18} className="text-sky-400" />
                  <h3 className="font-semibold text-sky-400">Review</h3>
                  <span className="ml-auto text-sm text-sky-400/70">
                    {stats.total - stats.new} play{(stats.total - stats.new) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {(() => {
                    const reviewPlays = phaseInstalledPlays
                      .filter(p => !newInstallIds.includes(p.id))
                      .sort((a, b) => {
                        // Priority first, then alphabetical
                        if (a.priority && !b.priority) return -1;
                        if (!a.priority && b.priority) return 1;
                        return (a.name || '').localeCompare(b.name || '');
                      });

                    // Split into priority and regular
                    const priorityPlays = reviewPlays.filter(p => p.priority);
                    const regularPlays = reviewPlays.filter(p => !p.priority);

                    if (reviewPlays.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <Layers size={32} className="text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No review plays</p>
                            <p className="text-slate-600 text-xs mt-1">All installed plays are marked as new</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {/* Priority Review Plays */}
                        {priorityPlays.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Star size={14} className="text-amber-400 fill-amber-400" />
                              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Priority</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {priorityPlays.map(play => (
                                <PlayCard
                                  key={play.id}
                                  play={play}
                                  isNew={false}
                                  isPriority={true}
                                  onToggleNew={() => handleToggleNewPlay(play.id)}
                                  onRemove={() => handleRemoveFromInstall(play.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Regular Review Plays */}
                        {regularPlays.length > 0 && (
                          <div>
                            {priorityPlays.length > 0 && (
                              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Other Review</div>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {regularPlays.map(play => (
                                <PlayCard
                                  key={play.id}
                                  play={play}
                                  isNew={false}
                                  isPriority={false}
                                  onToggleNew={() => handleToggleNewPlay(play.id)}
                                  onRemove={() => handleRemoveFromInstall(play.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
