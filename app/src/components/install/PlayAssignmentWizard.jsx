import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  Check,
  Minus,
  Plus,
  LayoutGrid,
  Target,
  Clock
} from 'lucide-react';

// Large toggle chip for wizard categories
function WizardChip({ label, isActive, onClick, color, size = 'normal' }) {
  const sizeClasses = size === 'large'
    ? 'px-4 py-2 text-sm'
    : 'px-3 py-1.5 text-xs';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-lg font-medium transition-all ${
        isActive
          ? 'text-white shadow-md'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
      }`}
      style={isActive ? { backgroundColor: color || '#3b82f6' } : {}}
    >
      {label}
    </button>
  );
}

// Stepper input for target reps
function RepStepper({ value, onChange, scriptedReps, histReps }) {
  const handleDecrement = () => {
    onChange(Math.max(0, (value || 0) - 1));
  };

  const handleIncrement = () => {
    onChange((value || 0) + 1);
  };

  const handleInputChange = (e) => {
    const num = parseInt(e.target.value) || 0;
    onChange(Math.max(0, Math.min(99, num)));
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        <button
          onClick={handleDecrement}
          className="p-2 rounded-l-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          min="0"
          max="99"
          value={value || 0}
          onChange={handleInputChange}
          className="w-14 py-2 text-center text-lg font-bold bg-slate-800 border-y border-slate-700 text-white focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={handleIncrement}
          className="p-2 rounded-r-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="text-sm text-slate-400">
        <span className="mr-3">Scripted: <span className="text-slate-300 font-medium">{scriptedReps}</span></span>
        <span>Historical: <span className="text-slate-300 font-medium">{histReps}</span></span>
      </div>
    </div>
  );
}

// Flag toggle button
function FlagToggle({ label, isActive, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50'
          : 'bg-slate-700 text-slate-400 border border-transparent hover:bg-slate-600 hover:text-slate-200'
      }`}
    >
      {Icon && <Icon size={14} className={isActive ? 'fill-current' : ''} />}
      {label}
    </button>
  );
}

export default function PlayAssignmentWizard({
  isOpen,
  onClose,
  plays,
  currentIndex,
  totalPlays,
  remainingCount,
  processedPlayIds,
  onNext,
  onPrevious,
  onMarkProcessed,
  onUpdatePlayField,
  onTogglePlayInBox,
  onUpdateTargetReps,
  onToggleNewPlay,
  phaseBuckets,
  conceptGroups,
  callSheetBoxes,
  historicalReps,
  playRepTargets,
  newInstallIds,
  scriptedReps,
  isLight
}) {
  const currentPlay = plays[currentIndex];
  const isProcessed = processedPlayIds?.includes(currentPlay?.id);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't handle if focused on input
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          onPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          onMarkProcessed(currentPlay?.id);
          onNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case ' ':
          e.preventDefault();
          onMarkProcessed(currentPlay?.id);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPlay?.id, onNext, onPrevious, onMarkProcessed, onClose]);

  if (!isOpen || !currentPlay) return null;

  // Get bucket info for current play
  const currentBucket = phaseBuckets.find(b => b.id === currentPlay.bucketId);

  // Get concept families for the selected bucket
  const familiesForBucket = conceptGroups.filter(cg => cg.categoryId === currentPlay.bucketId);

  // Get current play's box assignments
  const getPlayBoxIds = () => {
    return callSheetBoxes
      .filter(box => box.playIds?.includes(currentPlay.id))
      .map(box => box.id);
  };
  const currentBoxIds = getPlayBoxIds();

  // Get rep stats
  const targetReps = playRepTargets?.[currentPlay.id] || 0;
  const histReps = historicalReps?.[currentPlay.id] || 0;
  const scriptReps = scriptedReps?.[currentPlay.id] || 0;
  const isNew = newInstallIds?.includes(currentPlay.id);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl mx-4 rounded-xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Play Assignment Wizard
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Play {currentIndex + 1} of {totalPlays} • {remainingCount} remaining
              </p>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">←</kbd> Prev</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">→</kbd> Next</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Enter</kbd> Done & Next</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Space</kbd> Toggle Done</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Esc</kbd> Close</span>
          </div>
        </div>

        {/* Play Info Card */}
        <div className="px-6 py-4">
          <div className={`rounded-lg p-4 ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onUpdatePlayField(currentPlay.id, 'priority', !currentPlay.priority)}
                  className={`p-1.5 rounded transition-colors ${
                    currentPlay.priority
                      ? 'text-amber-400 bg-amber-500/20'
                      : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                  }`}
                  title={currentPlay.priority ? 'Remove priority' : 'Mark as priority'}
                >
                  <Star size={18} className={currentPlay.priority ? 'fill-amber-400' : ''} />
                </button>
                <button
                  onClick={() => onToggleNewPlay(currentPlay.id)}
                  className={`p-1.5 rounded transition-colors ${
                    isNew
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title={isNew ? 'Remove new marker' : 'Mark as new'}
                >
                  <Sparkles size={18} className={isNew ? 'fill-emerald-400' : ''} />
                </button>
                <div>
                  <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {currentPlay.formation ? `${currentPlay.formation} ${currentPlay.name}` : currentPlay.name}
                  </h3>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                    Personnel: {currentPlay.personnel || 'N/A'}
                    {currentBucket && (
                      <> • Currently: <span style={{ color: currentBucket.color }}>{currentBucket.label}</span></>
                    )}
                    {currentPlay.conceptFamily && ` > ${currentPlay.conceptFamily}`}
                  </p>
                </div>
              </div>
              {isProcessed && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                  <Check size={14} />
                  Done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Categories */}
        <div className="px-6 pb-4 space-y-5">
          {/* Bucket */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`text-xs font-semibold uppercase tracking-wide ${
                isLight ? 'text-gray-500' : 'text-slate-500'
              }`}>
                Bucket
              </label>
              <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-600'}`}>
                — Primary play category (Run, Pass, RPO, etc.)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {phaseBuckets.map((bucket) => (
                <WizardChip
                  key={bucket.id}
                  label={bucket.label}
                  isActive={currentPlay.bucketId === bucket.id}
                  onClick={() => onUpdatePlayField(
                    currentPlay.id,
                    'bucketId',
                    currentPlay.bucketId === bucket.id ? null : bucket.id
                  )}
                  color={bucket.color}
                  size="large"
                />
              ))}
            </div>
          </div>

          {/* Concept Family */}
          {familiesForBucket.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className={`text-xs font-semibold uppercase tracking-wide ${
                  isLight ? 'text-gray-500' : 'text-slate-500'
                }`}>
                  Concept Family
                </label>
                <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-600'}`}>
                  — Group plays by scheme concept (e.g., Inside Zone, Power, Mesh) for game plan organization
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {familiesForBucket.map((family) => (
                  <WizardChip
                    key={family.id}
                    label={family.label}
                    isActive={currentPlay.conceptFamily === family.label}
                    onClick={() => onUpdatePlayField(
                      currentPlay.id,
                      'conceptFamily',
                      currentPlay.conceptFamily === family.label ? null : family.label
                    )}
                    color="#64748b"
                    size="large"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Call Sheet Boxes */}
          {callSheetBoxes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className={`text-xs font-semibold uppercase tracking-wide ${
                  isLight ? 'text-gray-500' : 'text-slate-500'
                }`}>
                  Call Sheet Boxes
                </label>
                <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-600'}`}>
                  — Situational groups for your game day call sheet (1st Down, Red Zone, etc.)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {callSheetBoxes.map((box) => (
                  <WizardChip
                    key={box.id}
                    label={box.label}
                    isActive={currentBoxIds.includes(box.id)}
                    onClick={() => onTogglePlayInBox(currentPlay.id, box.id)}
                    color={box.color}
                    size="large"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Target Reps and Flags Row */}
          <div className="flex flex-wrap items-end gap-8">
            {/* Target Reps */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                isLight ? 'text-gray-500' : 'text-slate-500'
              }`}>
                Target Reps
              </label>
              <RepStepper
                value={targetReps}
                onChange={(val) => onUpdateTargetReps(currentPlay.id, val)}
                scriptedReps={scriptReps}
                histReps={histReps}
              />
            </div>

            {/* Flags */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                isLight ? 'text-gray-500' : 'text-slate-500'
              }`}>
                Flags
              </label>
              <div className="flex gap-2">
                <FlagToggle
                  label="Priority"
                  isActive={currentPlay.priority}
                  onClick={() => onUpdatePlayField(currentPlay.id, 'priority', !currentPlay.priority)}
                  icon={Star}
                />
                <FlagToggle
                  label="New"
                  isActive={isNew}
                  onClick={() => onToggleNewPlay(currentPlay.id)}
                  icon={Sparkles}
                />
                <FlagToggle
                  label="Needs WIZ"
                  isActive={currentPlay.needsWiz}
                  onClick={() => onUpdatePlayField(currentPlay.id, 'needsWiz', !currentPlay.needsWiz)}
                  icon={LayoutGrid}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className={`px-6 py-4 border-t ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentIndex === 0
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-500'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              <ChevronLeft size={16} />
              Previous Play
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onMarkProcessed(currentPlay.id);
                  onNext();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                <Check size={16} />
                {isProcessed ? 'Next Play' : 'Mark Done & Next'}
              </button>
            </div>

            <button
              onClick={onNext}
              disabled={currentIndex === totalPlays - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentIndex === totalPlays - 1
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-500'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              Next Play
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex justify-center mt-3">
            <button
              onClick={onClose}
              className={`text-sm ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Close Wizard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
