import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  Globe, 
  Volume2, 
  StickyNote, 
  Bell, 
  CheckCircle2, 
  RefreshCw, 
  Database,
  Search,
  Sparkles
} from 'lucide-react';
import { assistantApi } from '../services/api';
import type { CustomTriggerItem } from '../types/assistant';

interface CustomTriggersPageProps {
  onExecuteCommand?: (cmd: string) => void;
}

export const CustomTriggersPage: React.FC<CustomTriggersPageProps> = ({ onExecuteCommand }) => {
  const [triggers, setTriggers] = useState<CustomTriggerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  // Form fields
  const [triggerPhrase, setTriggerPhrase] = useState<string>('');
  const [actionType, setActionType] = useState<CustomTriggerItem['actionType']>('OPEN_URL');
  const [actionValue, setActionValue] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [category, setCategory] = useState<string>('Productivity');

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const data = await assistantApi.getTriggers();
      setTriggers(data);
    } catch (err) {
      console.error('Failed to load triggers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerPhrase.trim()) return;

    try {
      await assistantApi.createTrigger({
        triggerPhrase: triggerPhrase.trim(),
        actionType,
        actionValue: actionValue.trim(),
        response: response.trim() || `Executing ${triggerPhrase}`,
        category,
        enabled: true,
      });

      setShowCreateModal(false);
      setTriggerPhrase('');
      setActionValue('');
      setResponse('');
      fetchTriggers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEnabled = async (trigger: CustomTriggerItem) => {
    try {
      await assistantApi.updateTrigger(trigger.id, {
        enabled: !trigger.enabled,
      });
      fetchTriggers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this trigger from MongoDB?')) return;
    try {
      await assistantApi.deleteTrigger(id);
      fetchTriggers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestTrigger = async (trigger: CustomTriggerItem) => {
    setTestNotification(`Testing trigger: "${trigger.triggerPhrase}"...`);
    try {
      const res = await assistantApi.processCommand(trigger.triggerPhrase, 'text');
      setTestNotification(`Assistant response: ${res.response}`);
      if (res.targetUrl) {
        window.open(res.targetUrl, '_blank', 'noopener,noreferrer');
      }
      fetchTriggers();
    } catch (err) {
      setTestNotification('Error running trigger test.');
    }
    setTimeout(() => setTestNotification(null), 4000);
  };

  const filteredTriggers = triggers.filter(t => 
    t.triggerPhrase.toLowerCase().includes(search.toLowerCase()) ||
    t.response.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap size={18} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Custom Voice Triggers</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create custom spoken commands stored in MongoDB collection <code className="text-purple-300 font-mono">custom_triggers</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTriggers}
            title="Refresh Triggers"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Custom Trigger</span>
          </button>
        </div>
      </div>

      {testNotification && (
        <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-800/60 text-xs text-purple-200 flex items-center gap-2.5 animate-fadeIn">
          <Sparkles size={16} className="text-purple-400 shrink-0" />
          <span>{testNotification}</span>
        </div>
      )}

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search custom triggers..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Database size={13} className="text-emerald-400" />
          <span>Active in MongoDB: {triggers.length} triggers</span>
        </div>
      </div>

      {/* Triggers Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-purple-400" />
          Loading triggers from MongoDB...
        </div>
      ) : filteredTriggers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
          <Zap size={24} className="mx-auto mb-2 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-300">No Custom Triggers Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add custom phrases like "Deploy App", "Focus Mode", or "Open Spotify" that will automatically execute upon voice input!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
          >
            Add Your First Trigger
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTriggers.map((trigger) => (
            <div
              key={trigger.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                trigger.enabled
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      {trigger.actionType === 'OPEN_URL' && <Globe size={14} />}
                      {trigger.actionType === 'SPEAK' && <Volume2 size={14} />}
                      {trigger.actionType === 'ADD_NOTE' && <StickyNote size={14} />}
                      {trigger.actionType === 'SYSTEM_ALERT' && <Bell size={14} />}
                    </div>
                    <span className="font-mono text-xs font-bold text-white truncate">
                      "{trigger.triggerPhrase}"
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {trigger.category}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 line-clamp-1">
                    <span className="text-slate-500 font-mono text-[10px]">Action: </span>
                    <span className="text-slate-300 font-mono text-[11px]">{trigger.actionValue || trigger.actionType}</span>
                  </div>
                  <div className="text-slate-400 line-clamp-2">
                    <span className="text-slate-500 font-mono text-[10px]">Response: </span>
                    <span className="italic text-purple-300">"{trigger.response}"</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span>Hits: {trigger.executionCount || 0}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleEnabled(trigger)}
                    title={trigger.enabled ? 'Disable Trigger' : 'Enable Trigger'}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                      trigger.enabled
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {trigger.enabled ? 'ACTIVE' : 'PAUSED'}
                  </button>

                  <button
                    onClick={() => handleTestTrigger(trigger)}
                    title="Test Execution"
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Play size={12} />
                  </button>

                  <button
                    onClick={() => handleDelete(trigger.id)}
                    title="Delete Trigger"
                    className="p-1.5 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white">New Voice Trigger (MongoDB)</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Spoken Trigger Phrase
                </label>
                <input
                  type="text"
                  value={triggerPhrase}
                  onChange={(e) => setTriggerPhrase(e.target.value)}
                  placeholder="e.g. open my project, focus mode, play music"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="OPEN_URL">Open Web URL</option>
                    <option value="SPEAK">Speak Custom Text</option>
                    <option value="ADD_NOTE">Save Quick Note</option>
                    <option value="SYSTEM_ALERT">System Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Productivity">Productivity</option>
                    <option value="Media">Media</option>
                    <option value="Work">Work</option>
                    <option value="System">System</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {actionType === 'OPEN_URL' ? 'Target URL' : 'Action Parameter / Value'}
                </label>
                <input
                  type="text"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder={actionType === 'OPEN_URL' ? 'https://example.com' : 'Text content or instruction'}
                  required={actionType === 'OPEN_URL'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Spoken Assistant Response
                </label>
                <input
                  type="text"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="e.g. Executing your custom automation now."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  Save to MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
