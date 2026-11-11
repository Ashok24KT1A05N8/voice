import React, { useState, useEffect } from 'react';
import { Mic, MicOff, BookOpen, Clock, Activity } from 'lucide-react';
import { ActivePage } from '../types/assistant';

interface NavbarProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onOpenDocs: () => void;
  isJavaConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onPageChange,
  isListening,
  onToggleListening,
  onOpenDocs,
  isJavaConnected,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<ActivePage, string> = {
    dashboard: 'Command Center',
    assistant: 'Voice Assistant Studio',
    notes: 'Smart Notes Manager (MongoDB)',
    triggers: 'Custom Voice Triggers',
    history: 'Command History & Logs',
    database: 'MongoDB Database Studio',
    settings: 'Voice & System Settings',
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm text-slate-400 whitespace-nowrap shrink-0">
        <span className="text-slate-500 font-medium">Voice Commander</span>
        <span aria-hidden="true" className="text-slate-600">/</span>
        <span className="font-semibold text-slate-100">{pageTitles[activePage]}</span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-400">
        <button
          onClick={() => onPageChange('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'dashboard' ? 'text-purple-400 font-semibold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onPageChange('assistant')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'assistant' ? 'text-purple-400 font-semibold' : ''
          }`}
        >
          Voice Studio
        </button>
        <button
          onClick={() => onPageChange('notes')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'notes' ? 'text-purple-400 font-semibold' : ''
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => onPageChange('triggers')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'triggers' ? 'text-purple-400 font-semibold' : ''
          }`}
        >
          Triggers
        </button>
        <button
          onClick={() => onPageChange('database')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'database' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          MongoDB
        </button>
        <button
          onClick={() => onPageChange('history')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'history' ? 'text-purple-400 font-semibold' : ''
          }`}
        >
          History
        </button>
        <button
          onClick={() => onPageChange('settings')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePage === 'settings' ? 'text-purple-400 font-semibold' : ''
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: Quick Voice Action & Time */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
          <Clock size={13} className="text-slate-500" />
          <span>{timeStr}</span>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/20'
          }`}
        >
          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          <span>{isListening ? 'Stop Listening' : 'Voice Command'}</span>
        </button>
      </div>
    </header>
  );
};
