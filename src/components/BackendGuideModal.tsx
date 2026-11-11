import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Server, Database, Sparkles, BookOpen } from 'lucide-react';

interface BackendGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mongodb' | 'api' | 'run' | 'vscode'>('mongodb');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950/95 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Voice Commander Database & Architecture</h3>
              <p className="text-xs text-slate-400">MongoDB document models, cluster setup, and REST API documentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('mongodb')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mongodb'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            MongoDB Architecture
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            REST API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('run')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'run'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Server & CLI Setup
          </button>
          <button
            onClick={() => setActiveTab('vscode')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'vscode'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dev Environment
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300">
          {activeTab === 'mongodb' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Database size={16} className="text-emerald-400" />
                  <span>MongoDB Collections Schema</span>
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Voice Commander structures voice interactions, persistent notes, and automated triggers across four dedicated MongoDB collections:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-mono text-emerald-400 font-bold">1. commands</span>
                  <p className="text-slate-400 text-[11px]">
                    Stores execution history: <code className="text-slate-300">command</code>, <code className="text-slate-300">recognizedText</code>, <code className="text-slate-300">action</code>, <code className="text-slate-300">response</code>, <code className="text-slate-300">status</code>, <code className="text-slate-300">executionTimeMs</code>, and timestamp.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-mono text-emerald-400 font-bold">2. notes</span>
                  <p className="text-slate-400 text-[11px]">
                    Stores user voice memos: <code className="text-slate-300">title</code>, <code className="text-slate-300">content</code>, <code className="text-slate-300">category</code>, <code className="text-slate-300">color</code>, <code className="text-slate-300">pinned</code>, and <code className="text-slate-300">tags</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-mono text-emerald-400 font-bold">3. custom_triggers</span>
                  <p className="text-slate-400 text-[11px]">
                    Automations triggered by voice phrases: <code className="text-slate-300">triggerPhrase</code>, <code className="text-slate-300">actionType</code>, <code className="text-slate-300">actionValue</code>, and execution metrics.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-mono text-emerald-400 font-bold">4. user_settings</span>
                  <p className="text-slate-400 text-[11px]">
                    Persists synthesizer parameters: <code className="text-slate-300">language</code>, <code className="text-slate-300">rate</code>, <code className="text-slate-300">pitch</code>, <code className="text-slate-300">wakeWord</code>, and sound toggles.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h5 className="font-semibold text-white">Connecting Your Own MongoDB Atlas Cluster</h5>
                <p className="text-slate-400 text-xs">
                  In <span className="text-emerald-400 font-medium">MongoDB Studio</span> or via <code className="text-slate-300">.env</code>:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-emerald-300 border border-slate-800 flex items-center justify-between">
                  <span>MONGODB_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/voice_commander"</span>
                  <button
                    onClick={() => copyText('MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/voice_commander"', 'env-uri')}
                    className="p-1 hover:text-white"
                  >
                    {copiedKey === 'env-uri' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Full REST API Reference</h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span><span className="text-emerald-400 font-bold">POST</span> /api/command</span>
                  <span className="text-slate-400 font-sans text-xs">Processes voice/text & logs to MongoDB</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span><span className="text-blue-400 font-bold">GET</span> /api/notes</span>
                  <span className="text-slate-400 font-sans text-xs">Lists notes with search & filtering</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span><span className="text-emerald-400 font-bold">POST</span> /api/notes</span>
                  <span className="text-slate-400 font-sans text-xs">Inserts note document into MongoDB</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span><span className="text-blue-400 font-bold">GET</span> /api/triggers</span>
                  <span className="text-slate-400 font-sans text-xs">Retrieves custom voice trigger automations</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span><span className="text-blue-400 font-bold">GET</span> /api/database/status</span>
                  <span className="text-slate-400 font-sans text-xs">Reports MongoDB connection, latency & counts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span><span className="text-emerald-400 font-bold">POST</span> /api/database/connect</span>
                  <span className="text-slate-400 font-sans text-xs">Connects dynamically to MongoDB Atlas URI</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'run' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Full-Stack Server Execution</h4>
              <p className="text-slate-400">
                The application runs a unified TypeScript backend on Express and Vite with native MongoDB driver integration:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-purple-300 border border-slate-800">
                npm run dev
              </div>
              <p className="text-slate-400">
                The development server automatically starts on port 3000, initializes the MongoDB persistence layer, and serves both REST APIs and the React frontend.
              </p>
            </div>
          )}

          {activeTab === 'vscode' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Developer Tools</h4>
              <p className="text-slate-400">
                Explore documents directly in the built-in <strong className="text-white">MongoDB Studio</strong>, or connect using external tools like MongoDB Compass or the official VS Code MongoDB extension.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
