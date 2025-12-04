import { useEffect } from 'react';

interface UseKeyboardNavProps {
    onNext: () => void;
    onPrev: () => void;
    onEsc: () => void;
    onHome?: () => void;
    onEnd?: () => void;
    onToggleFullscreen?: () => void;
    onSetViewMode?: (mode: 'single' | 'double') => void;
}

export function useKeyboardNav({
    onNext,
    onPrev,
    onEsc,
    onHome,
    onEnd,
    onToggleFullscreen,
    onSetViewMode
}: UseKeyboardNavProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    onNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    onPrev();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onEsc();
                    break;
                case 'Home':
                    e.preventDefault();
                    onHome?.();
                    break;
                case 'End':
                    e.preventDefault();
                    onEnd?.();
                    break;
                case 'f':
                case 'F':
                    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        onToggleFullscreen?.();
                    }
                    break;
                case '1':
                    e.preventDefault();
                    onSetViewMode?.('single');
                    break;
                case '2':
                    e.preventDefault();
                    onSetViewMode?.('double');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, onEsc, onHome, onEnd, onToggleFullscreen, onSetViewMode]);
}
