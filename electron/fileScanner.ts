import fs from 'fs';
import path from 'path';

const EXTENSIONS = ['.zip', '.cbz', '.jpg', '.png', '.webp', '.avif', '.pdf', '.epub'];

export async function scanDirectory(dirPath: string): Promise<string[]> {
    try {
        const list = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const promises = list.map(async (dirent) => {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                return scanDirectory(fullPath);
            } else {
                const ext = path.extname(fullPath).toLowerCase();
                if (EXTENSIONS.includes(ext)) {
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
