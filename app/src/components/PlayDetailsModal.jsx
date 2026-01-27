import { useState, useEffect, createContext, useContext } from 'react';
import { X, Star, Zap, FileText, Handshake } from 'lucide-react';

// Context for opening PlayDetailsModal from anywhere
const PlayDetailsModalContext = createContext({
  openPlayDetails: () => {},
  closePlayDetails: () => {}
});

export const usePlayDetailsModal = () => useContext(PlayDetailsModalContext);

// Provider component that wraps the app
export function PlayDetailsModalProvider({ children, plays, updatePlay, playBuckets, conceptGroups, formations, currentWeek, updateWeek }) {
  const [modalState, setModalState] = useState({ isOpen: false, playId: null });

  const openPlayDetails = (playId) => {
    setModalState({ isOpen: true, playId });
  };

  const closePlayDetails = () => {
    setModalState({ isOpen: false, playId: null });
  };

  return (
    <PlayDetailsModalContext.Provider value={{ openPlayDetails, closePlayDetails }}>
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
  onUpdateWeek
}) {
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
  const conceptFamily = conceptGroups.find(cf => cf.label === play.conceptFamily && cf.categoryId === play.bucketId);

  // Filter buckets by play's phase
  const phaseBuckets = playBuckets.filter(b =>
    (b.phase || 'OFFENSE') === (play.phase || 'OFFENSE')
  );

  // Get concept families for selected bucket
  const bucketConceptFamilies = play.bucketId
    ? conceptGroups.filter(cf => cf.categoryId === play.bucketId)
    : [];

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

  const handleBucketSelect = (bucketId) => {
    const isSelected = play.bucketId === bucketId;
    onUpdatePlay?.(playId, {
      bucketId: isSelected ? null : bucketId,
      conceptFamily: isSelected ? null : play.conceptFamily
    });
  };

  const handleFamilySelect = (familyLabel) => {
    const isSelected = play.conceptFamily === familyLabel;
    onUpdatePlay?.(playId, {
      conceptFamily: isSelected ? null : familyLabel
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
    onUpdatePlay?.(playId, { complementaryPlays: [...complementaryPlays, { playId: targetPlayId, type }] });
  };

  const handleRemoveComplementary = (targetPlayId, type) => {
    onUpdatePlay?.(playId, {
      complementaryPlays: complementaryPlays.filter(c => !(c.playId === targetPlayId && c.type === type))
    });
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
        className="bg-white w-[420px] max-h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden"
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
            {(bucket || conceptFamily) && (
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
                {conceptFamily && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: conceptFamily.color || '#94a3b8',
                      color: conceptFamily.textColor || '#fff'
                    }}
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

          {/* Personnel Group */}
          <div className="flex items-center gap-1.5 ml-auto">
            <label className="text-sm font-semibold text-slate-500">PERS:</label>
            <input
              type="text"
              value={play.personnel || ''}
              onChange={(e) => onUpdatePlay?.(playId, { personnel: e.target.value })}
              className="w-12 px-2 py-1.5 text-sm font-semibold text-center border border-slate-300 rounded"
              placeholder="--"
            />
          </div>

          {/* Wristband Slot */}
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-semibold text-slate-500">WB:</label>
            <input
              type="text"
              value={play.wristbandSlot || ''}
              onChange={(e) => handleWristbandChange(e.target.value)}
              className="w-14 px-2 py-1.5 text-sm font-semibold text-center border border-slate-300 rounded"
              placeholder="--"
            />
          </div>
        </div>

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

        {/* Bucket Selection */}
        {phaseBuckets.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Bucket
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phaseBuckets.map(b => {
                const isSelected = play.bucketId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleBucketSelect(b.id)}
                    className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                    style={isSelected ? {
                      backgroundColor: b.color || '#3b82f6',
                      color: b.textColor || '#fff',
                      ringColor: b.color || '#3b82f6'
                    } : {
                      backgroundColor: 'white',
                      color: '#64748b'
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Concept Group Selection */}
        {bucketConceptFamilies.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Concept Group
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bucketConceptFamilies.map(cf => {
                const isSelected = play.conceptFamily === cf.label;
                return (
                  <button
                    key={cf.id}
                    onClick={() => handleFamilySelect(cf.label)}
                    className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                    style={isSelected ? {
                      backgroundColor: cf.color || '#64748b',
                      color: cf.textColor || '#fff',
                      ringColor: cf.color || '#64748b'
                    } : {
                      backgroundColor: 'white',
                      color: '#64748b'
                    }}
                  >
                    {cf.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
        <div className="p-4 flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
