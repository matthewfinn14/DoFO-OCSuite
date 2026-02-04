import { useState } from 'react';
import { ChevronLeft, ChevronRight, SkipForward, Clock, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { WizardAudioGuide } from './WizardAudioGuide';
import { getFullAudioScript } from './SystemSetupSteps';

/**
 * Individual slide wrapper for wizard steps
 * Contains header, audio guide, content area, and navigation footer
 *
 * @param {Object} props
 * @param {Object} props.step - Step definition object
 * @param {number} props.currentStepNumber - Current step number (1-indexed)
 * @param {number} props.totalSteps - Total number of steps
 * @param {boolean} props.audioEnabled - Whether audio is enabled
 * @param {Function} props.onToggleAudio - Callback to toggle audio
 * @param {Function} props.onPrevious - Callback for previous button
 * @param {Function} props.onSkip - Callback for skip button
 * @param {Function} props.onContinue - Callback for continue button
 * @param {boolean} props.isFirstStep - Whether this is the first step
 * @param {boolean} props.isLastStep - Whether this is the last step
 * @param {boolean} props.isLight - Light theme flag
 * @param {React.ReactNode} props.children - Tab content to render
 */
export function WizardSlide({
  step,
  currentStepNumber,
  totalSteps,
  audioEnabled,
  onToggleAudio,
  onPrevious,
  onSkip,
  onContinue,
  isFirstStep,
  isLastStep,
  isLight = false,
  children
}) {
  // Show transcript by default if audio is disabled
  const [showTranscript, setShowTranscript] = useState(!audioEnabled);

  if (!step) return null;

  const audioScript = getFullAudioScript(step);
  const { audio } = step;

  // Theme classes
  const bgClass = isLight ? 'bg-white' : 'bg-slate-900';
  const borderClass = isLight ? 'border-gray-200' : 'border-slate-700';
  const textPrimaryClass = isLight ? 'text-gray-900' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-500' : 'text-slate-400';
  const headerBgClass = isLight ? 'bg-gray-50' : 'bg-slate-800/50';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex-shrink-0 px-6 py-4 border-b ${borderClass} ${headerBgClass}`}>
        <div className="flex items-start justify-between">
          {/* Step info */}
          <div className="flex items-center gap-4">
            {/* Step number badge */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white font-bold text-lg">
              {currentStepNumber}
            </div>

            <div>
              <h2 className={`text-xl font-semibold ${textPrimaryClass}`}>
                {step.title}
              </h2>
              <div className={`flex items-center gap-2 text-sm ${textSecondaryClass}`}>
                <Clock size={14} />
                <span>~{step.estimatedMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Audio guide */}
          <WizardAudioGuide
            script={audioScript}
            audioEnabled={audioEnabled}
            autoPlay={audioEnabled}
            onToggleMute={onToggleAudio}
            isLight={isLight}
          />
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className={`flex-1 overflow-auto ${bgClass}`}>
        <div className="p-6">
          {/* Collapsible Introduction/Transcript */}
          {audio && (
            <div className={`mb-6 rounded-lg border ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/30'}`}>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg ${
                  isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className={isLight ? 'text-sky-600' : 'text-sky-400'} />
                  <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-slate-200'}`}>
                    About This Section
                  </span>
                  {!audioEnabled && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
                      Audio off - read below
                    </span>
                  )}
                </div>
                {showTranscript ? (
                  <ChevronUp size={18} className={textSecondaryClass} />
                ) : (
                  <ChevronDown size={18} className={textSecondaryClass} />
                )}
              </button>

              {showTranscript && (
                <div className={`px-4 pb-4 space-y-3 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                  {audio.intro && (
                    <p className="text-sm leading-relaxed">
                      {audio.intro}
                    </p>
                  )}
                  {audio.why && (
                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        Why it matters
                      </span>
                      <p className="text-sm leading-relaxed mt-1">
                        {audio.why}
                      </p>
                    </div>
                  )}
                  {audio.connection && (
                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        How it connects
                      </span>
                      <p className="text-sm leading-relaxed mt-1">
                        {audio.connection}
                      </p>
                    </div>
                  )}
                  {audio.tip && (
                    <div className={`flex gap-2 p-3 rounded-lg ${isLight ? 'bg-sky-50 border border-sky-100' : 'bg-sky-500/10 border border-sky-500/20'}`}>
                      <span className="text-lg">💡</span>
                      <p className={`text-sm leading-relaxed ${isLight ? 'text-sky-800' : 'text-sky-300'}`}>
                        <span className="font-medium">Tip:</span> {audio.tip}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Footer navigation */}
      <div className={`flex-shrink-0 px-6 py-4 border-t ${borderClass} ${headerBgClass}`}>
        <div className="flex items-center justify-between">
          {/* Previous button */}
          <button
            onClick={onPrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${isFirstStep
                ? 'opacity-50 cursor-not-allowed'
                : isLight
                  ? 'hover:bg-gray-200 text-gray-700'
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          {/* Center - Skip button */}
          <button
            onClick={onSkip}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${isLight
                ? 'hover:bg-gray-200 text-gray-500'
                : 'hover:bg-slate-700 text-slate-400'
              }`}
          >
            <SkipForward size={16} />
            Skip for now
          </button>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
          >
            {isLastStep ? 'Review' : 'Continue'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WizardSlide;
