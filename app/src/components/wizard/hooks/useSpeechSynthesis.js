import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for browser speech synthesis (Text-to-Speech)
 * Uses Web Speech API SpeechSynthesis
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const utteranceRef = useRef(null);

  // Check browser support and load voices
  useEffect(() => {
    if (!window.speechSynthesis) {
      setIsSupported(false);
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Try to select a good default voice (prefer US English)
      if (availableVoices.length > 0 && !selectedVoice) {
        const usEnglish = availableVoices.find(
          v => v.lang === 'en-US' && v.localService
        );
        const anyEnglish = availableVoices.find(
          v => v.lang.startsWith('en')
        );
        setSelectedVoice(usEnglish || anyEnglish || availableVoices[0]);
      }
    };

    // Voices may not be available immediately
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Speak text
  const speak = useCallback((text, options = {}) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Apply voice
    if (options.voice) {
      utterance.voice = options.voice;
    } else if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Apply options
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);

      // Don't show error for interrupted speech (normal when canceling)
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        setError(`Speech error: ${event.error}`);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utteranceRef.current = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Failed to speak:', e);
      setError('Failed to start text-to-speech.');
    }
  }, [isSupported, selectedVoice]);

  // Stop speaking
  const stop = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  // Pause speaking
  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;

    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  // Resume speaking
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;

    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
    isPaused,
    error,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stop,
    pause,
    resume,
    clearError,
  };
}

export default useSpeechSynthesis;
