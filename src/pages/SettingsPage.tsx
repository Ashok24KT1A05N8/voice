import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  Globe,
  Sliders,
  Server,
  Bell,
  RefreshCw,
  Check,
  Play,
  Shield,
  Layers,
  Database,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { VoiceSettings, MongoDbStatus } from '../types/assistant';
import { assistantApi } from '../services/api';

interface SettingsPageProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  availableVoices: SpeechSynthesisVoice[];
  onTestVoice: () => void;
  isJavaConnected?: boolean;
  onRefreshHealth: () => void;
  onOpenDocs: () => void;
  onNavigateToDatabase?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  availableVoices,
  onTestVoice,
  onRefreshHealth,
  onOpenDocs,
  onNavigateToDatabase,
}) => {
  const [dbStatus, setDbStatus] = useState<MongoDbStatus | null>(null);

  useEffect(() => {
    const fetchDb = async () => {
      try {
        const s = await assistantApi.getDatabaseStatus();
        setDbStatus(s);
      } catch {}
    };
    fetchDb();
  }, []);

  const languages = [
    { code: 'en-US', label: 'English (United States)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'te-IN', label: 'Telugu (తెలుగు)' },
    { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
          <Settings size={14} />
          <span>Configuration Studio</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System, Voice & MongoDB Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Tune speech recognition, natural voice synthesis parameters, and MongoDB database storage.
        </p>
      </div>

      {/* MongoDB Database Configuration Card */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">MongoDB Database Storage</h3>
          </div>
          {onNavigateToDatabase && (
            <button
              type="button"
              onClick={onNavigateToDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Open MongoDB Studio</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">Database Engine</span>
            <div className="font-semibold text-emerald-400 text-sm">
              {dbStatus?.modeLabel || 'Embedded Document DB'}
            </div>
            <p className="text-[11px] text-slate-500">
              {dbStatus?.connected ? 'Real-time MongoDB Atlas' : 'Persistent document storage with BSON index'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">Database Name</span>
            <div className="font-semibold font-mono text-white text-sm">
              {dbStatus?.dbName || 'voice_commander'}
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {dbStatus?.uriMasked || 'Local persistence'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">Documents Stored</span>
            <div className="font-semibold text-purple-300 font-mono text-sm">
              {dbStatus?.totalDocuments ?? 0} Documents
            </div>
            <p className="text-[11px] text-slate-500">
              commands, notes, triggers, settings
            </p>
          </div>
        </div>
      </div>

      {/* Voice Synthesis Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">Speech Synthesis & Audio Output</h3>
          </div>
          <button
            type="button"
            onClick={onTestVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Play size={12} />
            <span>Test Voice Output</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Wake Word Setting */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-200">Assistant Wake Word</span>
              <p className="text-[11px] text-slate-400">
                Call out this keyword when speaking to address the assistant
              </p>
            </div>
            <input
              type="text"
              value={settings.wakeWord || 'Commander'}
              onChange={(e) => onUpdateSettings({ wakeWord: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-40 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Enable Voice Responses Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200">Spoken Voice Responses</span>
              <p className="text-[11px] text-slate-400">
                Read assistant answers aloud via browser speech synthesizer
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceResponsesEnabled}
              onChange={(e) => onUpdateSettings({ voiceResponsesEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200">Audio Feedback Chimes</span>
              <p className="text-[11px] text-slate-400">
                Play subtle synthesizer cues when starting, stopping, or executing commands
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffectsEnabled}
              onChange={(e) => onUpdateSettings({ soundEffectsEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Voice & Language Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Globe size={14} className="text-purple-400" />
                <span>Recognition Language</span>
              </label>
              <select
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Volume2 size={14} className="text-purple-400" />
                <span>Text-to-Speech Voice</span>
              </label>
              <select
                value={settings.voiceName}
                onChange={(e) => onUpdateSettings({ voiceName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer truncate"
              >
                <option value="">Default System Voice</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders for Rate, Pitch, Volume */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Rate Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Speech Rate</span>
                <span className="font-mono text-purple-300 tabular-nums">
                  {settings.rate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.0x Fast</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Voice Pitch</span>
                <span className="font-mono text-purple-300 tabular-nums">
                  {settings.pitch.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5 Deep</span>
                <span>1.0 Normal</span>
                <span>1.5 High</span>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Volume</span>
                <span className="font-mono text-purple-300 tabular-nums">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% Mute</span>
                <span>50%</span>
                <span>100% Max</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
