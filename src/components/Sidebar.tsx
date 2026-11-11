import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  StickyNote, 
  History, 
  Settings, 
  Database, 
  Zap, 
  Server, 
  Activity,
  Layers
} from 'lucide-react';
import { ActivePage, MongoDbStatus } from '../types/assistant';
import { assistantApi } from '../services/api';

interface SidebarProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  onOpenDocs: () => void;
  notesCount: number;
  commandsCount: number;
  triggersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
  notesCount,
  commandsCount,
  triggersCount = 0,
}) => {
  const [dbStatus, setDbStatus] = useState<MongoDbStatus | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const status = await assistantApi.getDatabaseStatus();
        setDbStatus(status);
      } catch {}
    };
    checkDb();
    const interval = setInterval(checkDb, 8000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard' as ActivePage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant' as ActivePage, label: 'Voice Assistant', icon: Mic },
    { id: 'notes' as ActivePage, label: 'Notes (MongoDB)', icon: StickyNote, badge: notesCount },
    { id: 'triggers' as ActivePage, label: 'Custom Triggers', icon: Zap, badge: triggersCount },
    { id: 'history' as ActivePage, label: 'Command Logs', icon: History, badge: commandsCount },
    { id: 'database' as ActivePage, label: 'MongoDB Studio', icon: Database, badgeText: dbStatus?.connected ? 'ATLAS' : 'EMBEDDED' },
    { id: 'settings' as ActivePage, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between p-4 h-full">
      {/* Brand & Identity */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
            <Mic size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Voice Commander</h1>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <Database size={10} />
              <span>MongoDB Engine</span>
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    size={18} 
                    className={
                      isActive 
                        ? 'text-purple-400' 
                        : item.id === 'database' 
                        ? 'text-emerald-400' 
                        : 'text-slate-400'
                    } 
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs font-mono tabular-nums text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-800/80">
                    {item.badge}
                  </span>
                )}
                {item.badgeText && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    dbStatus?.connected 
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: MongoDB Live Database Status */}
      <div className="space-y-2 pt-4 border-t border-slate-800/80">
        <div 
          onClick={() => onPageChange('database')}
          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/70 text-xs hover:border-emerald-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Database size={13} className="text-emerald-400" />
              <span>MongoDB Engine</span>
            </span>
            <span
              className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold ${
                dbStatus?.connected ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/40' : 'text-purple-300 bg-purple-950/40'
              }`}
            >
              {dbStatus?.connected ? 'Atlas Cloud' : 'Embedded DB'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-mono text-emerald-400">
              {dbStatus?.dbName || 'voice_commander'}
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              {dbStatus?.totalDocuments ?? 0} docs
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
