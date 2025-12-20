import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];

// In-memory cache for thumbnails (URL lookups)
const thumbnailCache = new Map<string, string>();

// Store library paths for thumbnail folder location
let libraryRoots: string[] = [];

export function setLibraryRoots(roots: string[]) {
    libraryRoots = roots;
}

// Find which library root a file belongs to
function findLibraryRoot(filePath: string): string | null {
    for (const root of libraryRoots) {
        if (filePath.startsWith(root)) {
            return root;
        }
    }
    return null;
}

// Generate a unique thumbnail filename based on file path
function getThumbnailPath(filePath: string): string | null {
    const libraryRoot = findLibraryRoot(filePath);
    if (!libraryRoot) return null;

    const thumbnailDir = path.join(libraryRoot, 'thumbnail');
    const hash = crypto.createHash('md5').update(filePath).digest('hex');
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);
    // Use first 8 chars of hash + basename for readability
    const thumbnailName = `${baseName.slice(0, 30)}_${hash.slice(0, 8)}.jpg`;
    return path.join(thumbnailDir, thumbnailName);
}

// Ensure thumbnail directory exists
function ensureThumbnailDir(filePath: string): string | null {
    const libraryRoot = findLibraryRoot(filePath);
    if (!libraryRoot) return null;

    const thumbnailDir = path.join(libraryRoot, 'thumbnail');
    if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
    }
    return thumbnailDir;
}

export async function extractCoverImage(archivePath: string): Promise<string | null> {
    try {
        if (thumbnailCache.has(archivePath)) {
            return thumbnailCache.get(archivePath)!;
        }

        const ext = path.extname(archivePath).toLowerCase();
        const baseName = path.basename(archivePath, ext);
        const dirName = path.dirname(archivePath);

        // Check for existing saved thumbnail first
        const thumbnailPath = getThumbnailPath(archivePath);
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            const coverUrl = `manga://${encodeURIComponent(thumbnailPath)}?path=${encodeURIComponent(thumbnailPath)}`;
            thumbnailCache.set(archivePath, coverUrl);
            return coverUrl;
        }

        // Check for sidecar cover image (SAME_NAME.jpg/png/etc)
        if (ext === '.zip' || ext === '.cbz') {
            for (const imgExt of SUPPORTED_IMAGE_EXTENSIONS) {
                const sidecarPath = path.join(dirName, baseName + imgExt);
                if (fs.existsSync(sidecarPath)) {
                    const coverUrl = `manga://${encodeURIComponent(sidecarPath)}?path=${encodeURIComponent(sidecarPath)}`;
                    thumbnailCache.set(archivePath, coverUrl);
                    return coverUrl;
                }
            }
        }

        // Handle ZIP/CBZ files - extract and save thumbnail
        if (ext === '.zip' || ext === '.cbz') {
            const zip = new AdmZip(archivePath);
            const entries = zip.getEntries()
                .filter(entry => !entry.isDirectory && SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(entry.entryName).toLowerCase()))
                .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true, sensitivity: 'base' }));

            if (entries.length === 0) {
                return null;
            }

            // Extract first image and save as thumbnail
            const firstEntry = entries[0];
            const imageData = firstEntry.getData();

            if (thumbnailPath) {
                ensureThumbnailDir(archivePath);
                fs.writeFileSync(thumbnailPath, imageData);
                const coverUrl = `manga://${encodeURIComponent(thumbnailPath)}?path=${encodeURIComponent(thumbnailPath)}`;
                thumbnailCache.set(archivePath, coverUrl);
                return coverUrl;
            }

            // Fallback to manga:// protocol if no library root found
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

// Delete thumbnail for a specific file
export function deleteThumbnail(filePath: string): boolean {
    try {
        const thumbnailPath = getThumbnailPath(filePath);
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
            thumbnailCache.delete(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error deleting thumbnail for ${filePath}:`, error);
        return false;
    }
}

export async function extractCoversForFiles(filePaths: string[]): Promise<Record<string, string>> {
    const covers: Record<string, string> = {};
    const BATCH_SIZE = 10; // Process 10 files at a time to avoid overwhelming the system and file locks

    // Process files in batches with parallel execution within each batch
    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
        const batch = filePaths.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(async (filePath) => {
                const coverUrl = await extractCoverImage(filePath);
                return { filePath, coverUrl };
            })
        );

        // Merge batch results into covers object
        batchResults.forEach(({ filePath, coverUrl }) => {
            if (coverUrl) {
                covers[filePath] = coverUrl;
            }
        });
    }

    return covers;
}

/**
 * Extract covers for a specific batch of files (for lazy loading)
 * @param filePaths Array of file paths to extract covers from
 * @param startIndex Starting index in the array
 * @param count Number of covers to extract
 */
export async function extractCoversBatch(
    filePaths: string[],
    startIndex: number,
    count: number
): Promise<Record<string, string>> {
    const covers: Record<string, string> = {};
    const endIndex = Math.min(startIndex + count, filePaths.length);
    const batch = filePaths.slice(startIndex, endIndex);

    const results = await Promise.all(
        batch.map(async (filePath) => {
            const coverUrl = await extractCoverImage(filePath);
            return { filePath, coverUrl };
        })
    );

    results.forEach(({ filePath, coverUrl }) => {
        if (coverUrl) {
            covers[filePath] = coverUrl;
        }
    });

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
