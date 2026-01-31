import { useState, useEffect, createContext, useContext } from 'react';
import { X, Star, Zap, FileText, Handshake, Link2, MapPin, Hash, AlertTriangle, Eye, Layers, Target, Crosshair, Edit3 } from 'lucide-react';
import { getWristbandDisplay } from '../utils/wristband';

// Context for opening PlayDetailsModal from anywhere
const PlayDetailsModalContext = createContext({
  openPlayDetails: () => {},
  closePlayDetails: () => {},
  editPlay: () => {}
});

export const usePlayDetailsModal = () => useContext(PlayDetailsModalContext);

// Provider component that wraps the app
export function PlayDetailsModalProvider({ children, plays, updatePlay, playBuckets, conceptGroups, formations, currentWeek, updateWeek, setupConfig, updateSetupConfig, onEditPlay }) {
  const [modalState, setModalState] = useState({ isOpen: false, playId: null });

  const openPlayDetails = (playId) => {
    setModalState({ isOpen: true, playId });
  };

  const closePlayDetails = () => {
    setModalState({ isOpen: false, playId: null });
  };

  // Edit play - navigates to PlayEditor for this play
  const editPlay = (playId) => {
    closePlayDetails();
    onEditPlay?.(playId);
  };

  return (
    <PlayDetailsModalContext.Provider value={{ openPlayDetails, closePlayDetails, editPlay }}>
      {children}
      {modalState.isOpen && modalState.playId && (
        <PlayDetailsModal
          playId={modalState.playId}
          plays={plays}
          onClose={closePlayDetails}
          onUpdatePlay={updatePlay}
          playBuckets={playBuckets}
          conceptGroups={conceptGroups}
          formations={formations}
          currentWeek={currentWeek}
          onUpdateWeek={updateWeek}
          setupConfig={setupConfig}
          updateSetupConfig={updateSetupConfig}
          onEdit={() => editPlay(modalState.playId)}
        />
      )}
    </PlayDetailsModalContext.Provider>
  );
}

// The modal component itself
export default function PlayDetailsModal({
  playId,
  plays,
  onClose,
  onUpdatePlay,
  playBuckets = [],
  conceptGroups = [],
  formations = [],
  currentWeek,
  onUpdateWeek,
  setupConfig,
  updateSetupConfig,
  onEdit
}) {
  // Series creation prompt state
  const [showSeriesPrompt, setShowSeriesPrompt] = useState(false);
  const [pendingSeriesPlays, setPendingSeriesPlays] = useState([]);
  const [seriesName, setSeriesName] = useState('');
  const play = Array.isArray(plays)
    ? plays.find(p => p.id === playId)
    : plays?.[playId];

  if (!play) return null;

  const newInstallIds = currentWeek?.newInstallIds || [];
  const isNew = newInstallIds.includes(playId);
  const isPriority = play.priority || false;
  const isWiz = play.isWiz || false;
  const isMiniScript = play.isMiniScript || false;

  // Get the bucket and concept family for display
  const bucket = playBuckets.find(b => b.id === play.bucketId);

  // Filter buckets by play's phase
  const phaseBuckets = playBuckets.filter(b =>
    (b.phase || 'OFFENSE') === (play.phase || 'OFFENSE')
  );

  // Get concept families for selected bucket
  // Concept groups are stored as bucket.families (array of strings)
  const bucketConceptFamilies = bucket?.families || [];

  const handleTogglePriority = () => {
    onUpdatePlay?.(playId, { priority: !isPriority });
  };

  const handleToggleWiz = () => {
    onUpdatePlay?.(playId, { isWiz: !isWiz });
  };

  const handleToggleMiniScript = () => {
    onUpdatePlay?.(playId, { isMiniScript: !isMiniScript });
  };

  const handleToggleNew = () => {
    if (!onUpdateWeek || !currentWeek) return;
    let newIds;
    if (isNew) {
      newIds = newInstallIds.filter(id => id !== playId);
    } else {
      newIds = [...newInstallIds, playId];
    }
    onUpdateWeek(currentWeek.id, { newInstallIds: newIds });
  };

  const handleBucketChange = (bucketId) => {
    // Clear concept family when bucket changes (since families are bucket-specific)
    onUpdatePlay?.(playId, {
      bucketId: bucketId || '',
      conceptFamily: ''
    });
  };

  const handleFamilyChange = (familyLabel) => {
    onUpdatePlay?.(playId, {
      conceptFamily: familyLabel || ''
    });
  };

  const handleWristbandChange = (value) => {
    onUpdatePlay?.(playId, { wristbandSlot: value });
  };

  // Complementary plays - stored as array of {playId, type}
  // Types: 'audible', 'if-then', 'look-alike'
  const complementaryPlays = play.complementaryPlays || [];
  const hasComplementary = complementaryPlays.length > 0;

  // Get plays for the same phase (excluding current play)
  const playsArray = Array.isArray(plays) ? plays : Object.values(plays || {});
  const samePhasePlays = playsArray.filter(p =>
    p.id !== playId && (p.phase || 'OFFENSE') === (play.phase || 'OFFENSE')
  );

  const handleAddComplementary = (targetPlayId, type) => {
    if (!targetPlayId) return;
    // Check if already exists with this type
    const exists = complementaryPlays.some(c => c.playId === targetPlayId && c.type === type);
    if (exists) return;

    const newComplementaryPlays = [...complementaryPlays, { playId: targetPlayId, type }];
    onUpdatePlay?.(playId, { complementaryPlays: newComplementaryPlays });

    // If we now have 3+ unique linked plays, prompt to create a series
    const uniquePlayIds = new Set(newComplementaryPlays.map(c => c.playId));
    uniquePlayIds.add(playId); // Include current play

    if (uniquePlayIds.size >= 3 && updateSetupConfig) {
      // Check if these plays are already in an existing series
      const existingSeries = setupConfig?.lookAlikeSeries || [];
      const alreadyInSeries = existingSeries.some(series => {
        const seriesSet = new Set(series.playIds);
        return [...uniquePlayIds].every(id => seriesSet.has(id));
      });

      if (!alreadyInSeries) {
        setPendingSeriesPlays([...uniquePlayIds]);
        setSeriesName('');
        setShowSeriesPrompt(true);
      }
    }
  };

  const handleRemoveComplementary = (targetPlayId, type) => {
    onUpdatePlay?.(playId, {
      complementaryPlays: complementaryPlays.filter(c => !(c.playId === targetPlayId && c.type === type))
    });
  };

  // Create a new series from linked plays
  const handleCreateSeries = async () => {
    if (!seriesName.trim() || pendingSeriesPlays.length < 3 || !updateSetupConfig) return;

    const newSeries = {
      id: `series-${Date.now()}`,
      name: seriesName.trim(),
      bucketId: play.bucketId || null,
      description: '',
      commonElements: [],
      playIds: pendingSeriesPlays
    };

    const existingSeries = setupConfig?.lookAlikeSeries || [];
    await updateSetupConfig('lookAlikeSeries', [...existingSeries, newSeries]);

    setShowSeriesPrompt(false);
    setPendingSeriesPlays([]);
    setSeriesName('');
  };

  // Get play info by ID
  const getPlayById = (id) => playsArray.find(p => p.id === id);

  // Complement types with labels and colors
  const COMPLEMENT_TYPES = [
    { id: 'audible', label: 'Audible', color: '#f59e0b', description: 'Can audible to this play' },
    { id: 'if-then', label: 'If/Then', color: '#8b5cf6', description: 'Part of if/then sequence' },
    { id: 'look-alike', label: 'Look-Alike', color: '#06b6d4', description: 'Looks similar to defense' }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-[420px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">
                {play.formation && <span className="text-slate-500">{play.formation} </span>}
                {play.name}
              </h3>
              {hasComplementary && (
                <span className="text-emerald-500" title={`Has ${complementaryPlays.length} complementary play(s)`}>
                  <Handshake size={20} />
                </span>
              )}
            </div>
            {/* Bucket and Concept Group badges */}
            {(bucket || play.conceptFamily) && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {bucket && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: bucket.color || '#64748b',
                      color: bucket.textColor || '#fff'
                    }}
                  >
                    {bucket.label}
                  </span>
                )}
                {play.conceptFamily && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold bg-slate-500 text-white"
                  >
                    {play.conceptFamily}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toggles Row */}
        <div className="p-3 border-b border-slate-200 flex flex-wrap gap-2 items-center">
          <button
            onClick={handleTogglePriority}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
              isPriority
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
            }`}
          >
            <Star size={14} className={`inline mr-1 ${isPriority ? 'fill-amber-400' : ''}`} />
            Priority
          </button>
          <button
            onClick={handleToggleWiz}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
              isWiz
                ? 'border-violet-400 bg-violet-50 text-violet-700'
                : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
            }`}
          >
            <Zap size={14} className="inline mr-1" />
            Wiz
          </button>
          <button
            onClick={handleToggleMiniScript}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
              isMiniScript
                ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
            }`}
          >
            <FileText size={14} className="inline mr-1" />
            Mini Script
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors border-sky-400 bg-sky-50 text-sky-700 hover:bg-sky-100"
            >
              <Edit3 size={14} className="inline mr-1" />
              Edit
            </button>
          )}

          {/* Personnel Group */}
          <div className="flex items-center gap-1.5 ml-auto">
            <label htmlFor="play-details-personnel" className="text-sm font-semibold text-slate-500">PERS:</label>
            <input
              id="play-details-personnel"
              type="text"
              value={play.personnel || ''}
              onChange={(e) => onUpdatePlay?.(playId, { personnel: e.target.value })}
              className="w-12 px-2 py-1.5 text-sm font-semibold text-center border border-slate-300 rounded"
              placeholder="--"
            />
          </div>

          {/* Wristband Slot */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="play-details-wristband" className="text-sm font-semibold text-slate-500">WB:</label>
            <span className={`w-14 px-2 py-1.5 text-sm font-semibold text-center border rounded ${
              play.wristbandSlot
                ? 'border-sky-300 bg-sky-50 text-sky-700'
                : 'border-slate-300 text-slate-400'
            }`}>
              {getWristbandDisplay(play) || '--'}
            </span>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
        {/* New Play Toggle (if week context available) */}
        {currentWeek && (
          <div className="px-4 py-2 border-b border-slate-200">
            <button
              onClick={handleToggleNew}
              className={`w-full px-3 py-2 rounded-md text-sm font-semibold border transition-colors ${
                isNew
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
              }`}
            >
              {isNew ? '✓ Marked as NEW for this week' : 'Mark as NEW for this week'}
            </button>
          </div>
        )}

        {/* Formation Selection */}
        {formations.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Formation
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {formations
                .filter(f => !f.phase || f.phase === (play.phase || 'OFFENSE'))
                .map(form => {
                  const isSelected = play.formation === form.name || play.formation === form.label;
                  return (
                    <button
                      key={form.id || form.name}
                      onClick={() => onUpdatePlay?.(playId, { formation: form.name || form.label })}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-slate-700 text-white ring-2 ring-slate-500 ring-offset-1'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {form.name || form.label}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Bucket & Concept Group Selection - Side by Side Dropdowns */}
        <div className="p-4 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            {/* Bucket Selection */}
            <div>
              <label htmlFor="play-details-bucket" className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">
                Bucket
              </label>
              {phaseBuckets.length > 0 ? (
                <select
                  id="play-details-bucket"
                  value={play.bucketId || ''}
                  onChange={(e) => handleBucketChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-white border border-slate-300 rounded text-slate-700"
                  style={bucket ? {
                    backgroundColor: bucket.color || '#3b82f6',
                    color: bucket.textColor || '#fff',
                    borderColor: bucket.color || '#3b82f6'
                  } : {}}
                >
                  <option value="">Select Bucket...</option>
                  {phaseBuckets.map(b => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-400 italic py-1.5">
                  No buckets defined in Setup
                </div>
              )}
            </div>

            {/* Concept Group Selection */}
            <div>
              <label htmlFor="play-details-concept-group" className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">
                Concept Group
              </label>
              {phaseBuckets.length > 0 ? (
                <select
                  id="play-details-concept-group"
                  value={play.conceptFamily || ''}
                  onChange={(e) => handleFamilyChange(e.target.value)}
                  disabled={!play.bucketId || bucketConceptFamilies.length === 0}
                  className="w-full px-2 py-1.5 text-sm bg-white border border-slate-300 rounded text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!play.bucketId ? 'Select bucket first' : bucketConceptFamilies.length === 0 ? 'No groups available' : 'Select Group...'}
                  </option>
                  {bucketConceptFamilies.map(family => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-400 italic py-1.5">
                  Define buckets first
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Read Type, Series & Play Purpose */}
        <div className="p-4 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            {/* Read Type */}
            <div>
              <label htmlFor="play-details-read-type" className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                <Eye size={12} />
                Read Type
              </label>
              <select
                id="play-details-read-type"
                value={play.readType || ''}
                onChange={(e) => onUpdatePlay?.(playId, { readType: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700"
              >
                <option value="">No Read</option>
                {(setupConfig?.readTypes || []).map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>

            {/* Look-Alike Series */}
            <div>
              <label htmlFor="play-details-series" className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                <Layers size={12} />
                Series
              </label>
              <select
                id="play-details-series"
                value={play.seriesId || ''}
                onChange={(e) => onUpdatePlay?.(playId, { seriesId: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700"
              >
                <option value="">None</option>
                {(setupConfig?.lookAlikeSeries || []).map(series => (
                  <option key={series.id} value={series.id}>{series.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Play Purpose - from Quality Control Definitions */}
          {(setupConfig?.qualityControlDefinitions?.playPurposes?.length > 0) && (
            <div className="mt-3">
              <label htmlFor="play-details-purpose" className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                <Target size={12} />
                Play Purpose
              </label>
              <div className="flex flex-wrap gap-1">
                {(setupConfig?.qualityControlDefinitions?.playPurposes || []).map(purpose => {
                  const isSelected = play.playPurpose === purpose.id;
                  return (
                    <button
                      key={purpose.id}
                      onClick={() => onUpdatePlay?.(playId, {
                        playPurpose: isSelected ? '' : purpose.id
                      })}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        isSelected
                          ? 'ring-1 ring-offset-1'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: isSelected ? purpose.color : '#f1f5f9',
                        color: isSelected ? '#fff' : '#64748b',
                        ringColor: purpose.color
                      }}
                    >
                      {purpose.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Situations Section - only show if user has defined situations */}
        {(setupConfig?.fieldZones?.length > 0 || setupConfig?.downDistanceCategories?.length > 0 || setupConfig?.specialSituations?.length > 0) && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Situations</span>
              {((play.fieldZones?.length || 0) + (play.downDistance?.length || 0) + (play.situations?.length || 0)) > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-semibold">
                  {(play.fieldZones?.length || 0) + (play.downDistance?.length || 0) + (play.situations?.length || 0)}
                </span>
              )}
            </div>

            {/* Field Zones */}
            {setupConfig?.fieldZones?.length > 0 && (
              <div className="mb-3">
                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  <MapPin size={10} />
                  Field Zone
                </label>
                <div className="flex flex-wrap gap-1">
                  {setupConfig.fieldZones.map(zone => {
                    const isSelected = (play.fieldZones || []).includes(zone.id);
                    return (
                      <button
                        key={zone.id}
                        onClick={() => {
                          const current = play.fieldZones || [];
                          const updated = isSelected
                            ? current.filter(z => z !== zone.id)
                            : [...current, zone.id];
                          onUpdatePlay?.(playId, { fieldZones: updated });
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          isSelected
                            ? 'ring-1 ring-offset-1'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? zone.color : '#f1f5f9',
                          color: isSelected ? '#fff' : '#64748b',
                          ringColor: zone.color
                        }}
                      >
                        {zone.label || zone.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Down & Distance */}
            {setupConfig?.downDistanceCategories?.length > 0 && (
              <div className="mb-3">
                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  <Hash size={10} />
                  Down & Distance
                </label>
                <div className="flex flex-wrap gap-1">
                  {setupConfig.downDistanceCategories.map(dd => {
                    const isSelected = (play.downDistance || []).includes(dd.id);
                    return (
                      <button
                        key={dd.id}
                        onClick={() => {
                          const current = play.downDistance || [];
                          const updated = isSelected
                            ? current.filter(d => d !== dd.id)
                            : [...current, dd.id];
                          onUpdatePlay?.(playId, { downDistance: updated });
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          isSelected
                            ? 'ring-1 ring-offset-1'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? dd.color : '#f1f5f9',
                          color: isSelected ? '#fff' : '#64748b',
                          ringColor: dd.color
                        }}
                      >
                        {dd.label || dd.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Situations */}
            {setupConfig?.specialSituations?.length > 0 && (
              <div>
                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  <AlertTriangle size={10} />
                  Special Situations
                </label>
                <div className="flex flex-wrap gap-1">
                  {setupConfig.specialSituations.map(sit => {
                    const isSelected = (play.situations || []).includes(sit.id);
                    return (
                      <button
                        key={sit.id}
                        onClick={() => {
                          const current = play.situations || [];
                          const updated = isSelected
                            ? current.filter(s => s !== sit.id)
                            : [...current, sit.id];
                          onUpdatePlay?.(playId, { situations: updated });
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                          isSelected
                            ? 'ring-1 ring-offset-1'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? sit.color : '#f1f5f9',
                          color: isSelected ? '#fff' : '#64748b',
                          ringColor: sit.color
                        }}
                      >
                        {sit.label || sit.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Plan Intel Section */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-sky-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Game Plan Intel</span>
            {(play.playRating || play.playObjectives?.length > 0) && (
              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs rounded font-semibold">
                Tagged
              </span>
            )}
          </div>

          {/* Play Objectives */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              What Are We Trying To Accomplish?
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'efficiency', label: 'Base Efficiency', color: '#22c55e' },
                { id: 'convert', label: 'Convert', color: '#3b82f6' },
                { id: 'score', label: 'Score', color: '#ef4444' },
                { id: 'break-keys', label: 'Break Keys', color: '#f59e0b' },
                { id: 'chunk', label: 'Chunk', color: '#8b5cf6' },
                { id: 'safe', label: 'Safe', color: '#64748b' },
              ].map(obj => {
                const isSelected = (play.playObjectives || []).includes(obj.id);
                return (
                  <button
                    key={obj.id}
                    onClick={() => {
                      const current = play.playObjectives || [];
                      const updated = isSelected
                        ? current.filter(o => o !== obj.id)
                        : [...current, obj.id];
                      onUpdatePlay?.(playId, { playObjectives: updated });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      isSelected
                        ? 'ring-1 ring-offset-1'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? obj.color : '#f1f5f9',
                      color: isSelected ? '#fff' : '#64748b',
                      ringColor: obj.color
                    }}
                  >
                    {obj.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hash Preference */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Where Do We Like It?
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'left', label: '◀ Left' },
                { id: 'middle', label: '⬛ Middle' },
                { id: 'right', label: 'Right ▶' },
                { id: 'any', label: '↔ Any' },
              ].map(hash => {
                const isSelected = play.hashPreference === hash.id;
                return (
                  <button
                    key={hash.id}
                    onClick={() => onUpdatePlay?.(playId, { hashPreference: hash.id })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-sky-500 text-white ring-1 ring-sky-400 ring-offset-1'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {hash.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setup Play */}
          <div className="mb-3">
            <label htmlFor="play-details-setup-play" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Setup By Another Play?
            </label>
            <select
              id="play-details-setup-play"
              value={play.setupPlayId || ''}
              onChange={(e) => onUpdatePlay?.(playId, { setupPlayId: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700"
            >
              <option value="">No setup play</option>
              {samePhasePlays.map(p => (
                <option key={p.id} value={p.id}>
                  {p.formation ? `${p.formation} ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Premium Looks */}
          <div>
            <label htmlFor="play-details-premium-looks" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Premium Looks (Fronts/Coverages)
            </label>
            <input
              id="play-details-premium-looks"
              type="text"
              value={play.premiumLooks || ''}
              onChange={(e) => onUpdatePlay?.(playId, { premiumLooks: e.target.value })}
              placeholder="e.g., Cover 3, single-high, man-free..."
              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Complementary Plays Section */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Handshake size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Complementary Plays</span>
          </div>

          {/* Existing Complements */}
          {complementaryPlays.length > 0 && (
            <div className="space-y-2 mb-3">
              {complementaryPlays.map((comp, idx) => {
                const compPlay = getPlayById(comp.playId);
                const typeInfo = COMPLEMENT_TYPES.find(t => t.id === comp.type);
                if (!compPlay) return null;
                return (
                  <div
                    key={`${comp.playId}-${comp.type}-${idx}`}
                    className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ backgroundColor: typeInfo?.color || '#64748b', color: '#fff' }}
                      >
                        {typeInfo?.label || comp.type}
                      </span>
                      <span className="text-sm text-slate-700">
                        {compPlay.formation ? `${compPlay.formation} ` : ''}{compPlay.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveComplementary(comp.playId, comp.type)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Complement */}
          <div className="flex gap-2">
            <select
              id="complement-type-select"
              className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700"
              defaultValue=""
            >
              <option value="" disabled>Type...</option>
              {COMPLEMENT_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <select
              id="complement-play-select"
              className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700"
              defaultValue=""
              onChange={(e) => {
                const typeSelect = document.getElementById('complement-type-select');
                if (e.target.value && typeSelect.value) {
                  handleAddComplementary(e.target.value, typeSelect.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">Select play to add...</option>
              {samePhasePlays.map(p => (
                <option key={p.id} value={p.id}>
                  {p.formation ? `${p.formation} ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Play Info */}
        <div className="p-4">
          <div className="space-y-3 text-sm">
            {play.concept && (
              <div>
                <span className="text-slate-400 font-medium">Concept:</span>
                <span className="ml-2 text-slate-700">{play.concept}</span>
              </div>
            )}
            {play.notes && (
              <div>
                <span className="text-slate-400 font-medium">Notes:</span>
                <p className="mt-1 text-slate-600 text-sm">{play.notes}</p>
              </div>
            )}
          </div>
        </div>
        </div>{/* End Scrollable Content Area */}
      </div>

      {/* Create Series Prompt Modal */}
      {showSeriesPrompt && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 p-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Link2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Create a Series?</h3>
                <p className="text-sm text-slate-500">
                  You've linked {pendingSeriesPlays.length} plays together
                </p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Would you like to create a Look-Alike Series from these linked plays?
                Series make it easy to filter and view related plays together.
              </p>

              {/* Show linked plays */}
              <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Plays in series:</p>
                <div className="space-y-1">
                  {pendingSeriesPlays.map(pId => {
                    const p = getPlayById(pId);
                    if (!p) return null;
                    return (
                      <div key={pId} className="text-sm text-slate-700">
                        {p.formation ? `${p.formation} ` : ''}{p.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Series name input */}
              <div>
                <label htmlFor="play-details-new-series-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Series Name
                </label>
                <input
                  id="play-details-new-series-name"
                  type="text"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  placeholder="e.g., Inside Zone Series, Mesh Series..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowSeriesPrompt(false);
                  setPendingSeriesPlays([]);
                  setSeriesName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium"
              >
                No Thanks
              </button>
              <button
                onClick={handleCreateSeries}
                disabled={!seriesName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <Link2 size={16} />
                Create Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
