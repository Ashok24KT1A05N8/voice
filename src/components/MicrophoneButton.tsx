import React from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isProcessing = false,
  isSpeaking = false,
  onClick,
  size = 'md',
  disabled = false,
  label,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 p-2 text-sm',
    md: 'w-20 h-20 p-5 text-base',
    lg: 'w-28 h-28 p-7 text-lg',
  };

  const iconSizes = {
    sm: 18,
    md: 32,
    lg: 44,
  };

  let bgClasses = 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/30';
  let ringClasses = '';

  if (isListening) {
    bgClasses = 'bg-gradient-to-br from-rose-600 via-purple-600 to-indigo-600 text-white mic-glow-active';
    ringClasses = 'animate-ping duration-1000';
  } else if (isProcessing) {
    bgClasses = 'bg-gradient-to-br from-amber-600 via-purple-600 to-indigo-700 text-white animate-pulse';
  } else if (isSpeaking) {
    bgClasses = 'bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white';
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Animated aura rings when active */}
        {isListening && (
          <>
            <span className={`absolute -inset-2 rounded-full bg-purple-500/30 ${ringClasses}`} />
            <span className="absolute -inset-5 rounded-full bg-indigo-500/20 animate-pulse duration-700" />
          </>
        )}

        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label || (isListening ? 'Stop listening' : 'Start listening')}
          className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer ${sizeClasses[size]} ${bgClasses} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isProcessing ? (
            <Loader2 size={iconSizes[size]} className="animate-spin text-white" />
          ) : isSpeaking ? (
            <Volume2 size={iconSizes[size]} className="animate-bounce text-white" />
          ) : isListening ? (
            <Mic size={iconSizes[size]} className="animate-pulse text-white" />
          ) : (
            <Mic size={iconSizes[size]} className="text-white" />
          )}
        </button>
      </div>

      {label && (
        <span className="text-xs font-medium text-slate-300 tracking-wide select-none">
          {label}
        </span>
      )}
    </div>
  );
};
