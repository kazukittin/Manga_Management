import React, { useEffect, useState, useMemo } from 'react';
import { useReaderStore } from '../store/readerStore';
import { getDisplayPages, getNextPage, getPrevPage } from '../utils/pageCalculations';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useImagePreloader } from '../hooks/useImagePreloader';
import ReaderControls from './ReaderControls';

interface ReaderProps {
    archivePath: string;
    onClose: () => void;
}

const Reader: React.FC<ReaderProps> = ({ archivePath, onClose }) => {
    const {
        viewMode,
        readingDirection,
        currentPage,
        setViewMode,
        setReadingDirection,
        setCurrentPage,
        reset,
    } = useReaderStore();

    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [showCursor, setShowCursor] = useState(true);

    // Mouse movement handler for controls and cursor visibility
    useEffect(() => {
        let cursorTimer: NodeJS.Timeout;

        const handleMouseMove = (e: MouseEvent) => {
            // Show cursor and reset timer
            setShowCursor(true);
            clearTimeout(cursorTimer);
            cursorTimer = setTimeout(() => {
                setShowCursor(false);
            }, 5000);

            // Show controls if mouse is at top (within 100px)
            if (e.clientY < 100) {
                setShowControls(true);
            } else {
                setShowControls(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(cursorTimer);
        };
    }, []);

    // Load total page count
    useEffect(() => {
        const loadPageCount = async () => {
            try {
                const count = await window.api.getImageCount(archivePath);
                setTotalPages(count);
                setLoading(false);
            } catch (error) {
                console.error('Error loading page count:', error);
                setLoading(false);
            }
        };

        loadPageCount();
        return () => {
            reset();
        };
    }, [archivePath, reset]);

    // Load saved progress when the reader opens
    useEffect(() => {
        let isMounted = true;

        const loadProgress = async () => {
            try {
                const savedPage = await window.api.loadProgress(archivePath);
                if (!isMounted || totalPages === 0) return;

                const clampedPage = Math.max(0, Math.min(savedPage, totalPages - 1));
                setCurrentPage(clampedPage);
            } catch (error) {
                console.error('Failed to load reading progress:', error);
            }
        };

        if (totalPages > 0) {
            loadProgress();
        }

        return () => {
            isMounted = false;
        };
    }, [archivePath, totalPages, setCurrentPage]);

    // Generate manga:// URLs for current pages
    const displayPages = useMemo(() => {
        return getDisplayPages(currentPage, viewMode, totalPages, readingDirection === 'rtl');
    }, [currentPage, viewMode, totalPages, readingDirection]);

    const currentImageUrls = useMemo(() => {
        return displayPages.map((pageIndex) =>
            `manga://?path=${encodeURIComponent(archivePath)}&index=${pageIndex}`
        );
    }, [displayPages, archivePath]);

    // Preload adjacent pages
    const preloadUrls = useMemo(() => {
        const urls: string[] = [];
        for (let offset = -2; offset <= 2; offset++) {
            if (offset === 0) continue;
            const pageIndex = currentPage + offset;
            if (pageIndex >= 0 && pageIndex < totalPages) {
                urls.push(`manga://?path=${encodeURIComponent(archivePath)}&index=${pageIndex}`);
            }
        }
        return urls;
    }, [currentPage, totalPages, archivePath]);

    useImagePreloader(preloadUrls);

    // Persist reading progress
    useEffect(() => {
        if (totalPages === 0) return;

        const save = async () => {
            try {
                await window.api.saveProgress(archivePath, currentPage);
            } catch (error) {
                console.error('Failed to save reading progress:', error);
            }
        };

        save();
    }, [archivePath, currentPage, totalPages]);

    // Navigation handlers
    const handleNext = () => {
        const next = getNextPage(currentPage, viewMode, totalPages, readingDirection === 'rtl');
        setCurrentPage(next);
    };

    const handlePrev = () => {
        const prev = getPrevPage(currentPage, viewMode, totalPages, readingDirection === 'rtl');
        setCurrentPage(prev);
    };

    const handleHome = () => {
        setCurrentPage(0);
    };

    const handleEnd = () => {
        setCurrentPage(totalPages - 1);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useKeyboardNav({
        onNext: handleNext,
        onPrev: handlePrev,
        onEsc: onClose,
        onHome: handleHome,
        onEnd: handleEnd,
        onToggleFullscreen: toggleFullscreen,
        onSetViewMode: setViewMode
    });

    // Click zone navigation
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const isLeftHalf = clickX < rect.width / 2;

        if (readingDirection === 'rtl') {
            // RTL: left click = next, right click = prev
            if (isLeftHalf) {
                handleNext();
            } else {
                handlePrev();
            }
        } else {
            // LTR: left click = prev, right click = next
            if (isLeftHalf) {
                handlePrev();
            } else {
                handleNext();
            }
        }
    };

    // Wheel navigation
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) {
            handleNext();
        } else if (e.deltaY < 0) {
            handlePrev();
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <span className="text-lg text-blue-400">読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 bg-black z-50 overflow-hidden ${showCursor ? 'cursor-pointer' : 'cursor-none'}`}
            onClick={handleClick}
            onWheel={handleWheel}
        >
            <ReaderControls
                currentPage={currentPage}
                totalPages={totalPages}
                viewMode={viewMode}
                readingDirection={readingDirection}
                onViewModeChange={setViewMode}
                onReadingDirectionChange={setReadingDirection}
                onClose={onClose}
                onGoToFirstPage={handleHome}
                visible={showControls}
            />

            <div className="h-full flex items-center justify-center p-4">
                <div className={`flex gap-4 h-full items-center ${readingDirection === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {currentImageUrls.map((url, index) => (
                        <div key={index} className="h-full flex items-center justify-center">
                            <img
                                src={url}
                                alt={`Page ${displayPages[index] + 1}`}
                                className="max-h-full max-w-full object-contain"
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reader;
