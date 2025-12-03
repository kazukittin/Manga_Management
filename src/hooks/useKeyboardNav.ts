import { useEffect } from 'react';

interface UseKeyboardNavProps {
    onNext: () => void;
    onPrev: () => void;
    onEsc?: () => void;
    enabled?: boolean;
}

export function useKeyboardNav({ onNext, onPrev, onEsc, enabled = true }: UseKeyboardNavProps) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    onNext();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    onPrev();
                    break;
                case 'Escape':
                    if (onEsc) {
                        e.preventDefault();
                        onEsc();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, onEsc, enabled]);
}
