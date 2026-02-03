import { Mic, Volume2 } from 'lucide-react';

/**
 * Displays real-time voice transcription with visual feedback
 */
export function VoiceTranscriptBox({
  transcript,
  interimTranscript,
  isListening,
  isSpeaking,
  placeholder = 'Click the microphone to start speaking...',
  isLight = false,
}) {
  const hasContent = transcript || interimTranscript;

  return (
    <div
      className={`
        relative rounded-lg p-4 min-h-[120px] transition-all duration-200
        ${isLight ? 'bg-gray-100 border border-gray-200' : 'bg-slate-800 border border-slate-700'}
        ${isListening ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
        ${isSpeaking ? 'ring-2 ring-sky-500 ring-opacity-50' : ''}
      `}
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {isSpeaking && (
          <div className="flex items-center gap-1 text-sky-500">
            <Volume2 size={14} className="animate-pulse" />
            <span className="text-xs">Speaking...</span>
          </div>
        )}
        {isListening && (
          <div className="flex items-center gap-1 text-red-500">
            <Mic size={14} className="animate-pulse" />
            <span className="text-xs">Listening...</span>
          </div>
        )}
      </div>

      {/* Transcript content */}
      <div className={`text-sm leading-relaxed pr-20 ${isLight ? 'text-gray-800' : 'text-white'}`}>
        {hasContent ? (
          <>
            <span>{transcript}</span>
            {interimTranscript && (
              <span className={`${isLight ? 'text-gray-400' : 'text-slate-400'}`}>
                {transcript ? ' ' : ''}{interimTranscript}
              </span>
            )}
          </>
        ) : (
          <span className={`italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
            {placeholder}
          </span>
        )}
      </div>

      {/* Listening animation bar */}
      {isListening && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default VoiceTranscriptBox;
