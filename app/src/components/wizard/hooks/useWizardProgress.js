import { useState, useCallback, useEffect, useRef } from 'react';
import { SYSTEM_SETUP_STEPS, getStepByOrder } from '../SystemSetupSteps';

/**
 * Default wizard progress state
 */
const DEFAULT_PROGRESS = {
  currentStep: 1,
  completedSteps: [],
  skippedSteps: [],
  startedAt: null,
  lastAccessedAt: null,
  completedAt: null,
  isComplete: false,
  audioEnabled: true
};

/**
 * Hook for managing System Setup Wizard progress
 * Loads/saves progress from setupConfig.wizardProgress
 *
 * @param {Object} setupConfig - Current setup configuration object
 * @param {Function} onUpdateConfig - Function to update setupConfig (key, value)
 * @returns {Object} Progress state and control functions
 */
export function useWizardProgress(setupConfig, onUpdateConfig) {
  // Initialize state from setupConfig or defaults
  const [progress, setProgress] = useState(() => {
    const saved = setupConfig?.wizardProgress;
    if (saved) {
      return {
        ...DEFAULT_PROGRESS,
        ...saved,
        // Ensure arrays exist
        completedSteps: saved.completedSteps || [],
        skippedSteps: saved.skippedSteps || []
      };
    }
    return DEFAULT_PROGRESS;
  });

  // Track if we've initialized to avoid overwriting on mount
  const initializedRef = useRef(false);

  // Sync progress changes to setupConfig
  useEffect(() => {
    // Skip the first render to avoid overwriting loaded data
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    // Save progress to setupConfig
    if (onUpdateConfig) {
      onUpdateConfig('wizardProgress', progress);
    }
  }, [progress, onUpdateConfig]);

  // Update lastAccessedAt when wizard is opened
  const markAccessed = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      lastAccessedAt: new Date().toISOString(),
      startedAt: prev.startedAt || new Date().toISOString()
    }));
  }, []);

  /**
   * Go to a specific step
   * @param {number} stepNumber - Step number (1-13)
   */
  const goToStep = useCallback((stepNumber) => {
    const step = getStepByOrder(stepNumber);
    if (!step) return;

    setProgress(prev => ({
      ...prev,
      currentStep: stepNumber,
      lastAccessedAt: new Date().toISOString()
    }));
  }, []);

  /**
   * Mark current step as completed and advance to next
   */
  const completeStep = useCallback(() => {
    setProgress(prev => {
      const currentStepData = getStepByOrder(prev.currentStep);
      if (!currentStepData) return prev;

      const stepId = currentStepData.id;
      const newCompleted = prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId];

      // Remove from skipped if it was skipped before
      const newSkipped = prev.skippedSteps.filter(id => id !== stepId);

      // Determine next step
      const nextStep = prev.currentStep < SYSTEM_SETUP_STEPS.length
        ? prev.currentStep + 1
        : prev.currentStep;

      // Check if all steps are now complete
      const allComplete = newCompleted.length === SYSTEM_SETUP_STEPS.length;

      return {
        ...prev,
        currentStep: nextStep,
        completedSteps: newCompleted,
        skippedSteps: newSkipped,
        lastAccessedAt: new Date().toISOString(),
        isComplete: allComplete,
        completedAt: allComplete ? new Date().toISOString() : prev.completedAt
      };
    });
  }, []);

  /**
   * Skip current step and advance to next
   */
  const skipStep = useCallback(() => {
    setProgress(prev => {
      const currentStepData = getStepByOrder(prev.currentStep);
      if (!currentStepData) return prev;

      const stepId = currentStepData.id;

      // Only add to skipped if not already completed
      const newSkipped = prev.completedSteps.includes(stepId) || prev.skippedSteps.includes(stepId)
        ? prev.skippedSteps
        : [...prev.skippedSteps, stepId];

      // Determine next step
      const nextStep = prev.currentStep < SYSTEM_SETUP_STEPS.length
        ? prev.currentStep + 1
        : prev.currentStep;

      return {
        ...prev,
        currentStep: nextStep,
        skippedSteps: newSkipped,
        lastAccessedAt: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Go to previous step
   */
  const previousStep = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
      lastAccessedAt: new Date().toISOString()
    }));
  }, []);

  /**
   * Toggle audio enabled/disabled
   */
  const toggleAudio = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      audioEnabled: !prev.audioEnabled
    }));
  }, []);

  /**
   * Set audio enabled state
   * @param {boolean} enabled
   */
  const setAudioEnabled = useCallback((enabled) => {
    setProgress(prev => ({
      ...prev,
      audioEnabled: enabled
    }));
  }, []);

  /**
   * Reset wizard progress to start over
   */
  const resetProgress = useCallback(() => {
    setProgress({
      ...DEFAULT_PROGRESS,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    });
  }, []);

  /**
   * Mark wizard as complete
   */
  const markComplete = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isComplete: true,
      completedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    }));
  }, []);

  /**
   * Get completion percentage
   * @returns {number} 0-100
   */
  const getCompletionPercentage = useCallback(() => {
    const completed = progress.completedSteps.length;
    const total = SYSTEM_SETUP_STEPS.length;
    return Math.round((completed / total) * 100);
  }, [progress.completedSteps]);

  /**
   * Check if a specific step is completed
   * @param {string} stepId
   * @returns {boolean}
   */
  const isStepCompleted = useCallback((stepId) => {
    return progress.completedSteps.includes(stepId);
  }, [progress.completedSteps]);

  /**
   * Check if a specific step is skipped
   * @param {string} stepId
   * @returns {boolean}
   */
  const isStepSkipped = useCallback((stepId) => {
    return progress.skippedSteps.includes(stepId);
  }, [progress.skippedSteps]);

  /**
   * Get step status
   * @param {string} stepId
   * @returns {'completed' | 'skipped' | 'current' | 'pending'}
   */
  const getStepStatus = useCallback((stepId) => {
    const stepData = SYSTEM_SETUP_STEPS.find(s => s.id === stepId);
    if (!stepData) return 'pending';

    if (progress.completedSteps.includes(stepId)) return 'completed';
    if (progress.skippedSteps.includes(stepId)) return 'skipped';
    if (stepData.order === progress.currentStep) return 'current';
    return 'pending';
  }, [progress.currentStep, progress.completedSteps, progress.skippedSteps]);

  /**
   * Get current step data
   * @returns {Object|null}
   */
  const getCurrentStep = useCallback(() => {
    return getStepByOrder(progress.currentStep);
  }, [progress.currentStep]);

  /**
   * Check if on last step
   * @returns {boolean}
   */
  const isLastStep = useCallback(() => {
    return progress.currentStep === SYSTEM_SETUP_STEPS.length;
  }, [progress.currentStep]);

  /**
   * Check if on first step
   * @returns {boolean}
   */
  const isFirstStep = useCallback(() => {
    return progress.currentStep === 1;
  }, [progress.currentStep]);

  return {
    // State
    progress,
    currentStep: progress.currentStep,
    completedSteps: progress.completedSteps,
    skippedSteps: progress.skippedSteps,
    audioEnabled: progress.audioEnabled,
    isComplete: progress.isComplete,

    // Navigation
    goToStep,
    completeStep,
    skipStep,
    previousStep,

    // Audio
    toggleAudio,
    setAudioEnabled,

    // Status helpers
    getCompletionPercentage,
    isStepCompleted,
    isStepSkipped,
    getStepStatus,
    getCurrentStep,
    isLastStep,
    isFirstStep,

    // Control
    markAccessed,
    resetProgress,
    markComplete,

    // Total steps for reference
    totalSteps: SYSTEM_SETUP_STEPS.length
  };
}

export default useWizardProgress;
