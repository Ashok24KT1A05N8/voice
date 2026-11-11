import React from 'react';

interface VoiceWaveformProps {
  isListening: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  barCount?: number;
  audioLevel?: number; // 0 to 100 live volume from physical microphone
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening,
  isSpeaking = false,
  isProcessing = false,
  barCount = 20,
  audioLevel = 0,
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-1 h-14 px-4 py-2" aria-label="Audio Waveform Visualizer">
        {bars.map((bar) => {
          const centerDistance = Math.abs(bar - barCount / 2);
          const normalized = 1 - centerDistance / (barCount / 2);

          let colorClass = 'bg-slate-700/60';
          let heightPx = 6;
          let animationStyle: React.CSSProperties = {};

          if (isListening) {
            colorClass = audioLevel > 5 ? 'bg-gradient-to-t from-purple-500 to-rose-400' : 'bg-gradient-to-t from-purple-600 to-indigo-400';
            // Scale dynamically with physical microphone volume if audioLevel > 0
            const dynamicScale = audioLevel > 0 ? (audioLevel / 100) * 48 : 0;
            const baseH = Math.max(8, Math.round(normalized * (16 + dynamicScale)));
            heightPx = Math.min(52, baseH);

            animationStyle = {
              animation: audioLevel === 0 ? 'waveform 0.8s ease-in-out infinite alternate' : 'none',
              animationDelay: `${(bar * 0.04).toFixed(2)}s`,
              height: `${heightPx}px`,
            };
          } else if (isSpeaking) {
            colorClass = 'bg-gradient-to-t from-blue-500 to-cyan-400';
            animationStyle = {
              animation: 'waveform 0.6s ease-in-out infinite alternate',
              animationDelay: `${(bar * 0.06).toFixed(2)}s`,
              height: `${Math.max(10, Math.round(normalized * 38))}px`,
            };
          } else if (isProcessing) {
            colorClass = 'bg-gradient-to-t from-amber-400 to-purple-500';
            animationStyle = {
              animation: 'pulse 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: `${(bar * 0.04).toFixed(2)}s`,
              height: '16px',
            };
          }

          return (
            <span
              key={bar}
              style={animationStyle}
              className={`w-1 rounded-full transition-all duration-100 ${colorClass}`}
            />
          );
        })}
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300">
          <span>Mic Signal:</span>
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className={`h-full transition-all duration-75 ${
                audioLevel > 30 ? 'bg-rose-400' : audioLevel > 10 ? 'bg-purple-400' : 'bg-slate-600'
              }`}
              style={{ width: `${Math.max(4, audioLevel)}%` }}
            />
          </div>
          <span className="tabular-nums">{audioLevel}%</span>
        </div>
      )}
    </div>
  );
};
