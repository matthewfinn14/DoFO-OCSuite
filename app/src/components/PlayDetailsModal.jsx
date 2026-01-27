import { useState, useEffect, createContext, useContext } from 'react';
import { X, Star, Zap, FileText } from 'lucide-react';

// Context for opening PlayDetailsModal from anywhere
const PlayDetailsModalContext = createContext({
  openPlayDetails: () => {},
  closePlayDetails: () => {}
});

export const usePlayDetailsModal = () => useContext(PlayDetailsModalContext);

// Provider component that wraps the app
export function PlayDetailsModalProvider({ children, plays, updatePlay, playCategories, playBuckets, currentWeek, updateWeek }) {
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
          playCategories={playCategories}
          playBuckets={playBuckets}
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
  playCategories = [],
  playBuckets = [],
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

  // Get the category and family for display
  const category = playCategories.find(c => c.id === play.bucketId);
  const family = playBuckets.find(b => b.label === play.conceptFamily && b.categoryId === play.bucketId);

  // Filter categories by play's phase
  const phaseCategories = playCategories.filter(c =>
    (c.phase || 'OFFENSE') === (play.phase || 'OFFENSE')
  );

  // Get families for selected bucket
  const bucketFamilies = play.bucketId
    ? playBuckets.filter(b => b.categoryId === play.bucketId)
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
            <h3 className="text-xl font-bold text-slate-900">
              {play.formation && <span className="text-slate-500">{play.formation} </span>}
              {play.name}
            </h3>
            {/* Category and Family badges */}
            {(category || family) && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {category && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: category.color || '#64748b',
                      color: category.textColor || '#fff'
                    }}
                  >
                    {category.label}
                  </span>
                )}
                {family && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: family.color || '#94a3b8',
                      color: family.textColor || '#fff'
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

          {/* Wristband Slot */}
          <div className="flex items-center gap-1.5 ml-auto">
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

        {/* Bucket Selection */}
        {phaseCategories.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Bucket
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phaseCategories.map(cat => {
                const isSelected = play.bucketId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleBucketSelect(cat.id)}
                    className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                    style={isSelected ? {
                      backgroundColor: cat.color || '#3b82f6',
                      color: cat.textColor || '#fff',
                      ringColor: cat.color || '#3b82f6'
                    } : {
                      backgroundColor: 'white',
                      color: '#64748b'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Concept Family Selection */}
        {bucketFamilies.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Concept Family
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bucketFamilies.map(fam => {
                const isSelected = play.conceptFamily === fam.label;
                return (
                  <button
                    key={fam.id}
                    onClick={() => handleFamilySelect(fam.label)}
                    className={`px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                    style={isSelected ? {
                      backgroundColor: fam.color || '#64748b',
                      color: fam.textColor || '#fff',
                      ringColor: fam.color || '#64748b'
                    } : {
                      backgroundColor: 'white',
                      color: '#64748b'
                    }}
                  >
                    {fam.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
