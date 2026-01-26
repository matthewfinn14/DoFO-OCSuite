import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Star,
  Sparkles,
  Copy,
  Trash2,
  ArrowLeft,
  GripVertical
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
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [quickAddValue, setQuickAddValue] = useState('');

  // Get play categories and buckets from settings/setupConfig
  const playCategories = setupConfig?.playCategories || settings?.playCategories || [];
  const playBuckets = setupConfig?.playBuckets || settings?.playBuckets || [];

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

  // Master playbook (plays NOT in install list) filtered by phase
  const masterList = useMemo(() => {
    const installSet = new Set(installList);
    return playsArray
      .filter(p => !p.archived && !installSet.has(p.id) && (p.phase || 'OFFENSE') === activePhase)
      .filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return p.name?.toLowerCase().includes(search) ||
               p.formation?.toLowerCase().includes(search) ||
               p.concept?.toLowerCase().includes(search);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [playsArray, installList, activePhase, searchTerm]);

  // Group installed plays by category and concept family
  const bucketData = useMemo(() => {
    // Filter categories by current phase
    const phaseCategories = playCategories.filter(cat =>
      (cat.phase || 'OFFENSE') === activePhase
    );

    const categories = phaseCategories.map(cat => {
      // Get buckets (concept families) for this category
      const categoryBuckets = playBuckets.filter(b => b.categoryId === cat.id);

      const families = categoryBuckets.map(bucket => {
        const familyPlays = phaseInstalledPlays
          .filter(p => p.bucketId === cat.id && p.conceptFamily === bucket.label)
          .sort((a, b) => {
            // Priority first, then alphabetical
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            return (a.name || '').localeCompare(b.name || '');
          });

        return { ...bucket, plays: familyPlays };
      }).filter(f => f.plays.length > 0);

      const totalPlays = families.reduce((sum, f) => sum + f.plays.length, 0);
      return { ...cat, families, totalPlays };
    }).filter(c => c.totalPlays > 0 || c.families.length > 0);

    // Unassigned plays (installed but not categorized)
    const unassignedPlays = phaseInstalledPlays.filter(p => {
      if (!p.bucketId || !p.conceptFamily) return true;
      const catExists = playCategories.some(cat => cat.id === p.bucketId);
      const bucketExists = playBuckets.some(b => b.categoryId === p.bucketId && b.label === p.conceptFamily);
      return !catExists || !bucketExists;
    }).sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    if (unassignedPlays.length > 0) {
      categories.push({
        id: 'unassigned',
        label: 'Unassigned',
        color: '#64748b',
        families: [{ id: 'unassigned-family', label: 'Other Plays', plays: unassignedPlays }],
        totalPlays: unassignedPlays.length
      });
    }

    return categories;
  }, [phaseInstalledPlays, playCategories, playBuckets, activePhase]);

  // Stats
  const stats = useMemo(() => {
    const phaseTotal = phaseInstalledPlays.length;
    const priorityCount = phaseInstalledPlays.filter(p => p.priority).length;
    const newCount = phaseInstalledPlays.filter(p => newInstallIds.includes(p.id)).length;
    return { total: phaseTotal, priority: priorityCount, new: newCount };
  }, [phaseInstalledPlays, newInstallIds]);

  // Toggle category expansion
  const toggleCategory = useCallback((catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  }, []);

  // Add play to install
  const handleAddToInstall = useCallback((playId) => {
    if (!currentWeek || installList.includes(playId)) return;
    const newList = [...installList, playId];
    updateWeek(weekId, { installList: newList });
  }, [currentWeek, installList, weekId, updateWeek]);

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
    <div className="flex h-full">
      {/* Left Sidebar - Master Playbook */}
      <div className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Master Playbook
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plays..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Play List */}
        <div className="flex-1 overflow-y-auto">
          {masterList.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {searchTerm ? 'No plays found' : 'All plays installed'}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {masterList.map(play => (
                <div
                  key={play.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50"
                >
                  <button
                    onClick={() => handleAddToInstall(play.id)}
                    className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    title="Add to install"
                  >
                    <Plus size={14} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {play.name}
                    </div>
                    {play.formation && (
                      <div className="text-xs text-slate-500 truncate">
                        {play.formation}
                      </div>
                    )}
                  </div>
                  {play.priority && (
                    <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="p-3 border-t border-slate-800 bg-slate-800/50">
          <div className="text-xs text-slate-400">
            {masterList.length} available • {installList.length} installed
          </div>
        </div>
      </div>

      {/* Main Content */}
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
              {bucketData.map(category => {
                const isExpanded = expandedCategories[category.id] !== false;

                return (
                  <div
                    key={category.id}
                    className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors"
                      style={{ borderLeft: `4px solid ${category.color || '#3b82f6'}` }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-slate-500" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-500" />
                      )}
                      <span className="font-semibold text-white">{category.label}</span>
                      <span className="text-sm text-slate-500">
                        {category.totalPlays} play{category.totalPlays !== 1 ? 's' : ''}
                      </span>
                    </button>

                    {/* Families */}
                    {isExpanded && (
                      <div className="border-t border-slate-800">
                        {category.families.map(family => (
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

                                    {/* Play Name */}
                                    <div className="text-sm font-medium text-white truncate pr-6">
                                      {play.name}
                                    </div>
                                    {play.formation && (
                                      <div className="text-xs text-slate-500 truncate">
                                        {play.formation}
                                      </div>
                                    )}

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
    </div>
  );
}
