import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Star, Hash } from 'lucide-react';
import { getPlayCall } from '../../utils/playDisplay';

export default function InstallView({
  currentWeek,
  plays,
  gamePlan,
  setupConfig,
  isLocked,
  onUpdateGamePlan,
  getWristbandLabel
}) {
  const [expandedBuckets, setExpandedBuckets] = useState({});
  const [expandedFamilies, setExpandedFamilies] = useState({});
  const [draggedPlay, setDraggedPlay] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Get play buckets and concept families from setupConfig
  const playBuckets = setupConfig?.playBuckets || [];
  const conceptGroups = setupConfig?.conceptGroups || [];

  // Get installed play IDs
  const installList = currentWeek?.installList || [];

  // Get play order from game plan (for custom ordering)
  const playOrder = gamePlan?.playTypeOrder || {};

  // Organize plays by bucket and concept family
  const organizedPlays = useMemo(() => {
    // Filter to only installed plays
    const installedPlays = plays.filter(p => installList.includes(p.id) && !p.archived);

    // Group by bucket
    const buckets = playBuckets
      .filter(bucket => (bucket.phase || 'OFFENSE') === 'OFFENSE')
      .map(bucket => {
        // Get concept families for this bucket
        const families = conceptGroups
          .filter(cf => cf.categoryId === bucket.id)
          .map(family => {
            // Find plays in this family
            let familyPlays = installedPlays.filter(p =>
              p.bucketId === bucket.id && p.conceptFamily === family.label
            );

            // Apply custom order if exists
            const orderKey = `${bucket.id}_${family.id}`;
            const customOrder = playOrder[orderKey];
            if (customOrder && customOrder.length > 0) {
              familyPlays = familyPlays.sort((a, b) => {
                const aIdx = customOrder.indexOf(a.id);
                const bIdx = customOrder.indexOf(b.id);
                if (aIdx === -1 && bIdx === -1) return 0;
                if (aIdx === -1) return 1;
                if (bIdx === -1) return -1;
                return aIdx - bIdx;
              });
            } else {
              // Default sort: priority first, then alphabetical
              familyPlays = familyPlays.sort((a, b) => {
                if (a.priority && !b.priority) return -1;
                if (!a.priority && b.priority) return 1;
                return (a.name || '').localeCompare(b.name || '');
              });
            }

            return {
              ...family,
              plays: familyPlays,
              playCount: familyPlays.length,
              priorityCount: familyPlays.filter(p => p.priority).length
            };
          })
          .filter(f => f.playCount > 0);

        const totalPlays = families.reduce((sum, f) => sum + f.playCount, 0);
        const totalPriority = families.reduce((sum, f) => sum + f.priorityCount, 0);

        return {
          ...bucket,
          families,
          totalPlays,
          totalPriority
        };
      })
      .filter(b => b.totalPlays > 0);

    // Find unassigned plays
    const unassignedPlays = installedPlays.filter(p => {
      if (!p.bucketId || !p.conceptFamily) return true;
      const bucketExists = playBuckets.some(b => b.id === p.bucketId);
      const familyExists = conceptGroups.some(cf =>
        cf.categoryId === p.bucketId && cf.label === p.conceptFamily
      );
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
        families: [{
          id: 'unassigned-family',
          label: 'Other Plays',
          plays: unassignedPlays,
          playCount: unassignedPlays.length,
          priorityCount: unassignedPlays.filter(p => p.priority).length
        }],
        totalPlays: unassignedPlays.length,
        totalPriority: unassignedPlays.filter(p => p.priority).length
      });
    }

    return buckets;
  }, [plays, installList, playBuckets, conceptGroups, playOrder]);

  // Toggle bucket expansion
  const toggleBucket = useCallback((bucketId) => {
    setExpandedBuckets(prev => ({
      ...prev,
      [bucketId]: prev[bucketId] === false ? true : (prev[bucketId] === undefined ? false : !prev[bucketId])
    }));
  }, []);

  // Toggle family expansion
  const toggleFamily = useCallback((familyKey) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [familyKey]: prev[familyKey] === false ? true : (prev[familyKey] === undefined ? false : !prev[familyKey])
    }));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e, play, bucketId, familyId) => {
    if (isLocked) return;
    setDraggedPlay({ play, bucketId, familyId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', play.id);
  }, [isLocked]);

  // Handle drag over
  const handleDragOver = useCallback((e, playId, bucketId, familyId) => {
    e.preventDefault();
    if (isLocked || !draggedPlay) return;
    if (draggedPlay.bucketId !== bucketId || draggedPlay.familyId !== familyId) return;
    setDragOverTarget({ playId, bucketId, familyId });
  }, [isLocked, draggedPlay]);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e, targetPlayId, bucketId, familyId) => {
    e.preventDefault();
    if (isLocked || !draggedPlay) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    // Only allow reordering within same family
    if (draggedPlay.bucketId !== bucketId || draggedPlay.familyId !== familyId) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    const orderKey = `${bucketId}_${familyId}`;

    // Get current family plays
    const bucket = organizedPlays.find(b => b.id === bucketId);
    const family = bucket?.families?.find(f => f.id === familyId);
    if (!family) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    // Create new order
    const currentOrder = family.plays.map(p => p.id);
    const draggedIdx = currentOrder.indexOf(draggedPlay.play.id);
    const targetIdx = currentOrder.indexOf(targetPlayId);

    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) {
      setDraggedPlay(null);
      setDragOverTarget(null);
      return;
    }

    // Remove from current position and insert at new position
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedPlay.play.id);

    // Update game plan with new order
    const newPlayOrder = { ...(gamePlan?.playTypeOrder || {}), [orderKey]: newOrder };
    onUpdateGamePlan({ ...gamePlan, playTypeOrder: newPlayOrder });

    setDraggedPlay(null);
    setDragOverTarget(null);
  }, [isLocked, draggedPlay, organizedPlays, gamePlan, onUpdateGamePlan]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedPlay(null);
    setDragOverTarget(null);
  }, []);

  // Total counts
  const totalInstalled = installList.length;
  const totalPriority = plays.filter(p => installList.includes(p.id) && p.priority).length;

  if (totalInstalled === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <Package size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Plays Installed</h3>
          <p className="text-slate-500">
            Install plays for this week to see them organized by play type.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
          <div className="text-2xl font-bold text-white">{totalInstalled}</div>
          <div className="text-xs text-slate-500 uppercase">Installed</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
          <div className="text-2xl font-bold text-amber-400">{totalPriority}</div>
          <div className="text-xs text-slate-500 uppercase">Priority</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
          <div className="text-2xl font-bold text-white">{organizedPlays.length}</div>
          <div className="text-xs text-slate-500 uppercase">Categories</div>
        </div>
      </div>

      {/* Instructions */}
      {!isLocked && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm text-slate-400">
          <GripVertical size={14} className="inline mr-2" />
          Drag plays to reorder within each concept family. Priority plays are shown first by default.
        </div>
      )}

      {/* Buckets */}
      <div className="space-y-3">
        {organizedPlays.map(bucket => {
          const isBucketExpanded = expandedBuckets[bucket.id] !== false;

          return (
            <div
              key={bucket.id}
              className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
            >
              {/* Bucket Header */}
              <button
                onClick={() => toggleBucket(bucket.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: bucket.color || '#64748b' }}
                  />
                  {isBucketExpanded ? (
                    <ChevronDown size={18} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-400" />
                  )}
                  <span className="font-semibold text-white">{bucket.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {bucket.totalPriority > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                      <Star size={10} fill="currentColor" />
                      {bucket.totalPriority}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-sm rounded">
                    {bucket.totalPlays} plays
                  </span>
                </div>
              </button>

              {/* Bucket Content */}
              {isBucketExpanded && (
                <div className="border-t border-slate-800">
                  {bucket.families.map(family => {
                    const familyKey = `${bucket.id}_${family.id}`;
                    const isFamilyExpanded = expandedFamilies[familyKey] !== false;

                    return (
                      <div key={family.id} className="border-b border-slate-800/50 last:border-b-0">
                        {/* Family Header */}
                        <button
                          onClick={() => toggleFamily(familyKey)}
                          className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isFamilyExpanded ? (
                              <ChevronDown size={14} className="text-slate-500" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-500" />
                            )}
                            <span className="text-slate-300 font-medium">{family.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {family.priorityCount > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 text-xs">
                                <Star size={10} fill="currentColor" />
                                {family.priorityCount}
                              </span>
                            )}
                            <span className="text-slate-500 text-xs">
                              {family.playCount}
                            </span>
                          </div>
                        </button>

                        {/* Family Plays */}
                        {isFamilyExpanded && (
                          <div className="px-4 pb-3 space-y-1">
                            {family.plays.map((play, idx) => {
                              const isDragging = draggedPlay?.play?.id === play.id;
                              const isDragOver = dragOverTarget?.playId === play.id &&
                                dragOverTarget?.bucketId === bucket.id &&
                                dragOverTarget?.familyId === family.id;

                              return (
                                <div
                                  key={play.id}
                                  draggable={!isLocked}
                                  onDragStart={(e) => handleDragStart(e, play, bucket.id, family.id)}
                                  onDragOver={(e) => handleDragOver(e, play.id, bucket.id, family.id)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, play.id, bucket.id, family.id)}
                                  onDragEnd={handleDragEnd}
                                  className={`
                                    flex items-center gap-2 p-2 rounded-lg transition-all
                                    ${isDragging ? 'opacity-50 bg-slate-700' : 'bg-slate-800/50'}
                                    ${isDragOver ? 'ring-2 ring-sky-500 bg-sky-500/10' : ''}
                                    ${!isLocked ? 'cursor-grab active:cursor-grabbing' : ''}
                                  `}
                                >
                                  {/* Drag Handle */}
                                  {!isLocked && (
                                    <div className="text-slate-600 flex-shrink-0">
                                      <GripVertical size={14} />
                                    </div>
                                  )}

                                  {/* Priority Star */}
                                  {play.priority && (
                                    <Star
                                      size={14}
                                      className="text-amber-400 flex-shrink-0"
                                      fill="currentColor"
                                    />
                                  )}

                                  {/* Play Name */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white truncate">
                                      {getPlayCall(play)}
                                    </div>
                                  </div>

                                  {/* Wristband Slot */}
                                  {getWristbandLabel(play) && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded flex-shrink-0">
                                      <Hash size={10} />
                                      {getWristbandLabel(play)}
                                    </span>
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
        })}
      </div>
    </div>
  );
}

// Need to import Package icon at top level
function Package({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
