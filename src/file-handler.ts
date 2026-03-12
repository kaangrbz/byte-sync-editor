/**
 * ByteSync Editor - File Handler
 * File System Access API ile modern dosya işlemleri
 */

import type { FileDialogOptions, FileDialogResult } from './types/index.js';

const LAST_FOLDER_KEY = 'bytesync-last-folder';

/**
 * Son açılan klasörü localStorage'a kaydet
 */
function saveLastFolder(folderPath: string): void {
    try {
        localStorage.setItem(LAST_FOLDER_KEY, JSON.stringify({ folder: folderPath }));
    } catch (e) {
        console.warn('Son klasör bilgisi kaydedilemedi:', e);
    }
}

/**
 * File System Access API ile dosya seçme dialogu
 */
async function showOpenFilePickerNative(
    options: FileDialogOptions
): Promise<FileDialogResult> {
    if (!window.showOpenFilePicker) {
        throw new Error('File System Access API desteklenmiyor');
    }

    try {
        const acceptTypes: Record<string, string[]> = {};
        
        if (options.filters && options.filters.length > 0) {
            // İlk filter'ı kullan (en spesifik olanı)
            const primaryFilter = options.filters[0];
            if (primaryFilter.extensions.length > 0) {
                const mimeTypes = primaryFilter.extensions.map(ext => {
                    if (ext === '*') return '*/*';
                    if (ext === 'ptp') return 'text/plain';
                    return `application/${ext}`;
                });
                acceptTypes[primaryFilter.name] = mimeTypes;
            }
        }

        const fileHandles = await window.showOpenFilePicker({
            types: Object.keys(acceptTypes).length > 0 ? [
                {
                    description: options.filters?.[0]?.name || 'Files',
                    accept: acceptTypes
                }
            ] : undefined,
            excludeAcceptAllOption: false,
            multiple: false
        });

        if (fileHandles.length === 0) {
            return { canceled: true };
        }

        const fileHandle = fileHandles[0];
        const file = await fileHandle.getFile();
        const content = await file.text();

        // Klasör bilgisini kaydet (parent directory)
        // Not: File System Access API'de direkt klasör bilgisi yok, 
        // ama dosya adından çıkarabiliriz
        const fileName = file.name;
        saveLastFolder(fileName);

        return {
            canceled: false,
            filePaths: [file.name],
            fileContent: content,
            fileName: fileName
        };
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            return { canceled: true };
        }
        throw error;
    }
}

/**
 * Standart file input ile dosya seçme (fallback)
 */
function showOpenFilePickerFallback(
    options: FileDialogOptions
): Promise<FileDialogResult> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';

        if (options.filters && options.filters.length > 0) {
            const acceptExtensions = options.filters
                .flatMap(filter => filter.extensions.map(ext => `.${ext}`))
                .join(',');
            input.accept = acceptExtensions;
        }

        input.addEventListener('change', async (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (!file) {
                resolve({ canceled: true });
                return;
            }

            try {
                const content = await file.text();
                resolve({
                    canceled: false,
                    filePaths: [file.name],
                    fileContent: content,
                    fileName: file.name
                });
            } catch (error) {
                resolve({
                    canceled: false,
                    error: (error as Error).message
                });
            }

            document.body.removeChild(input);
        });

        input.addEventListener('cancel', () => {
            resolve({ canceled: true });
            document.body.removeChild(input);
        });

        document.body.appendChild(input);
        input.click();
    });
}

/**
 * Dosya seçme dialogu göster
 * File System Access API kullanır, desteklenmiyorsa fallback kullanır
 */
export async function showOpenFileDialog(
    options: FileDialogOptions = {}
): Promise<FileDialogResult> {
    // File System Access API destekleniyor mu?
    if (window.showOpenFilePicker) {
        try {
            return await showOpenFilePickerNative(options);
        } catch (error) {
            console.warn('File System Access API hatası, fallback kullanılıyor:', error);
            // Fallback'e geç
        }
    }

    // Fallback: standart file input
    return await showOpenFilePickerFallback(options);
}

/**
 * Electron API uyumluluğu için wrapper
 * Electron API'si kaldırıldığı için bu fonksiyon sadece web API kullanır
 */
export async function showOpenDialog(
    options: FileDialogOptions = {}
): Promise<FileDialogResult> {
    return showOpenFileDialog(options);
}

export interface OpenBinaryResult {
    canceled: boolean;
    data?: Uint8Array;
    fileName?: string;
}

/**
 * Binary dosya aç (ham byte dizisi). File System Access API veya fallback kullanır.
 */
export async function openBinaryFileDialog(): Promise<OpenBinaryResult> {
    if (window.showOpenFilePicker) {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                multiple: false
            });
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            return {
                canceled: false,
                data: new Uint8Array(buffer),
                fileName: file.name
            };
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                return { canceled: true };
            }
            throw err;
        }
    }
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) {
                resolve({ canceled: true });
                return;
            }
            try {
                const buffer = await file.arrayBuffer();
                resolve({
                    canceled: false,
                    data: new Uint8Array(buffer),
                    fileName: file.name
                });
            } catch (e) {
                resolve({ canceled: false, error: (e as Error).message } as OpenBinaryResult & { error?: string });
            }
            input.remove();
        });
        const cancel = () => {
            resolve({ canceled: true });
            input.remove();
        };
        input.addEventListener('cancel', cancel);
        document.body.appendChild(input);
        input.click();
    });
}

/**
 * Byte dizisini dosya olarak indirir.
 */
export function downloadBytes(data: Uint8Array, fileName: string): void {
    const arrayBuffer = new ArrayBuffer(data.byteLength);
    const view = new Uint8Array(arrayBuffer);

    view.set(data);

    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'bytesync.bin';
    a.click();
    URL.revokeObjectURL(url);
}

