import React, { useEffect, useState, useCallback, useRef } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { useReaderStore } from '../store/readerStore';
import ReaderControls from './ReaderControls';

interface EpubReaderProps {
    filePath: string;
    onClose: () => void;
    defaultDirection?: 'ltr' | 'rtl';
}

const EpubReader: React.FC<EpubReaderProps> = ({ filePath, onClose, defaultDirection }) => {
    const {
        viewMode,
        readingDirection,
        currentPage,
        setViewMode,
        setReadingDirection,
        setCurrentPage,
        reset,
    } = useReaderStore();

    // Apply default direction on mount if provided
    useEffect(() => {
        if (defaultDirection) {
            setReadingDirection(defaultDirection);
        }
    }, [defaultDirection, setReadingDirection]);

    const containerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);

    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [toc, setToc] = useState<{ label: string; href: string }[]>([]);
    const [showToc, setShowToc] = useState(false);

    // Convert file path to file:// URL
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

    // Mouse movement handler for controls and cursor visibility
    useEffect(() => {
        let cursorTimer: NodeJS.Timeout;

        const handleMouseMove = (e: MouseEvent) => {
            setShowCursor(true);
            clearTimeout(cursorTimer);
            cursorTimer = setTimeout(() => {
                setShowCursor(false);
            }, 5000);

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

    // Initialize EPUB
    useEffect(() => {
        if (!containerRef.current) return;

        const book = ePub(fileUrl);
        bookRef.current = book;

        const rendition = book.renderTo(containerRef.current, {
            width: '100%',
            height: '100%',
            spread: 'none',
        });

        renditionRef.current = rendition;

        // Load book
        book.ready.then(() => {
            // Get table of contents
            book.loaded.navigation.then((nav) => {
                setToc(nav.toc.map((item) => ({
                    label: item.label,
                    href: item.href,
                })));
            });

            // Get total locations (approximate page count)
            book.locations.generate(1024).then(() => {
                setTotalPages(book.locations.length());
                setLoading(false);
            });
        });

        // Load saved location or start from beginning
        const loadProgress = async () => {
            try {
                const savedLocation = await window.api.loadProgress(filePath);
                if (typeof savedLocation === 'string' && savedLocation) {
                    rendition.display(savedLocation);
                } else {
                    rendition.display();
                }
            } catch {
                rendition.display();
            }
        };

        loadProgress();

        // Track location changes
        rendition.on('locationChanged', (location: { start: { cfi: string; percentage: number } }) => {
            setCurrentLocation(location.start.cfi);
            const percentage = location.start.percentage || 0;
            setCurrentPage(Math.floor(percentage * totalPages));
        });

        // Keyboard navigation
        rendition.on('keyup', (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                rendition.next();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                rendition.prev();
            } else if (e.key === 'Escape') {
                onClose();
            }
        });

        return () => {
            book.destroy();
            reset();
        };
    }, [fileUrl, filePath, onClose, reset, setCurrentPage, totalPages]);

    // Save progress when location changes
    useEffect(() => {
        if (currentLocation) {
            window.api.saveProgress(filePath, currentLocation as unknown as number).catch(console.error);
        }
    }, [currentLocation, filePath]);

    // Navigation handlers
    const handleNext = useCallback(() => {
        renditionRef.current?.next();
    }, []);

    const handlePrev = useCallback(() => {
        renditionRef.current?.prev();
    }, []);

    const handleGoToChapter = useCallback((href: string) => {
        renditionRef.current?.display(href);
        setShowToc(false);
    }, []);

    // Click zone navigation
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const isLeftHalf = clickX < rect.width / 2;

        if (readingDirection === 'rtl') {
            if (isLeftHalf) handleNext(); else handlePrev();
        } else {
            if (isLeftHalf) handlePrev(); else handleNext();
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <span className="text-lg text-blue-400">EPUBを読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 bg-white z-50 overflow-hidden ${showCursor ? 'cursor-pointer' : 'cursor-none'}`}
        >
            <ReaderControls
                currentPage={currentPage}
                totalPages={totalPages}
                viewMode={viewMode}
                readingDirection={readingDirection}
                onViewModeChange={setViewMode}
                onReadingDirectionChange={setReadingDirection}
                onClose={onClose}
                onGoToFirstPage={() => renditionRef.current?.display()}
                visible={showControls}
            />

            {/* TOC Button */}
            <button
                onClick={() => setShowToc(!showToc)}
                className={`fixed top-4 left-4 z-50 px-3 py-2 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                目次
            </button>

            {/* Table of Contents Sidebar */}
            {showToc && (
                <div className="fixed left-0 top-0 h-full w-72 bg-gray-900 z-50 overflow-y-auto shadow-xl">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">目次</h3>
                        <button
                            onClick={() => setShowToc(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-2">
                        {toc.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleGoToChapter(item.href)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* EPUB Container */}
            <div
                ref={containerRef}
                className="h-full w-full"
                onClick={handleClick}
            />
        </div>
    );
};

export default EpubReader;
