import React from 'react';
import Sidebar, { ViewMode } from './Sidebar';
import { BookCategory } from '../types/book';

interface CategoryStats {
    manga: number;
    novel: number;
    reference: number;
    other: number;
    uncategorized: number;
}

interface LayoutProps {
    children: React.ReactNode;
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

const Layout: React.FC<LayoutProps> = ({
    children,
    currentView,
    onViewChange,
    selectedCategory,
    onCategorySelect,
    libraryPaths,
    onAddFolder,
    onRemoveFolder,
    stats
}) => {
    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-blue-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex w-full h-full">
                <Sidebar
                    currentView={currentView}
                    onViewChange={onViewChange}
                    selectedCategory={selectedCategory}
                    onCategorySelect={onCategorySelect}
                    libraryPaths={libraryPaths}
                    onAddFolder={onAddFolder}
                    onRemoveFolder={onRemoveFolder}
                    stats={stats}
                />

                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;

