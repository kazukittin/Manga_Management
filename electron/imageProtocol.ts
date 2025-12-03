import { protocol } from 'electron';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];

export function registerMangaProtocol() {
    protocol.registerBufferProtocol('manga', (request, callback) => {
        try {
            const url = new URL(request.url);
            const archivePath = url.searchParams.get('path');
            const indexStr = url.searchParams.get('index');

            if (!archivePath) {
                callback({ statusCode: 400, data: Buffer.from('Missing path parameter') });
                return;
            }

            const index = indexStr ? parseInt(indexStr, 10) : 0;

            // Check if file exists
            if (!fs.existsSync(archivePath)) {
                callback({ statusCode: 404, data: Buffer.from('File not found') });
                return;
            }

            const ext = path.extname(archivePath).toLowerCase();

            // Handle ZIP/CBZ files
            if (ext === '.zip' || ext === '.cbz') {
                const zip = new AdmZip(archivePath);
                const entries = zip.getEntries()
                    .filter(entry => !entry.isDirectory && SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(entry.entryName).toLowerCase()))
                    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true, sensitivity: 'base' }));

                if (index < 0 || index >= entries.length) {
                    callback({ statusCode: 404, data: Buffer.from('Image index out of range') });
                    return;
                }

                const entry = entries[index];
                const imageBuffer = entry.getData();
                const mimeType = getMimeType(path.extname(entry.entryName));

                callback({
                    statusCode: 200,
                    data: imageBuffer,
                    mimeType: mimeType,
                });
            }
            // Handle standalone image files
            else if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
                const imageBuffer = fs.readFileSync(archivePath);
                const mimeType = getMimeType(ext);

                callback({
                    statusCode: 200,
                    data: imageBuffer,
                    mimeType: mimeType,
                });
            } else {
                callback({ statusCode: 400, data: Buffer.from('Unsupported file type') });
            }
        } catch (error) {
            console.error('Error in manga protocol handler:', error);
            callback({ statusCode: 500, data: Buffer.from('Internal server error') });
        }
    });
}

function getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}
