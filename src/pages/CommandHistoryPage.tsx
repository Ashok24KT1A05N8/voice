import React, { useState } from 'react';
import {
  History,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Mic,
  Keyboard,
  Filter,
} from 'lucide-react';
import { CommandHistoryItem, CommandStatus } from '../types/assistant';

interface CommandHistoryPageProps {
  history: CommandHistoryItem[];
  onClearHistory: () => Promise<void>;
  onExecuteCommand: (cmd: string) => void;
}

export const CommandHistoryPage: React.FC<CommandHistoryPageProps> = ({
  history,
  onClearHistory,
  onExecuteCommand,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.command.toLowerCase().includes(search.toLowerCase()) ||
      item.response.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const successCount = history.filter((h) => h.status === 'SUCCESS').length;
  const failedCount = history.filter((h) => h.status === 'FAILED').length;
  const unknownCount = history.filter((h) => h.status === 'UNKNOWN').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <History size={14} />
            <span>Audit & Execution Logs</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Command History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Live chronological registry of all voice and text commands processed by the backend.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Total Logged</span>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
            {history.length}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Successful</span>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {successCount}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Unrecognized</span>
          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {unknownCount}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Failed</span>
          <div className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-1">
            {failedCount}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search commands or responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-medium self-start md:self-auto">
          {['ALL', 'SUCCESS', 'UNKNOWN', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Log Table */}
      {filteredHistory.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <History size={28} className="mx-auto text-slate-500" />
          <h3 className="text-sm font-semibold text-white">No Command Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'Commands you speak or type will automatically appear in this audit log.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800/80">
            {filteredHistory.map((item) => {
              const date = new Date(item.timestamp);
              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      {item.source === 'voice' ? (
                        <Mic size={13} className="text-purple-400 shrink-0" />
                      ) : (
                        <Keyboard size={13} className="text-blue-400 shrink-0" />
                      )}
                      <span className="font-semibold text-white">"{item.command}"</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed pl-5">
                      {item.response}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:self-auto self-end pl-5 sm:pl-0">
                    <div className="flex items-center gap-1.5">
                      {item.status === 'SUCCESS' ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 size={13} />
                          <span>SUCCESS</span>
                        </span>
                      ) : item.status === 'UNKNOWN' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <HelpCircle size={13} />
                          <span>UNKNOWN</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-medium">
                          <XCircle size={13} />
                          <span>FAILED</span>
                        </span>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-mono tabular-nums">
                      <div>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-600">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onExecuteCommand(item.command)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-purple-600/40 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      title="Run again"
                    >
                      Re-run
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear History */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-rose-500/40 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Clear Command History?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete all logged commands? This action cannot be reversed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onClearHistory();
                  setIsConfirmOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
