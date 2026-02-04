import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Score a voice for quality - higher is better
 * Prioritizes neural/natural sounding voices across browsers
 */
function scoreVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang;
  let score = 0;

  // Must be English
  if (!lang.startsWith('en')) return -1000;

  // Prefer US English, then UK, then Australian
  if (lang === 'en-US') score += 50;
  else if (lang === 'en-GB') score += 40;
  else if (lang === 'en-AU') score += 30;
  else score += 10;

  // Google voices (Chrome) - very high quality neural voices
  if (name.includes('google')) {
    score += 200;
    // Google US English voices are particularly good
    if (lang === 'en-US') score += 50;
  }

  // Microsoft Online/Neural voices (Edge) - excellent quality
  if (name.includes('microsoft') && (name.includes('online') || name.includes('natural'))) {
    score += 180;
  } else if (name.includes('microsoft')) {
    score += 100;
  }

  // Apple premium voices (Safari/macOS)
  // Enhanced/Premium voices have "(Enhanced)" or are the newer neural voices
  if (name.includes('(enhanced)') || name.includes('(premium)')) {
    score += 170;
  }

  // Specific high-quality Apple voices
  const premiumAppleVoices = ['samantha', 'alex', 'karen', 'daniel', 'moira', 'tessa', 'fiona'];
  if (premiumAppleVoices.some(v => name.includes(v))) {
    score += 120;
  }

  // Siri voices on newer macOS/iOS
  if (name.includes('siri')) {
    score += 150;
  }

  // Avoid robotic/old voices
  const roboticVoices = ['espeak', 'festival', 'mbrola'];
  if (roboticVoices.some(v => name.includes(v))) {
    score -= 100;
  }

  // Slight preference for non-local (cloud) voices as they're usually higher quality
  if (!voice.localService) {
    score += 20;
  }

  return score;
}

/**
 * Select the best available voice from a list
 */
function selectBestVoice(voices) {
  if (!voices || voices.length === 0) return null;

  // Score all voices and sort by score descending
  const scoredVoices = voices
    .map(voice => ({ voice, score: scoreVoice(voice) }))
    .filter(v => v.score > 0) // Only English voices
    .sort((a, b) => b.score - a.score);

  // Debug: log top voices (can be removed in production)
  if (scoredVoices.length > 0) {
    console.log('Top 3 TTS voices:', scoredVoices.slice(0, 3).map(v =>
      `${v.voice.name} (${v.voice.lang}) - score: ${v.score}`
    ));
  }

  return scoredVoices[0]?.voice || voices[0];
}

/**
 * Hook for browser speech synthesis (Text-to-Speech)
 * Uses Web Speech API SpeechSynthesis with smart voice selection
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const utteranceRef = useRef(null);
  const hasAutoSelectedRef = useRef(false);

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

      // Auto-select best voice only once
      if (availableVoices.length > 0 && !hasAutoSelectedRef.current) {
        const bestVoice = selectBestVoice(availableVoices);
        if (bestVoice) {
          setSelectedVoice(bestVoice);
          hasAutoSelectedRef.current = true;
        }
      }
    };

    // Voices may not be available immediately
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

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
