import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, RotateCcw, Play, Check, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { WizardStepIndicator } from './WizardStepIndicator';
import { WizardSlide } from './WizardSlide';
import { useWizardProgress } from './hooks/useWizardProgress';
import {
  SYSTEM_SETUP_STEPS,
  getStepByOrder,
  getTotalEstimatedMinutes,
  TOTAL_SYSTEM_SETUP_STEPS
} from './SystemSetupSteps';

/**
 * Wizard states
 */
const WIZARD_STATE = {
  WELCOME: 'welcome',
  STEPS: 'steps',
  REVIEW: 'review'
};

/**
 * System Setup Wizard Modal
 * Guides coaches through offensive system configuration in 13 steps
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether wizard modal is open
 * @param {Function} props.onClose - Callback to close wizard
 * @param {Function} props.renderTabContent - Render prop to render Setup.jsx tab content
 * @param {Object} props.setupConfig - Current setup configuration
 * @param {Function} props.onUpdateConfig - Function to update setupConfig
 * @param {boolean} props.isLight - Light theme flag
 */
export function SystemSetupWizard({
  isOpen,
  onClose,
  renderTabContent,
  setupConfig,
  onUpdateConfig,
  isLight = false
}) {
  const [wizardState, setWizardState] = useState(WIZARD_STATE.WELCOME);

  // Progress management
  const {
    progress,
    currentStep,
    completedSteps,
    skippedSteps,
    audioEnabled,
    goToStep,
    completeStep,
    skipStep,
    previousStep,
    toggleAudio,
    getCompletionPercentage,
    getStepStatus,
    getCurrentStep,
    isLastStep,
    isFirstStep,
    markAccessed,
    resetProgress,
    markComplete,
    totalSteps
  } = useWizardProgress(setupConfig, onUpdateConfig);

  // Mark accessed when wizard opens
  useEffect(() => {
    if (isOpen) {
      markAccessed();
    }
  }, [isOpen, markAccessed]);

  // Determine initial state based on progress
  useEffect(() => {
    if (isOpen && progress.startedAt) {
      // If they've started before, go to welcome to offer continue/restart
      setWizardState(WIZARD_STATE.WELCOME);
    }
  }, [isOpen, progress.startedAt]);

  // Handle continue from where left off
  const handleContinue = useCallback(() => {
    setWizardState(WIZARD_STATE.STEPS);
  }, []);

  // Handle start over
  const handleStartOver = useCallback(() => {
    resetProgress();
    setWizardState(WIZARD_STATE.STEPS);
  }, [resetProgress]);

  // Handle step continue (mark complete and advance)
  const handleStepContinue = useCallback(() => {
    if (isLastStep()) {
      // Go to review
      completeStep();
      setWizardState(WIZARD_STATE.REVIEW);
    } else {
      completeStep();
    }
  }, [isLastStep, completeStep]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (isLastStep()) {
      skipStep();
      setWizardState(WIZARD_STATE.REVIEW);
    } else {
      skipStep();
    }
  }, [isLastStep, skipStep]);

  // Handle finish from review
  const handleFinish = useCallback(() => {
    markComplete();
    onClose();
  }, [markComplete, onClose]);

  // Handle jump to step from review
  const handleJumpToStep = useCallback((stepOrder) => {
    goToStep(stepOrder);
    setWizardState(WIZARD_STATE.STEPS);
  }, [goToStep]);

  // Close handler with escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const completionPercent = getCompletionPercentage();
  const currentStepData = getCurrentStep();
  const totalMinutes = getTotalEstimatedMinutes();

  // Theme classes
  const overlayClass = 'fixed inset-0 bg-black/70 z-50';
  const modalBgClass = isLight ? 'bg-white' : 'bg-slate-900';
  const borderClass = isLight ? 'border-gray-200' : 'border-slate-700';
  const textPrimaryClass = isLight ? 'text-gray-900' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-500' : 'text-slate-400';
  const headerBgClass = isLight ? 'bg-gray-50' : 'bg-slate-800';

  return (
    <div className={overlayClass} onClick={onClose}>
      <div
        className={`fixed inset-4 md:inset-8 lg:inset-12 ${modalBgClass} rounded-xl shadow-2xl flex flex-col overflow-hidden border ${borderClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${borderClass} ${headerBgClass}`}>
          <div className="flex items-center gap-3">
            <Sparkles className="text-amber-400" size={24} />
            <h1 className={`text-xl font-bold ${textPrimaryClass}`}>
              Offensive System Setup
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator - show in steps mode */}
            {wizardState === WIZARD_STATE.STEPS && (
              <div className="flex items-center gap-3">
                <WizardStepIndicator
                  currentStep={currentStep - 1}
                  totalSteps={totalSteps}
                  completedSteps={completedSteps.map(id => {
                    const step = SYSTEM_SETUP_STEPS.find(s => s.id === id);
                    return step ? step.order - 1 : -1;
                  }).filter(i => i >= 0)}
                  isLight={isLight}
                  maxVisible={13}
                />
                <span className={`text-sm ${textSecondaryClass}`}>
                  {currentStep}/{totalSteps}
                </span>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-slate-700 text-slate-400'}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          {/* Welcome Screen */}
          {wizardState === WIZARD_STATE.WELCOME && (
            <WelcomeScreen
              completionPercent={completionPercent}
              hasStarted={!!progress.startedAt}
              currentStep={currentStep}
              totalSteps={totalSteps}
              totalMinutes={totalMinutes}
              onContinue={handleContinue}
              onStartOver={handleStartOver}
              isLight={isLight}
            />
          )}

          {/* Steps Screen */}
          {wizardState === WIZARD_STATE.STEPS && currentStepData && (
            <WizardSlide
              step={currentStepData}
              currentStepNumber={currentStep}
              totalSteps={totalSteps}
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
              onPrevious={previousStep}
              onSkip={handleSkip}
              onContinue={handleStepContinue}
              isFirstStep={isFirstStep()}
              isLastStep={isLastStep()}
              isLight={isLight}
            >
              {renderTabContent(currentStepData.tabId)}
            </WizardSlide>
          )}

          {/* Review Screen */}
          {wizardState === WIZARD_STATE.REVIEW && (
            <ReviewScreen
              steps={SYSTEM_SETUP_STEPS}
              getStepStatus={getStepStatus}
              completedSteps={completedSteps}
              skippedSteps={skippedSteps}
              onJumpToStep={handleJumpToStep}
              onFinish={handleFinish}
              isLight={isLight}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Welcome/Resume screen component
 */
function WelcomeScreen({
  completionPercent,
  hasStarted,
  currentStep,
  totalSteps,
  totalMinutes,
  onContinue,
  onStartOver,
  isLight
}) {
  const textPrimaryClass = isLight ? 'text-gray-900' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-500' : 'text-slate-400';
  const cardBgClass = isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/50 border-slate-700';

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isLight ? 'bg-amber-100' : 'bg-amber-500/20'}`}>
            <Sparkles className="text-amber-500" size={40} />
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold mb-3 ${textPrimaryClass}`}>
          {hasStarted && completionPercent > 0 ? 'Welcome Back!' : 'Set Up Your Offense'}
        </h2>

        {/* Description */}
        <p className={`text-lg mb-6 ${textSecondaryClass}`}>
          {hasStarted && completionPercent > 0
            ? `You're ${completionPercent}% through setting up your offensive system.`
            : 'This wizard will guide you through configuring your offensive system step by step.'
          }
        </p>

        {/* Progress indicator (if started) */}
        {hasStarted && completionPercent > 0 && (
          <div className="mb-6">
            <div className={`h-3 rounded-full overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className={`text-sm mt-2 ${textSecondaryClass}`}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        )}

        {/* Info cards */}
        <div className={`rounded-lg p-4 border mb-8 ${cardBgClass}`}>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className={textSecondaryClass} />
              <span className={textSecondaryClass}>{totalMinutes}-{totalMinutes + 15} min total</span>
            </div>
            <div className={`h-4 w-px ${isLight ? 'bg-gray-300' : 'bg-slate-600'}`} />
            <div className="flex items-center gap-2">
              <span className={textSecondaryClass}>{totalSteps} sections</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
          >
            <Play size={20} />
            {hasStarted && completionPercent > 0 ? 'Continue Where You Left Off' : 'Begin Setup'}
          </button>

          {hasStarted && completionPercent > 0 && (
            <button
              onClick={onStartOver}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <RotateCcw size={18} />
              Start Over
            </button>
          )}
        </div>

        {/* Note about saving */}
        <p className={`text-xs mt-6 ${textSecondaryClass}`}>
          Your progress is saved automatically. You can close and return anytime.
        </p>
      </div>
    </div>
  );
}

/**
 * Review screen component
 */
function ReviewScreen({
  steps,
  getStepStatus,
  completedSteps,
  skippedSteps,
  onJumpToStep,
  onFinish,
  isLight
}) {
  const textPrimaryClass = isLight ? 'text-gray-900' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-500' : 'text-slate-400';
  const cardBgClass = isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/50 border-slate-700';
  const rowHoverClass = isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800';

  const allComplete = completedSteps.length === steps.length;
  const hasSkipped = skippedSteps.length > 0;

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${textPrimaryClass}`}>
          {allComplete ? 'Setup Complete!' : 'Review Your Progress'}
        </h2>
        <p className={textSecondaryClass}>
          {allComplete
            ? 'You\'ve completed all setup sections. Your offensive system is ready!'
            : hasSkipped
              ? 'You skipped some sections. Click any to go back and complete them.'
              : 'Here\'s an overview of all setup sections.'
          }
        </p>
      </div>

      {/* Steps list */}
      <div className={`flex-1 overflow-auto rounded-lg border ${cardBgClass}`}>
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';
          const isSkipped = status === 'skipped';

          return (
            <button
              key={step.id}
              onClick={() => onJumpToStep(step.order)}
              className={`w-full flex items-center gap-4 px-4 py-3 border-b last:border-b-0 text-left transition-colors ${rowHoverClass}
                ${isLight ? 'border-gray-200' : 'border-slate-700'}`}
            >
              {/* Status icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isSkipped
                    ? isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'
                    : isLight ? 'bg-gray-200 text-gray-400' : 'bg-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : isSkipped ? (
                  <AlertCircle size={16} />
                ) : (
                  <span className="text-sm font-medium">{step.order}</span>
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${textPrimaryClass}`}>
                  {step.title}
                </div>
                <div className={`text-sm ${textSecondaryClass}`}>
                  ~{step.estimatedMinutes} min
                </div>
              </div>

              {/* Status text */}
              <div className={`flex-shrink-0 text-sm ${isCompleted
                ? 'text-emerald-500'
                : isSkipped
                  ? 'text-amber-500'
                  : textSecondaryClass
                }`}>
                {isCompleted ? 'Complete' : isSkipped ? 'Skipped' : 'Not started'}
              </div>

              {/* Arrow */}
              <ChevronRight size={18} className={textSecondaryClass} />
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 pt-6 flex justify-center">
        <button
          onClick={onFinish}
          className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
        >
          <Check size={20} />
          {allComplete ? 'Finish Setup' : 'Close Wizard'}
        </button>
      </div>
    </div>
  );
}

export default SystemSetupWizard;
