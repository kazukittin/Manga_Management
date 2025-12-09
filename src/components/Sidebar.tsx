import React from 'react';
import { Library, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export type ViewMode = 'library' | 'history' | 'settings';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  stats?: {
    totalFiles: number;
    readingCount: number;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, stats }) => {
  const navItems = [
    { id: 'library', label: 'ライブラリ', icon: Library },
    { id: 'history', label: '履歴', icon: Clock },
    // { id: 'settings', label: '設定', icon: Settings }, // Enable later
  ] as const;

  return (
    <aside className="w-64 h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Manga Reader
        </h1>
        <p className="text-xs text-slate-500 mt-1">v0.1.0 Beta</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive
                  ? "bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon size={20} className={clsx(
                "transition-colors",
                isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-slate-950/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">総ファイル数</span>
            <span className="text-slate-300 font-mono">{stats?.totalFiles ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">読書済み</span>
            <span className="text-slate-300 font-mono">{stats?.readingCount ?? 0}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
