import { useState, useEffect, useCallback } from 'react';
import { X, Volume2, AlertCircle, Check, Mic, MicOff, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { VoiceTranscriptBox } from './VoiceTranscriptBox';
import { VoiceControlBar } from './VoiceControlBar';
import { WizardStepIndicator } from './WizardStepIndicator';
import {
  WIZARD_STEPS,
  TOTAL_STEPS,
  getFieldValue,
  setFieldValue,
} from './wizardSteps';

/**
 * Voice-Guided Program Alignment Wizard
 * Walks coaches through culture setup using TTS and speech recognition
 */
export function VoiceAlignmentWizard({
  isOpen,
  onClose,
  culture,
  onSave,
  isLight = false,
}) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [pendingChanges, setPendingChanges] = useState({});
  const [showReview, setShowReview] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [manualInput, setManualInput] = useState('');

  // Speech hooks
  const {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    formattedTranscript,
    error: recognitionError,
    isSupported: recognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    clearError: clearRecognitionError,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    error: synthesisError,
    isSupported: synthesisSupported,
    speak,
    stop: stopSpeaking,
    clearError: clearSynthesisError,
  } = useSpeechSynthesis();

  // Current step data
  const step = WIZARD_STEPS[currentStep];
  const currentValue = step ? getFieldValue(pendingChanges, step.field) || getFieldValue(culture, step.field) : '';

  // Check if we have new input to accept
  // Use formatted transcript (with punctuation) for voice input, raw for manual
  const hasNewInput = fullTranscript.trim() || manualInput.trim();
  const inputToSave = formattedTranscript || manualInput.trim();

  // Speak the current prompt when step changes
  useEffect(() => {
    if (!showWelcome && !showReview && step && synthesisSupported) {
      // Small delay to let UI update first
      const timer = setTimeout(() => {
        speak(step.prompt, {
          rate: 0.95,
          onEnd: () => {
            // Auto-start listening after prompt finishes (if supported)
            if (recognitionSupported && !isListening) {
              startListening();
            }
          },
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showWelcome, showReview]);

  // Reset transcript when step changes
  useEffect(() => {
    resetTranscript();
    setManualInput('');
  }, [currentStep, resetTranscript]);

  // Handle accept
  const handleAccept = useCallback(() => {
    if (!inputToSave || !step) return;

    stopListening();
    stopSpeaking();

    // Handle array fields (Big Three)
    let valueToSave = inputToSave;
    if (step.isArray) {
      // Split by common delimiters and take first 3
      const items = inputToSave
        .split(/[,;.\n]|(?:and)|(?:number \d)|(?:\d\.)/i)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 3);
      // Pad to 3 items
      while (items.length < 3) items.push('');
      valueToSave = items;
    }

    // Update pending changes
    const updated = setFieldValue(pendingChanges, step.field, valueToSave);
    setPendingChanges(updated);

    // Mark step completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Move to next step or review
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowReview(true);
    }
  }, [inputToSave, step, currentStep, pendingChanges, completedSteps, stopListening, stopSpeaking]);

  // Handle skip
  const handleSkip = useCallback(() => {
    stopListening();
    stopSpeaking();

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowReview(true);
    }
  }, [currentStep, stopListening, stopSpeaking]);

  // Handle previous
  const handlePrevious = useCallback(() => {
    stopListening();
    stopSpeaking();

    if (showReview) {
      setShowReview(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, showReview, stopListening, stopSpeaking]);

  // Handle retry
  const handleRetry = useCallback(() => {
    resetTranscript();
    setManualInput('');
    if (recognitionSupported) {
      startListening();
    }
  }, [resetTranscript, recognitionSupported, startListening]);

  // Handle save all
  const handleSaveAll = useCallback(() => {
    stopSpeaking();

    // Merge pending changes with current culture
    const merged = { ...culture };

    // Apply all pending changes
    Object.keys(pendingChanges).forEach(key => {
      if (key === 'standards' || key === 'positionBigThree') {
        merged[key] = { ...merged[key], ...pendingChanges[key] };
      } else {
        merged[key] = pendingChanges[key];
      }
    });

    onSave(merged);
    onClose();
  }, [culture, pendingChanges, onSave, onClose, stopSpeaking]);

  // Handle start wizard
  const handleStartWizard = useCallback(() => {
    setShowWelcome(false);
    setCurrentStep(0);
    setPendingChanges({});
    setCompletedSteps([]);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    stopListening();
    stopSpeaking();
    onClose();
  }, [stopListening, stopSpeaking, onClose]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true);
      setShowReview(false);
      setCurrentStep(0);
      setPendingChanges({});
      setCompletedSteps([]);
      resetTranscript();
      setManualInput('');
    }
  }, [isOpen, resetTranscript]);

  if (!isOpen) return null;

  const bothSupported = recognitionSupported && synthesisSupported;
  const anyError = recognitionError || synthesisError;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden ${isLight ? 'bg-white' : 'bg-slate-900'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center gap-3">
            <Sparkles className="text-sky-500" size={24} />
            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              DoFO Guided Setup
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {!showWelcome && !showReview && (
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Step {currentStep + 1} of {TOTAL_STEPS}
              </span>
            )}
            <button
              onClick={handleClose}
              className={`p-1 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[400px] flex-1 flex flex-col overflow-hidden">
          {/* Welcome Screen */}
          {showWelcome && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isLight ? 'bg-sky-100' : 'bg-sky-500/20'}`}>
                <Mic size={40} className="text-sky-500" />
              </div>
              <div className="space-y-2">
                <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  Welcome to DoFO Guided Setup
                </h3>
                <p className={`max-w-md ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  This wizard will walk you through setting up your program's alignment.
                  I'll ask questions and you can respond by voice or typing.
                </p>
              </div>

              {/* Browser support check */}
              <div className={`w-full max-w-sm rounded-lg p-4 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800 border border-slate-700'}`}>
                <h4 className={`text-sm font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  Browser Compatibility
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                      <Volume2 size={14} className="inline mr-2" />
                      Text-to-Speech
                    </span>
                    {synthesisSupported ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Check size={14} /> Supported
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        <X size={14} /> Not available
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                      <Mic size={14} className="inline mr-2" />
                      Speech Recognition
                    </span>
                    {recognitionSupported ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Check size={14} /> Supported
                      </span>
                    ) : (
                      <span className="text-orange-500 flex items-center gap-1">
                        <MicOff size={14} /> Type-only mode
                      </span>
                    )}
                  </div>
                </div>
                {!recognitionSupported && (
                  <p className={`text-xs mt-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    For voice input, use Chrome or Edge. You can still type your responses.
                  </p>
                )}
              </div>

              <button
                onClick={handleStartWizard}
                className="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
              >
                Start Setup
              </button>
            </div>
          )}

          {/* Step Content */}
          {!showWelcome && !showReview && step && (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Progress indicator */}
              <WizardStepIndicator
                currentStep={currentStep}
                totalSteps={TOTAL_STEPS}
                completedSteps={completedSteps}
                isLight={isLight}
              />

              {/* Category & label */}
              <div className="text-center">
                <span className={`text-xs uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                  {step.category}
                </span>
                <h3 className={`text-lg font-semibold mt-1 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {step.label}
                </h3>
              </div>

              {/* Prompt */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isLight ? 'bg-sky-50 border border-sky-100' : 'bg-sky-500/10 border border-sky-500/20'}`}>
                <Volume2
                  size={20}
                  className={`text-sky-500 flex-shrink-0 ${isSpeaking ? 'animate-pulse' : ''}`}
                />
                <p className={`text-sm ${isLight ? 'text-sky-800' : 'text-sky-200'}`}>
                  "{step.prompt}"
                </p>
              </div>

              {/* Current value (if exists) */}
              {currentValue && (typeof currentValue === 'string' ? currentValue.trim() : currentValue.some(v => v)) && (
                <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  <span className="font-medium">Current: </span>
                  {Array.isArray(currentValue)
                    ? currentValue.filter(v => v).join(', ') || 'Not set'
                    : currentValue
                  }
                </div>
              )}

              {/* Transcript box - show formatted when done, raw while listening */}
              <VoiceTranscriptBox
                transcript={isListening ? fullTranscript : (formattedTranscript || manualInput)}
                interimTranscript={interimTranscript}
                isListening={isListening}
                isSpeaking={isSpeaking}
                placeholder={recognitionSupported
                  ? "Click 'Speak' or start typing..."
                  : "Type your response..."
                }
                isLight={isLight}
              />

              {/* Manual input (always available) */}
              <textarea
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  if (fullTranscript) resetTranscript();
                }}
                placeholder={step.placeholder}
                rows={2}
                className={`w-full p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 ${isLight
                  ? 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400'
                  : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
                }`}
              />

              {/* Examples */}
              {step.examples && step.examples.length > 0 && (
                <div className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span className="font-medium">Examples: </span>
                  {step.examples.join(' | ')}
                </div>
              )}

              {/* Error display */}
              {anyError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  <span>{recognitionError || synthesisError}</span>
                  <button
                    onClick={() => {
                      clearRecognitionError();
                      clearSynthesisError();
                    }}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Control bar */}
              <VoiceControlBar
                isListening={isListening}
                onStartListening={startListening}
                onStopListening={stopListening}
                speechRecognitionSupported={recognitionSupported}
                isSpeaking={isSpeaking}
                onStopSpeaking={stopSpeaking}
                onPrevious={handlePrevious}
                onSkip={handleSkip}
                onAccept={handleAccept}
                onRetry={handleRetry}
                canGoBack={currentStep > 0}
                canAccept={!!hasNewInput}
                isLastStep={currentStep === TOTAL_STEPS - 1}
                isLight={isLight}
              />
            </div>
          )}

          {/* Review Screen */}
          {showReview && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="text-center mb-4">
                <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  Review Your Answers
                </h3>
                <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {completedSteps.length} of {TOTAL_STEPS} fields completed
                </p>
              </div>

              {/* Scrollable list of changes */}
              <div className={`flex-1 min-h-0 overflow-y-auto rounded-lg p-4 space-y-3 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800 border border-slate-700'}`}>
                {WIZARD_STEPS.map((s, idx) => {
                  const value = getFieldValue(pendingChanges, s.field);
                  const hasValue = value && (Array.isArray(value) ? value.some(v => v) : value.trim());

                  return (
                    <div
                      key={s.id}
                      className={`flex items-start gap-3 p-2 rounded ${hasValue
                        ? (isLight ? 'bg-emerald-50' : 'bg-emerald-500/10')
                        : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hasValue
                        ? 'bg-emerald-500 text-white'
                        : (isLight ? 'bg-gray-200' : 'bg-slate-700')
                      }`}>
                        {hasValue ? <Check size={12} /> : <span className="text-xs">{idx + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                          {s.label}
                        </div>
                        {hasValue ? (
                          <div className={`text-sm truncate ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                            {Array.isArray(value) ? value.filter(v => v).join(', ') : value}
                          </div>
                        ) : (
                          <div className={`text-sm italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                            Skipped
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handlePrevious}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${isLight
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={completedSteps.length === 0}
                  className="px-6 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check size={18} />
                  Save All Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceAlignmentWizard;
