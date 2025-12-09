import React from 'react';
import Sidebar, { ViewMode } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
    stats?: {
        totalFiles: number;
        readingCount: number;
    };
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, stats }) => {
    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-blue-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex w-full h-full">
                <Sidebar currentView={currentView} onViewChange={onViewChange} stats={stats} />

                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
