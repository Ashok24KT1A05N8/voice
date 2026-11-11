import React, { useState } from 'react';
import { Send, Sparkles, Terminal } from 'lucide-react';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onSuggestionClick?: (command: string) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "Type a command or question (e.g. 'Open YouTube', 'What is the time?', 'Add note submit project')...",
  onSuggestionClick,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const sampleSuggestions = [
    'What is the time?',
    'Open YouTube',
    'Add note Review Spring Boot API',
    'Show my notes',
    'Open GitHub',
  ];

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <Terminal size={18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-inner"
        />
        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all shadow-md cursor-pointer"
          >
            <span>Execute</span>
            <Send size={13} />
          </button>
        </div>
      </form>

      {/* Suggested Quick Command buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
        <span className="flex items-center gap-1 shrink-0 text-slate-400 font-medium">
          <Sparkles size={12} className="text-purple-400" />
          <span>Quick:</span>
        </span>
        {sampleSuggestions.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => {
              if (onSuggestionClick) {
                onSuggestionClick(cmd);
              } else {
                setValue(cmd);
              }
            }}
            className="shrink-0 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-purple-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
};
