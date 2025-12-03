import { useEffect } from 'react';

interface UseKeyboardNavProps {
    onNext: () => void;
    onPrev: () => void;
    enabled?: boolean;
}

export function useKeyboardNav({ onNext, onPrev, enabled = true }: UseKeyboardNavProps) {
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, enabled]);
}
