import { useState, useCallback, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Tags,
  PenTool,
  MessageSquare
} from 'lucide-react';

// Step indicator component
function StepIndicator({ steps, currentStep, isLight }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-500 text-white'
                  : isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isLight
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isCompleted ? <Check size={14} /> : index + 1}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                isActive
                  ? isLight ? 'text-gray-900 font-medium' : 'text-white font-medium'
                  : isLight ? 'text-gray-500' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isLight ? 'bg-gray-200' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Chip component for selections
function SelectionChip({ label, isActive, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
          : isActive
          ? 'text-white shadow-md'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
      }`}
      style={isActive ? { backgroundColor: color || '#a855f7' } : {}}
    >
      {label}
    </button>
  );
}

// Formation autocomplete/input
function FormationInput({ value, onChange, formations, isLight }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredFormations = useMemo(() => {
    if (!value) return formations.slice(0, 10);
    const term = value.toLowerCase();
    return formations.filter(f => f.toLowerCase().includes(term)).slice(0, 10);
  }, [value, formations]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="e.g., GUN TRIPS RIGHT"
        className={`w-full px-3 py-2 rounded-lg text-sm ${
          isLight
            ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
            : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
        } focus:outline-none`}
      />
      {showSuggestions && filteredFormations.length > 0 && (
        <div
          className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto ${
            isLight ? 'bg-white border border-gray-200' : 'bg-slate-800 border border-slate-700'
          }`}
        >
          {filteredFormations.map((formation, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(formation);
                setShowSuggestions(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm ${
                isLight
                  ? 'hover:bg-gray-100 text-gray-900'
                  : 'hover:bg-slate-700 text-white'
              }`}
            >
              {formation}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: FileText },
  { id: 'category', label: 'Categorization', icon: Tags },
  { id: 'diagram', label: 'Diagram', icon: PenTool },
  { id: 'notes', label: 'Notes', icon: MessageSquare }
];

export default function PlaySuggestionWizard({
  isOpen,
  onClose,
  onSubmit,
  setupConfig,
  activePhase,
  callSheetBoxes,
  phaseBuckets,
  conceptGroups,
  isLight
}) {
  const [currentStep, setCurrentStep] = useState(0);

  // Form data
  const [playData, setPlayData] = useState({
    name: '',
    formation: '',
    personnel: ''
  });

  const [gamePlanTags, setGamePlanTags] = useState({
    bucketId: null,
    conceptFamily: null,
    callSheetBoxes: []
  });

  const [diagramData, setDiagramData] = useState(null);
  const [notes, setNotes] = useState('');

  // Reset form when opening
  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setPlayData({ name: '', formation: '', personnel: '' });
    setGamePlanTags({ bucketId: null, conceptFamily: null, callSheetBoxes: [] });
    setDiagramData(null);
    setNotes('');
  }, []);

  // Get formations from plays in setupConfig or use common ones
  const formations = useMemo(() => {
    const formationSet = new Set();
    // Add some common formations
    ['GUN TRIPS RIGHT', 'GUN TRIPS LEFT', 'GUN DOUBLES RIGHT', 'GUN DOUBLES LEFT',
     'PISTOL TRIPS RIGHT', 'PISTOL TRIPS LEFT', 'I-FORM PRO RIGHT', 'I-FORM PRO LEFT',
     'SINGLEBACK ACE', 'GUN EMPTY TREY', 'GUN BUNCH RIGHT', 'GUN BUNCH LEFT'
    ].forEach(f => formationSet.add(f));

    // Could also pull from existing plays in the future
    return Array.from(formationSet).sort();
  }, []);

  // Personnel options
  const personnelOptions = useMemo(() => {
    return setupConfig?.personnelGroupings || ['11', '12', '21', '22', '10', '20', '13'];
  }, [setupConfig?.personnelGroupings]);

  // Concept families for selected bucket
  const familiesForBucket = useMemo(() => {
    return (conceptGroups || []).filter(cg => cg.categoryId === gamePlanTags.bucketId);
  }, [conceptGroups, gamePlanTags.bucketId]);

  // Validation
  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 0: // Basic Info
        return playData.name.trim().length > 0;
      case 1: // Categorization
        return true; // Optional
      case 2: // Diagram
        return true; // Optional
      case 3: // Notes
        return true;
      default:
        return false;
    }
  }, [currentStep, playData.name]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      playData: {
        name: playData.name.trim(),
        formation: playData.formation.trim(),
        personnel: playData.personnel,
        phase: activePhase,
        diagramData: diagramData
      },
      gamePlanTags,
      notes: notes.trim()
    });
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Suggest a Play
            </h2>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <StepIndicator steps={STEPS} currentStep={currentStep} isLight={isLight} />
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[300px]">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Play Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={playData.name}
                  onChange={(e) => setPlayData({ ...playData, name: e.target.value })}
                  placeholder="e.g., Mesh Switch"
                  autoFocus
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    isLight
                      ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                      : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Formation
                </label>
                <FormationInput
                  value={playData.formation}
                  onChange={(val) => setPlayData({ ...playData, formation: val })}
                  formations={formations}
                  isLight={isLight}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Personnel
                </label>
                <div className="flex flex-wrap gap-2">
                  {personnelOptions.map((pers) => (
                    <SelectionChip
                      key={pers}
                      label={pers}
                      isActive={playData.personnel === pers}
                      onClick={() => setPlayData({
                        ...playData,
                        personnel: playData.personnel === pers ? '' : pers
                      })}
                      color="#6366f1"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Categorization */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Bucket
                </label>
                <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Suggest which category this play belongs to
                </p>
                <div className="flex flex-wrap gap-2">
                  {phaseBuckets.map((bucket) => (
                    <SelectionChip
                      key={bucket.id}
                      label={bucket.label}
                      isActive={gamePlanTags.bucketId === bucket.id}
                      onClick={() => setGamePlanTags({
                        ...gamePlanTags,
                        bucketId: gamePlanTags.bucketId === bucket.id ? null : bucket.id,
                        conceptFamily: null // Reset concept when bucket changes
                      })}
                      color={bucket.color}
                    />
                  ))}
                </div>
              </div>

              {familiesForBucket.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isLight ? 'text-gray-700' : 'text-slate-300'
                  }`}>
                    Concept Family
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {familiesForBucket.map((family) => (
                      <SelectionChip
                        key={family.id}
                        label={family.label}
                        isActive={gamePlanTags.conceptFamily === family.label}
                        onClick={() => setGamePlanTags({
                          ...gamePlanTags,
                          conceptFamily: gamePlanTags.conceptFamily === family.label ? null : family.label
                        })}
                        color="#64748b"
                      />
                    ))}
                  </div>
                </div>
              )}

              {callSheetBoxes.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isLight ? 'text-gray-700' : 'text-slate-300'
                  }`}>
                    Suggested Call Sheet Boxes
                  </label>
                  <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    Which situations would this play be good for?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {callSheetBoxes.map((box) => (
                      <SelectionChip
                        key={box.id}
                        label={box.label}
                        isActive={gamePlanTags.callSheetBoxes.includes(box.id)}
                        onClick={() => {
                          const current = gamePlanTags.callSheetBoxes;
                          setGamePlanTags({
                            ...gamePlanTags,
                            callSheetBoxes: current.includes(box.id)
                              ? current.filter(id => id !== box.id)
                              : [...current, box.id]
                          });
                        }}
                        color={box.color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Diagram (Optional) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
                isLight ? 'border-gray-300 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
              }`}>
                <PenTool size={48} className={`mx-auto mb-4 ${
                  isLight ? 'text-gray-400' : 'text-slate-500'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Diagram (Optional)
                </h3>
                <p className={`text-sm mb-4 ${
                  isLight ? 'text-gray-500' : 'text-slate-500'
                }`}>
                  The diagram editor will be available in a future update.
                  <br />
                  For now, describe the play in the notes section.
                </p>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  Skip to Notes
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Notes */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Notes & Rationale
                </label>
                <p className={`text-xs mb-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Explain why this play would be a good addition. Include any relevant details
                  about the concept, when to use it, or what you saw in film.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Saw this work well against Cover 3 in film study. Would complement our existing mesh concept and give us another option when they bracket the crossers."
                  rows={6}
                  className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                    isLight
                      ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                      : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                  } focus:outline-none`}
                />
                <div className={`text-xs text-right mt-1 ${
                  isLight ? 'text-gray-400' : 'text-slate-500'
                }`}>
                  {notes.length} / 500 characters
                </div>
              </div>

              {/* Summary Preview */}
              <div className={`rounded-lg p-4 ${
                isLight ? 'bg-gray-100' : 'bg-slate-800'
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${
                  isLight ? 'text-gray-700' : 'text-slate-300'
                }`}>
                  Suggestion Summary
                </h4>
                <div className={`text-sm space-y-1 ${
                  isLight ? 'text-gray-600' : 'text-slate-400'
                }`}>
                  <p>
                    <strong>Play:</strong> {playData.formation && `${playData.formation} `}{playData.name || '(unnamed)'}
                  </p>
                  {playData.personnel && <p><strong>Personnel:</strong> {playData.personnel}</p>}
                  {gamePlanTags.bucketId && (
                    <p>
                      <strong>Bucket:</strong> {phaseBuckets.find(b => b.id === gamePlanTags.bucketId)?.label || gamePlanTags.bucketId}
                    </p>
                  )}
                  {gamePlanTags.conceptFamily && (
                    <p><strong>Concept:</strong> {gamePlanTags.conceptFamily}</p>
                  )}
                  {gamePlanTags.callSheetBoxes.length > 0 && (
                    <p>
                      <strong>Boxes:</strong> {gamePlanTags.callSheetBoxes.map(id =>
                        callSheetBoxes.find(b => b.id === id)?.label || id
                      ).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
        }`}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-500'
                : isLight
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !canAdvance
                    ? 'opacity-50 cursor-not-allowed bg-purple-500 text-white'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!playData.name.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !playData.name.trim()
                    ? 'opacity-50 cursor-not-allowed bg-emerald-500 text-white'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                <Check size={16} />
                Submit Suggestion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
