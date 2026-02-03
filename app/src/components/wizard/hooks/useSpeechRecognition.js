import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Post-process transcript to add punctuation and formatting
 */
function formatTranscript(text) {
  if (!text || !text.trim()) return '';

  let result = text.trim();

  // Convert spoken punctuation to actual punctuation
  const punctuationMap = [
    [/\b(period|full stop)\b/gi, '.'],
    [/\bcomma\b/gi, ','],
    [/\b(question mark)\b/gi, '?'],
    [/\b(exclamation point|exclamation mark)\b/gi, '!'],
    [/\bcolon\b/gi, ':'],
    [/\bsemicolon\b/gi, ';'],
    [/\b(dash|hyphen)\b/gi, '-'],
    [/\b(open quote|quote)\b/gi, '"'],
    [/\b(close quote|end quote|unquote)\b/gi, '"'],
    [/\bnew line\b/gi, '\n'],
    [/\bnew paragraph\b/gi, '\n\n'],
  ];

  for (const [pattern, replacement] of punctuationMap) {
    result = result.replace(pattern, replacement);
  }

  // Clean up spaces around punctuation
  result = result
    .replace(/\s+([.,!?;:])/g, '$1')  // Remove space before punctuation
    .replace(/([.,!?;:])\s*/g, '$1 ') // Ensure single space after punctuation
    .trim();

  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Capitalize after sentence-ending punctuation
  result = result.replace(/([.!?])\s+([a-z])/g, (match, punct, letter) => {
    return punct + ' ' + letter.toUpperCase();
  });

  // Add period at end if no ending punctuation
  if (!/[.!?]$/.test(result)) {
    result += '.';
  }

  return result;
}

/**
 * Hook for browser speech recognition (Web Speech API)
 * Provides real-time transcription of spoken audio
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
    }
  }, []);

  // Initialize recognition instance
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => (prev + final).trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      // Handle specific error types
      switch (event.error) {
        case 'no-speech':
          // No speech detected - this is normal, don't show error
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your audio settings.');
          setIsListening(false);
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please enable microphone permissions.');
          setIsListening(false);
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        case 'aborted':
          // User aborted - this is normal
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    return recognition;
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  // Compute formatted transcript (with punctuation)
  const fullTranscript = transcript + (interimTranscript ? ' ' + interimTranscript : '');
  const formattedTranscript = formatTranscript(transcript);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    formattedTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    clearError,
  };
}

export default useSpeechRecognition;
