import React, { useState } from 'react';
import {
  Volume2,
  ExternalLink,
  Check,
  Copy,
  Bot,
  User,
  Clock,
  Calendar,
  StickyNote,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CommandResponseData } from '../types/assistant';

interface AssistantResponseProps {
  lastResponse: CommandResponseData | null;
  recognizedTranscript?: string;
  isListening?: boolean;
  isProcessing?: boolean;
  onReplaySpeech?: (text: string) => void;
  onNavigate?: (page: any) => void;
}

export const AssistantResponse: React.FC<AssistantResponseProps> = ({
  lastResponse,
  recognizedTranscript,
  isListening = false,
  isProcessing = false,
  onReplaySpeech,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (lastResponse?.response) {
      navigator.clipboard.writeText(lastResponse.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Live Voice Transcript Box */}
      <div
        className={`glass-panel rounded-2xl p-4 md:p-5 transition-all ${
          isListening
            ? 'border-purple-500/50 bg-gradient-to-r from-purple-950/40 to-slate-900/80 shadow-lg shadow-purple-900/20'
            : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening
                  ? 'bg-rose-500 animate-ping'
                  : isProcessing
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-purple-400'
              }`}
            />
            <span className="text-slate-300">Live Voice Input</span>
          </div>
          {isListening && (
            <span className="text-purple-300 font-mono text-[11px] flex items-center gap-1.5 animate-pulse">
              <span>● Listening</span>
            </span>
          )}
        </div>

        <div className="min-h-12 flex items-center">
          {recognizedTranscript ? (
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-purple-400 font-semibold">
                Captured Speech:
              </span>
              <p className="text-lg font-semibold text-white tracking-wide">
                "{recognizedTranscript}"
              </p>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-2 text-purple-300 animate-pulse text-sm">
              <Sparkles size={16} className="text-purple-400" />
              <span>Speak now! Say "Open YouTube", "What is the time?", or "Add note meeting tomorrow"...</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Tap the microphone to start speaking, or choose a quick command below...
            </p>
          )}
        </div>
      </div>

      {/* Assistant Execution & Spoken Response Card */}
      {lastResponse && (
        <div className="glass-panel rounded-2xl p-5 md:p-6 border border-purple-500/30 bg-gradient-to-br from-slate-900/95 via-purple-950/20 to-slate-900/95 transition-all shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Voice Commander</h3>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    {lastResponse.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span
                    className={
                      lastResponse.status === 'SUCCESS'
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }
                  >
                    {lastResponse.status}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {new Date(lastResponse.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onReplaySpeech && (
                <button
                  type="button"
                  onClick={() => onReplaySpeech(lastResponse.response)}
                  aria-label="Replay spoken response"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-600/30 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                  title="Speak again"
                >
                  <Volume2 size={14} className="text-purple-400" />
                  <span>Replay</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy response text"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Primary Speech Text Output */}
          <div className="text-slate-100 text-base md:text-lg leading-relaxed pl-4 border-l-2 border-purple-500 py-1 font-medium">
            {lastResponse.response}
          </div>

          {/* Dynamic Action Showcase: Time Card */}
          {lastResponse.action === 'SHOW_TIME' && lastResponse.data?.time && (
            <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-purple-400" />
                <div>
                  <span className="text-[11px] text-slate-400 uppercase">System Time</span>
                  <div className="text-2xl font-bold text-white font-mono tabular-nums">
                    {lastResponse.data.time}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Action Showcase: Date Card */}
          {lastResponse.action === 'SHOW_DATE' && lastResponse.data?.date && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={24} className="text-indigo-400" />
                <div>
                  <span className="text-[11px] text-slate-400 uppercase">System Date</span>
                  <div className="text-xl font-bold text-white font-mono">
                    {lastResponse.data.date}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Action Showcase: Note Added Snippet */}
          {lastResponse.action === 'ADD_NOTE' && lastResponse.data?.note && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                <StickyNote size={20} className="text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">Note Saved Successfully</span>
                  <p className="text-xs text-white truncate font-medium">
                    "{lastResponse.data.note.content}"
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('notes')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <span>View Notes</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          {/* Dynamic Action Showcase: Web URL Launch Button */}
          {lastResponse.action === 'OPEN_URL' && lastResponse.targetUrl && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-950/40 -mx-5 -mb-5 md:-mx-6 md:-mb-6 p-4 rounded-b-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                <span className="text-purple-400 font-medium">Target URL:</span>
                <span className="font-mono text-slate-300 truncate">{lastResponse.targetUrl}</span>
              </div>
              <a
                href={lastResponse.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/40 transition-all shrink-0 cursor-pointer"
              >
                <span>Launch Destination Now</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Dynamic Action Showcase: App Navigation Button */}
          {lastResponse.action === 'NAVIGATE_APP' && lastResponse.navigationTarget && onNavigate && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-800/40 -mx-5 -mb-5 md:-mx-6 md:-mb-6 p-4 rounded-b-2xl">
              <span className="text-xs text-slate-300">
                Opening section: <strong className="text-purple-300 uppercase">{lastResponse.navigationTarget}</strong>
              </span>
              <button
                type="button"
                onClick={() => onNavigate(lastResponse.navigationTarget)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Jump to {lastResponse.navigationTarget}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
