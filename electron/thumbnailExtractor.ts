import AdmZip from 'adm-zip';
import path from 'path';

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];

// In-memory cache for thumbnails
const thumbnailCache = new Map<string, string>();

export async function extractCoverImage(archivePath: string): Promise<string | null> {
    try {
        // Check cache first
        if (thumbnailCache.has(archivePath)) {
            return thumbnailCache.get(archivePath)!;
        }

        const ext = path.extname(archivePath).toLowerCase();

        // Handle ZIP/CBZ files
        if (ext === '.zip' || ext === '.cbz') {
            const zip = new AdmZip(archivePath);
            const entries = zip.getEntries()
                .filter(entry => !entry.isDirectory && SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(entry.entryName).toLowerCase()))
                .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true, sensitivity: 'base' }));

            if (entries.length === 0) {
                return null;
            }

            // Return manga:// URL for the first image
            const coverUrl = `manga://${encodeURIComponent(archivePath)}?path=${encodeURIComponent(archivePath)}&index=0`;
            thumbnailCache.set(archivePath, coverUrl);
            return coverUrl;
        }
        // Handle standalone image files
        else if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
            const coverUrl = `manga://${encodeURIComponent(archivePath)}?path=${encodeURIComponent(archivePath)}`;
            thumbnailCache.set(archivePath, coverUrl);
            return coverUrl;
        }

        return null;
    } catch (error) {
        console.error(`Error extracting cover from ${archivePath}:`, error);
        return null;
    }
}

export async function extractCoversForFiles(filePaths: string[]): Promise<Record<string, string>> {
    const covers: Record<string, string> = {};

    for (const filePath of filePaths) {
        const coverUrl = await extractCoverImage(filePath);
        if (coverUrl) {
            covers[filePath] = coverUrl;
        }
    }

    return covers;
}

export function clearThumbnailCache() {
    thumbnailCache.clear();
}

export async function getImageCount(archivePath: string): Promise<number> {
    try {
        const ext = path.extname(archivePath).toLowerCase();

        if (ext === '.zip' || ext === '.cbz') {
            const zip = new AdmZip(archivePath);
            const entries = zip.getEntries()
                .filter(entry => !entry.isDirectory && SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(entry.entryName).toLowerCase()));
            return entries.length;
        } else if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
            return 1;
        }

        return 0;
    } catch (error) {
        console.error(`Error getting image count from ${archivePath}:`, error);
        return 0;
    }
}
