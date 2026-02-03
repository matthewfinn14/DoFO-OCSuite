import { Mic, MicOff, Volume2, VolumeX, Check, RotateCcw, SkipForward, ChevronLeft, Square } from 'lucide-react';

/**
 * Control bar with mic, navigation, and action buttons
 */
export function VoiceControlBar({
  // Listening state
  isListening,
  onStartListening,
  onStopListening,
  speechRecognitionSupported = true,
  // Speaking state
  isSpeaking,
  onStopSpeaking,
  // Navigation
  onPrevious,
  onNext,
  onSkip,
  onAccept,
  onRetry,
  // State
  canGoBack = false,
  canAccept = false,
  isLastStep = false,
  isLight = false,
}) {
  const buttonBase = `
    flex items-center justify-center gap-2 px-4 py-2 rounded-lg
    font-medium text-sm transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const primaryButton = `
    ${buttonBase}
    bg-sky-500 text-white hover:bg-sky-600
    active:scale-95
  `;

  const secondaryButton = `
    ${buttonBase}
    ${isLight
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600'
    }
    active:scale-95
  `;

  const dangerButton = `
    ${buttonBase}
    bg-red-500 text-white hover:bg-red-600
    active:scale-95
  `;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className={secondaryButton}
          title="Previous step"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Previous</span>
        </button>
      </div>

      {/* Center: Mic controls */}
      <div className="flex items-center gap-2">
        {/* Stop speaking button */}
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className={`${buttonBase} bg-orange-500 text-white hover:bg-orange-600`}
            title="Stop speaking"
          >
            <VolumeX size={18} />
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}

        {/* Mic toggle */}
        {speechRecognitionSupported && !isSpeaking && (
          isListening ? (
            <button
              onClick={onStopListening}
              className={dangerButton}
              title="Stop listening"
            >
              <div className="relative">
                <Mic size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={onStartListening}
              className={`${buttonBase} bg-emerald-500 text-white hover:bg-emerald-600`}
              title="Start listening"
            >
              <Mic size={18} />
              <span>Speak</span>
            </button>
          )
        )}

        {/* Retry button */}
        {canAccept && !isListening && (
          <button
            onClick={onRetry}
            className={secondaryButton}
            title="Clear and try again"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Retry</span>
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className={secondaryButton}
          title="Skip this step"
        >
          <SkipForward size={16} />
          <span className="hidden sm:inline">Skip</span>
        </button>

        {/* Accept button */}
        <button
          onClick={onAccept}
          disabled={!canAccept}
          className={primaryButton}
          title={isLastStep ? 'Finish wizard' : 'Accept and continue'}
        >
          <Check size={18} />
          <span>{isLastStep ? 'Finish' : 'Accept'}</span>
        </button>
      </div>
    </div>
  );
}

export default VoiceControlBar;
