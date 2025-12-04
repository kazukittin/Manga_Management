import { useEffect } from 'react';
import { useLibraryStore } from '../store/libraryStore';

interface UseLibraryKeyboardProps {
    onRefresh: () => void;
    onOpenSelected: () => void;
    searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function useLibraryKeyboard({ onRefresh, onOpenSelected, searchInputRef }: UseLibraryKeyboardProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+F - Focus search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchInputRef?.current?.focus();
                return;
            }

            // F5 - Refresh library
            if (e.key === 'F5') {
                e.preventDefault();
                onRefresh();
                return;
            }

            // Enter - Open selected
            if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                const activeElement = document.activeElement;
                // Only trigger if not in an input field
                if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    onOpenSelected();
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onRefresh, onOpenSelected, searchInputRef]);
}

// Arrow key navigation for card selection
export function useCardNavigation(files: string[]) {
    const { selectedCard, setSelectedCard } = useLibraryStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            // Don't handle if in input field
            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            const currentIndex = selectedCard ? files.indexOf(selectedCard) : -1;
            const ITEMS_PER_ROW = 10;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentIndex < files.length - 1) {
                        setSelectedCard(files[currentIndex + 1]);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        setSelectedCard(files[currentIndex - 1]);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex + ITEMS_PER_ROW < files.length) {
                        setSelectedCard(files[currentIndex + ITEMS_PER_ROW]);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex - ITEMS_PER_ROW >= 0) {
                        setSelectedCard(files[currentIndex - ITEMS_PER_ROW]);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, selectedCard, setSelectedCard]);
}
