import React, { useEffect, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useReaderStore } from '../store/readerStore';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import ReaderControls from './ReaderControls';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
    filePath: string;
    onClose: () => void;
    defaultDirection?: 'ltr' | 'rtl';
}

const PdfReader: React.FC<PdfReaderProps> = ({ filePath, onClose, defaultDirection }) => {
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

    const [numPages, setNumPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const [scale, setScale] = useState(1.0);

    // Convert file path to file:// URL for react-pdf
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

    // Load saved progress when the reader opens
    useEffect(() => {
        let isMounted = true;

        const loadProgress = async () => {
            try {
                const savedPage = await window.api.loadProgress(filePath);
                if (!isMounted || numPages === 0) return;

                const clampedPage = Math.max(0, Math.min(savedPage, numPages - 1));
                setCurrentPage(clampedPage);
            } catch (error) {
                console.error('Failed to load reading progress:', error);
            }
        };

        if (numPages > 0) {
            loadProgress();
        }

        return () => {
            isMounted = false;
            reset();
        };
    }, [filePath, numPages, setCurrentPage, reset]);

    // Persist reading progress
    useEffect(() => {
        if (numPages === 0) return;

        const save = async () => {
            try {
                await window.api.saveProgress(filePath, currentPage);
            } catch (error) {
                console.error('Failed to save reading progress:', error);
            }
        };

        save();
    }, [filePath, currentPage, numPages]);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('Error loading PDF:', error);
        setLoading(false);
    }, []);

    // Navigation handlers
    const handleNext = useCallback(() => {
        if (currentPage < numPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    }, [currentPage, numPages, setCurrentPage]);

    const handlePrev = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    }, [currentPage, setCurrentPage]);

    const handleHome = useCallback(() => {
        setCurrentPage(0);
    }, [setCurrentPage]);

    const handleEnd = useCallback(() => {
        setCurrentPage(numPages - 1);
    }, [numPages, setCurrentPage]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

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
            if (isLeftHalf) handleNext(); else handlePrev();
        } else {
            if (isLeftHalf) handlePrev(); else handleNext();
        }
    };

    // Wheel navigation
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) handleNext();
        else if (e.deltaY < 0) handlePrev();
    };

    // Zoom controls
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <span className="text-lg text-blue-400">PDFを読み込み中...</span>
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
                totalPages={numPages}
                viewMode={viewMode}
                readingDirection={readingDirection}
                onViewModeChange={setViewMode}
                onReadingDirectionChange={setReadingDirection}
                onClose={onClose}
                onGoToFirstPage={handleHome}
                visible={showControls}
            />

            {/* Zoom Controls */}
            <div className={`fixed bottom-4 right-4 flex gap-2 z-50 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                    className="px-3 py-2 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700"
                >
                    −
                </button>
                <span className="px-3 py-2 bg-gray-800/80 text-white rounded-lg">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                    className="px-3 py-2 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700"
                >
                    +
                </button>
            </div>

            <div className="h-full flex items-center justify-center p-4 overflow-auto">
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <span className="text-lg text-blue-400">ページを読み込み中...</span>
                        </div>
                    }
                >
                    <Page
                        pageNumber={currentPage + 1}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>
        </div>
    );
};

export default PdfReader;
