import { useEffect } from 'react';

export function useImagePreloader(imageUrls: string[]) {
    useEffect(() => {
        const images: HTMLImageElement[] = [];

        imageUrls.forEach((url) => {
            const img = new Image();
            img.src = url;
            images.push(img);
        });

        // Cleanup
        return () => {
            images.forEach((img) => {
                img.src = '';
            });
        };
    }, [imageUrls]);
}
