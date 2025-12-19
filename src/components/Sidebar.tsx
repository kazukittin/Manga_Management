import React from 'react';
import { Library, Clock, BookOpen, BookText, GraduationCap, Layers, FileQuestion, FolderPlus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { BookCategory, CATEGORY_OPTIONS } from '../types/book';

export type ViewMode = 'library' | 'history' | 'settings';

interface CategoryStats {
  manga: number;
  novel: number;
  reference: number;
  other: number;
  uncategorized: number;
}

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedCategory?: BookCategory;
  onCategorySelect: (category: BookCategory | undefined) => void;
  libraryPaths?: string[];
  onAddFolder?: () => void;
  onRemoveFolder?: (path: string) => void;
  stats?: {
    totalFiles: number;
    readingCount: number;
    categoryStats: CategoryStats;
  };
}

const CATEGORY_ICONS: Record<BookCategory | 'all', React.ElementType> = {
  all: Layers,
  manga: BookOpen,
  novel: BookText,
  reference: GraduationCap,
  other: Library,
  uncategorized: FileQuestion,
};

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  selectedCategory,
  onCategorySelect,
  libraryPaths = [],
  onAddFolder,
  onRemoveFolder,
  stats
}) => {
  const navItems = [
    { id: 'library', label: 'ライブラリ', icon: Library },
    { id: 'history', label: '履歴', icon: Clock },
  ] as const;

  const categoryStats = stats?.categoryStats ?? { manga: 0, novel: 0, reference: 0, other: 0, uncategorized: 0 };

  return (
    <aside className="w-64 h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Book Library
        </h1>
        <p className="text-xs text-slate-500 mt-1">v0.2.0 Beta</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        {/* Category Filter Section */}
        {currentView === 'library' && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              カテゴリ
            </p>

            {/* All Categories */}
            <button
              onClick={() => onCategorySelect(undefined)}
              className={clsx(
                "w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                selectedCategory === undefined
                  ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Layers size={16} />
                <span>すべて</span>
              </div>
              <span className="text-xs font-mono opacity-60">{stats?.totalFiles ?? 0}</span>
            </button>

            {/* Category Buttons */}
            {CATEGORY_OPTIONS.map((opt) => {
              const Icon = CATEGORY_ICONS[opt.value];
              const count = categoryStats[opt.value] ?? 0;
              const isSelected = selectedCategory === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => onCategorySelect(opt.value)}
                  className={clsx(
                    "w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm",
                    isSelected
                      ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{opt.label}</span>
                  </div>
                  <span className="text-xs font-mono opacity-60">{count}</span>
                </button>
              );
            })}

            {/* Uncategorized */}
            {categoryStats.uncategorized > 0 && (
              <div className="px-4 py-2 text-xs text-slate-500">
                未分類: {categoryStats.uncategorized}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Folder List Section */}
      {currentView === 'library' && (
        <div className="px-3 py-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">フォルダー</span>
            {onAddFolder && (
              <button
                onClick={onAddFolder}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="フォルダーを追加"
              >
                <FolderPlus size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {libraryPaths.length === 0 ? (
              <p className="text-xs text-slate-600 italic">フォルダーが登録されていません</p>
            ) : (
              libraryPaths.map((path) => {
                const folderName = path.split(/[\\/]/).pop() || path;
                return (
                  <div
                    key={path}
                    className="group flex items-center gap-2 px-2 py-1 rounded bg-slate-800/50 text-xs"
                    title={path}
                  >
                    <span className="flex-1 text-slate-400 truncate">{folderName}</span>
                    {onRemoveFolder && (
                      <button
                        onClick={() => onRemoveFolder(path)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                        title="削除"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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
