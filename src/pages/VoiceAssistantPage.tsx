import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Globe,
  Radio,
  ExternalLink,
  Sparkles,
  Compass,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { AssistantResponse } from '../components/AssistantResponse';
import { CommandInput } from '../components/CommandInput';
import { CommandResponseData, ActivePage } from '../types/assistant';

interface VoiceAssistantPageProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  audioLevel?: number;
  onToggleListening: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  transcript: string;
  interimTranscript: string;
  speechError: string | null;
  lastResponse: CommandResponseData | null;
  onExecuteCommand: (cmd: string) => void;
  onReplaySpeech: (text: string) => void;
  onNavigate: (page: ActivePage) => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

export const VoiceAssistantPage: React.FC<VoiceAssistantPageProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  audioLevel = 0,
  onToggleListening,
  onStartListening,
  onStopListening,
  transcript,
  interimTranscript,
  speechError,
  lastResponse,
  onExecuteCommand,
  onReplaySpeech,
  onNavigate,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const languages = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'te-IN', label: 'Telugu (తెలుగు)' },
    { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  ];

  const commandCategories = [
    {
      title: 'Web Navigation',
      commands: [
        'Open Google',
        'Open YouTube',
        'Open Gmail',
        'Open GitHub',
        'Open Facebook',
        'Open Instagram',
      ],
    },
    {
      title: 'Time & System',
      commands: [
        'What is the time?',
        "What is today's date?",
        'What can you do?',
        'Who are you?',
      ],
    },
    {
      title: 'Notes Voice Control',
      commands: [
        'Add note Plan project sprint',
        'Show my notes',
        'Delete last note',
        'Clear all notes',
      ],
    },
    {
      title: 'App Navigation',
      commands: [
        'Open dashboard',
        'Show command history',
        'Open notes',
        'Open settings',
      ],
    },
  ];

  const currentDisplaySpeech = interimTranscript || transcript;

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Studio Header & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Radio size={14} className="animate-pulse" />
            <span>Interactive Voice Studio</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Live Voice Commander
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Speak naturally into your microphone. Commands are processed and executed instantly.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <Globe size={14} className="text-purple-400 ml-2" />
          <select
            value={selectedLanguage}
            onChange={(e) => onSelectLanguage(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium px-2 py-1.5 focus:outline-none cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permission or Speech Error Alert if any */}
      {speechError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs animate-in fade-in">
          <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Microphone Notice</p>
            <p>{speechError}</p>
          </div>
        </div>
      )}

      {/* Main Reactive Voice Orb & Microphone Console */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-purple-950/30 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Animated Waveform */}
          <VoiceWaveform
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            barCount={28}
            audioLevel={audioLevel}
          />

          {/* Large Central Microphone */}
          <MicrophoneButton
            isListening={isListening}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
            onClick={onToggleListening}
            size="lg"
            label={
              isListening
                ? 'Listening... Click to stop'
                : isProcessing
                ? 'Processing command...'
                : isSpeaking
                ? 'Speaking response...'
                : 'Click to start voice command'
            }
          />

          {/* Dual Manual Start / Stop Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartListening}
              disabled={isListening}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isListening
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40'
              }`}
            >
              <Mic size={15} />
              <span>Activate Voice Mode</span>
            </button>
            <button
              type="button"
              onClick={onStopListening}
              disabled={!isListening}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isListening
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
              }`}
            >
              <MicOff size={15} />
              <span>End Listening</span>
            </button>
          </div>

          {/* Real-time Assistant Response & Recognized Transcript */}
          <div className="w-full pt-4 text-left">
            <AssistantResponse
              lastResponse={lastResponse}
              recognizedTranscript={currentDisplaySpeech}
              isListening={isListening}
              isProcessing={isProcessing}
              onReplaySpeech={onReplaySpeech}
              onNavigate={onNavigate}
            />
          </div>

          {/* Keyboard / Text Input Fallback */}
          <div className="w-full pt-2">
            <CommandInput
              onSubmit={onExecuteCommand}
              disabled={isProcessing}
              onSuggestionClick={onExecuteCommand}
            />
          </div>
        </div>
      </div>

      {/* Voice Command Reference Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-purple-400" />
          <h3 className="text-base font-bold text-white">Supported Voice Commands</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commandCategories.map((cat) => (
            <div
              key={cat.title}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3"
            >
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                {cat.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.commands.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => onExecuteCommand(cmd)}
                    className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/40 text-left transition-colors cursor-pointer group text-xs"
                  >
                    <span className="text-slate-300 group-hover:text-white transition-colors">
                      "{cmd}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
