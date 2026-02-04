import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

/**
 * Audio guide component for wizard slides
 * Uses browser TTS to read step explanations
 *
 * @param {Object} props
 * @param {string} props.script - Full audio script to read
 * @param {boolean} props.audioEnabled - Whether audio is enabled globally
 * @param {boolean} props.autoPlay - Whether to auto-play on mount
 * @param {Function} props.onToggleMute - Callback when mute is toggled
 * @param {boolean} props.isLight - Light theme flag
 */
export function WizardAudioGuide({
  script,
  audioEnabled = true,
  autoPlay = true,
  onToggleMute,
  isLight = false
}) {
  const {
    isSpeaking,
    isPaused,
    isSupported,
    selectedVoice,
    speak,
    stop,
    pause,
    resume
  } = useSpeechSynthesis();

  const [hasPlayed, setHasPlayed] = useState(false);

  // Speech settings optimized for natural delivery
  const speechOptions = {
    rate: 0.92,  // Slightly slower for clarity
    pitch: 1.0,  // Natural pitch
    volume: 1.0
  };

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && audioEnabled && script && !hasPlayed && isSupported) {
      // Small delay to let the UI settle and voices to load
      const timer = setTimeout(() => {
        speak(script, speechOptions);
        setHasPlayed(true);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, audioEnabled, script, hasPlayed, isSupported, speak]);

  // Stop speaking when component unmounts or script changes
  useEffect(() => {
    return () => {
      stop();
    };
  }, [script, stop]);

  // Reset hasPlayed when script changes
  useEffect(() => {
    setHasPlayed(false);
  }, [script]);

  const handlePlayPause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(script, speechOptions);
      setHasPlayed(true);
    }
  }, [isSpeaking, isPaused, pause, resume, speak, script]);

  const handleSkip = useCallback(() => {
    stop();
  }, [stop]);

  const handleMuteToggle = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    onToggleMute?.();
  }, [isSpeaking, stop, onToggleMute]);

  if (!isSupported) {
    return null;
  }

  const baseClasses = isLight
    ? 'bg-gray-100 border-gray-200'
    : 'bg-slate-800/50 border-slate-700';

  const textClasses = isLight
    ? 'text-gray-600'
    : 'text-slate-400';

  const buttonClasses = isLight
    ? 'hover:bg-gray-200 text-gray-600'
    : 'hover:bg-slate-700 text-slate-300';

  const activeButtonClasses = isLight
    ? 'bg-sky-100 text-sky-600'
    : 'bg-sky-500/20 text-sky-400';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${baseClasses}`}>
      {/* Speaking indicator */}
      {isSpeaking && !isPaused && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-end gap-0.5 h-4">
            <div className="w-1 bg-sky-500 rounded-full animate-[soundbar_0.5s_ease-in-out_infinite]" style={{ height: '60%' }} />
            <div className="w-1 bg-sky-500 rounded-full animate-[soundbar_0.5s_ease-in-out_infinite_0.1s]" style={{ height: '100%' }} />
            <div className="w-1 bg-sky-500 rounded-full animate-[soundbar_0.5s_ease-in-out_infinite_0.2s]" style={{ height: '40%' }} />
          </div>
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={handleMuteToggle}
        className={`p-1.5 rounded transition-colors ${audioEnabled ? activeButtonClasses : buttonClasses}`}
        title={audioEnabled ? 'Mute audio guide' : 'Unmute audio guide'}
      >
        {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Play/Pause */}
      {audioEnabled && (
        <>
          <button
            onClick={handlePlayPause}
            className={`p-1.5 rounded transition-colors ${buttonClasses}`}
            title={isSpeaking && !isPaused ? 'Pause' : 'Play'}
          >
            {isSpeaking && !isPaused ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Skip (stop) - only show when speaking */}
          {isSpeaking && (
            <button
              onClick={handleSkip}
              className={`p-1.5 rounded transition-colors ${buttonClasses}`}
              title="Skip audio"
            >
              <SkipForward size={18} />
            </button>
          )}
        </>
      )}

      {/* Status text */}
      <span className={`text-xs ${textClasses}`}>
        {!audioEnabled
          ? 'Audio muted'
          : isSpeaking && !isPaused
            ? 'Playing...'
            : isPaused
              ? 'Paused'
              : selectedVoice
                ? `Audio guide`
                : 'Loading voice...'
        }
      </span>

      {/* CSS for soundbar animation */}
      <style>{`
        @keyframes soundbar {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export default WizardAudioGuide;
