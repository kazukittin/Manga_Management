import fs from 'fs';
import path from 'path';

const EXTENSIONS = ['.zip', '.cbz', '.jpg', '.png', '.webp', '.avif', '.gif', '.pdf', '.epub'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];
const ARCHIVE_EXTENSIONS = ['.zip', '.cbz'];

export async function scanDirectory(dirPath: string): Promise<string[]> {
    try {
        const list = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const promises = list.map(async (dirent) => {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                // Skip thumbnail cache directory
                if (dirent.name === 'thumbnail') {
                    return [];
                }
                return scanDirectory(fullPath);
            } else {
                const ext = path.extname(fullPath).toLowerCase();
                if (EXTENSIONS.includes(ext)) {
                    // If it's an image file, check if there's a matching archive (sidecar cover)
                    if (IMAGE_EXTENSIONS.includes(ext)) {
                        const baseName = path.basename(fullPath, ext);
                        const dir = path.dirname(fullPath);
                        // Check if a matching archive exists
                        for (const archiveExt of ARCHIVE_EXTENSIONS) {
                            const archivePath = path.join(dir, baseName + archiveExt);
                            if (fs.existsSync(archivePath)) {
                                // This is a sidecar cover, skip it
                                return [];
                            }
                        }
                    }
                    return [fullPath];
                }
                return [];
            }
        });
        const results = await Promise.all(promises);
        return results.flat();
    } catch (err) {
        console.error(`Error scanning ${dirPath}:`, err);
        return [];
    }
}
