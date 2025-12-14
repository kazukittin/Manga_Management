export type FileType = 'archive' | 'pdf' | 'epub' | 'image';

export function getFileType(filePath: string): FileType {
    const ext = filePath.toLowerCase().split('.').pop() || '';

    if (['zip', 'cbz'].includes(ext)) return 'archive';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'epub') return 'epub';
    return 'image';
}

export function getFileExtension(filePath: string): string {
    return filePath.toLowerCase().split('.').pop() || '';
}
