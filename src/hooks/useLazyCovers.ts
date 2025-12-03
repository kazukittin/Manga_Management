import { useEffect, useRef } from 'react';
import { useLibraryStore } from '../store/libraryStore';

const BATCH_SIZE = 100; // Load 100 covers at a time

/**
 * Custom hook for lazy loading cover images
 * Loads covers in batches as the user scrolls through the library
 */
export function useLazyCovers(files: string[]) {
    const { covers, addCovers } = useLibraryStore();
    const loadedRangesRef = useRef<Set<number>>(new Set());
    const loadingRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        // Reset loaded ranges when files change
        loadedRangesRef.current.clear();
        loadingRef.current.clear();
    }, [files]);

    const loadCoversForRange = async (startIndex: number, endIndex: number) => {
        // Calculate which batches we need to load
        const startBatch = Math.floor(startIndex / BATCH_SIZE);
        const endBatch = Math.floor(endIndex / BATCH_SIZE);

        const batchesToLoad: number[] = [];
        for (let batch = startBatch; batch <= endBatch; batch++) {
            if (!loadedRangesRef.current.has(batch) && !loadingRef.current.has(batch)) {
                batchesToLoad.push(batch);
            }
        }

        if (batchesToLoad.length === 0) {
            return;
        }

        // Mark batches as loading
        batchesToLoad.forEach(batch => loadingRef.current.add(batch));

        // Load all needed batches in parallel
        await Promise.all(
            batchesToLoad.map(async (batch) => {
                const batchStart = batch * BATCH_SIZE;
                try {
                    const newCovers = await window.api.getCoversBatch(files, batchStart, BATCH_SIZE);
                    addCovers(newCovers);
                    loadedRangesRef.current.add(batch);
                } catch (error) {
                    console.error(`Error loading covers for batch ${batch}:`, error);
                } finally {
                    loadingRef.current.delete(batch);
                }
            })
        );
    };

    return { covers, loadCoversForRange };
}
