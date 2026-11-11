import React from 'react';
import {
  Mic,
  MicOff,
  Terminal,
  StickyNote,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Volume2,
  Cpu,
} from 'lucide-react';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { AssistantResponse } from '../components/AssistantResponse';
import { CommandInput } from '../components/CommandInput';
import {
  CommandResponseData,
  CommandHistoryItem,
  DashboardStats,
  NoteItem,
  ActivePage,
} from '../types/assistant';

interface DashboardPageProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  audioLevel?: number;
  speechError?: string | null;
  onToggleListening: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  transcript: string;
  interimTranscript: string;
  lastResponse: CommandResponseData | null;
  onExecuteCommand: (cmd: string) => void;
  onReplaySpeech: (text: string) => void;
  onNavigate: (page: ActivePage) => void;
  stats: DashboardStats;
  recentCommands: CommandHistoryItem[];
  recentNotes: NoteItem[];
  isJavaConnected: boolean;
  selectedLanguage: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  audioLevel = 0,
  speechError,
  onToggleListening,
  onStartListening,
  onStopListening,
  transcript,
  interimTranscript,
  lastResponse,
  onExecuteCommand,
  onReplaySpeech,
  onNavigate,
  stats,
  recentCommands,
  recentNotes,
  isJavaConnected,
  selectedLanguage,
}) => {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  const quickActions = [
    { label: 'Open YouTube', cmd: 'Open YouTube', category: 'Web' },
    { label: 'Current Time', cmd: 'What is the time?', category: 'System' },
    { label: "Today's Date", cmd: "What is today's date?", category: 'System' },
    { label: 'Add Quick Note', cmd: 'Add note Review quarterly goals', category: 'Notes' },
    { label: 'Open GitHub', cmd: 'Open GitHub', category: 'Web' },
    { label: 'What can you do?', cmd: 'What can you do?', category: 'General' },
  ];

  const currentDisplaySpeech = interimTranscript || transcript;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            <span>Voice Commander AI Station</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {greeting}, Commander
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Voice recognition is primed in <span className="text-purple-300 font-medium">{selectedLanguage}</span>. Spoken commands trigger instant execution.
          </p>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400">Database Engine</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{stats.databaseMode || 'MongoDB Store'}</span>
            </span>
          </div>
          <div className="h-6 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isListening
                  ? 'bg-rose-500 animate-ping'
                  : isSpeaking
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-purple-400'
              }`}
            />
            <span className="font-medium text-slate-300">
              {isListening
                ? 'Listening...'
                : isProcessing
                ? 'Processing...'
                : isSpeaking
                ? 'Speaking...'
                : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Commands */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Commands Executed</span>
            <Terminal size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.totalCommands}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Stored in MongoDB
          </div>
        </div>

        {/* Stat 2: Total Notes */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Notes Saved</span>
            <StickyNote size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.totalNotes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Persistent in collection
          </div>
        </div>

        {/* Stat 3: Success Rate */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Success Rate</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {stats.successRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Execution reliability
          </div>
        </div>

        {/* Stat 4: Active Mode */}
        <div 
          onClick={() => onNavigate('database')}
          className="glass-panel p-5 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">MongoDB Studio</span>
            <Cpu size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold text-emerald-400 truncate">
            {stats.databaseMode || 'MongoDB Engine'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Collections & Explorer</span>
            <ArrowRight size={12} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Voice Assistant Main Console Card */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-5">
          {/* Waveform Visualizer with Live Audio Level */}
          <VoiceWaveform
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            barCount={24}
            audioLevel={audioLevel}
          />

          {speechError && (
            <div className="w-full p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs text-left">
              <strong className="text-white block mb-0.5">Microphone Notice:</strong>
              <span>{speechError}</span>
            </div>
          )}

          {/* Central Animated Microphone Button */}
          <div className="py-2">
            <MicrophoneButton
              isListening={isListening}
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
              onClick={onToggleListening}
              size="lg"
              label={isListening ? 'Tap to Stop Listening' : 'Tap to Speak Command'}
            />
          </div>

          {/* Dual Start / Stop Listening Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onStartListening}
              disabled={isListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isListening
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30'
              }`}
            >
              <Mic size={14} />
              <span>Start Listening</span>
            </button>
            <button
              type="button"
              onClick={onStopListening}
              disabled={!isListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                !isListening
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <MicOff size={14} />
              <span>Stop Listening</span>
            </button>
          </div>

          {/* Live Recognized Speech Display & Assistant Response */}
          <div className="w-full text-left pt-2">
            <AssistantResponse
              lastResponse={lastResponse}
              recognizedTranscript={currentDisplaySpeech}
              isListening={isListening}
              isProcessing={isProcessing}
              onReplaySpeech={onReplaySpeech}
              onNavigate={onNavigate}
            />
          </div>

          {/* Command Manual Input Alternative */}
          <div className="w-full pt-2">
            <CommandInput
              onSubmit={onExecuteCommand}
              disabled={isProcessing}
              onSuggestionClick={onExecuteCommand}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Voice Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            One-Click Voice Commands
          </h3>
          <span className="text-xs text-slate-500">Tap to test immediately</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.cmd}
              type="button"
              onClick={() => onExecuteCommand(action.cmd)}
              className="glass-panel p-3 rounded-xl border border-slate-800 hover:border-purple-500/40 hover:bg-purple-950/20 transition-all text-left group cursor-pointer"
            >
              <div className="text-[10px] text-purple-400 font-medium mb-1 uppercase tracking-wider">
                {action.category}
              </div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                {action.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">
                "{action.cmd}"
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Split Grid: Recent Commands & Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Commands Column */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity size={16} className="text-purple-400" />
              <span>Recent Commands</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentCommands.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No recent commands recorded yet. Try speaking!
              </p>
            ) : (
              recentCommands.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">
                      "{item.command}"
                    </p>
                    <p className="text-slate-400 truncate text-[11px] mt-0.5">
                      {item.response}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-slate-500 text-[11px]">
                    <span
                      className={
                        item.status === 'SUCCESS'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {item.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notes Column */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <StickyNote size={16} className="text-blue-400" />
              <span>Active Notes</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Notes</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentNotes.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No notes created yet. Say "Add note meeting tomorrow" to create one.
              </p>
            ) : (
              recentNotes.slice(0, 4).map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 hover:border-slate-700 transition-colors space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {note.title}
                    </span>
                    <span className="text-[10px] text-purple-400 font-medium">
                      {note.category}
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-2 text-[11px] leading-relaxed">
                    {note.content}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
