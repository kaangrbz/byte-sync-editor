/**
 * ByteSync Editor - 4-in-1 Mode
 * Tüm formatları aynı anda gösteren textarea modu
 */

import stateManager from '../state-manager.js';
import { parseTextToBytes, formatBytesToText, getDelimiter } from '../utils.js';
import { recreateAllGrids } from '../grid-manager.js';

let fourInOneData = new Uint8Array(0);
let isUpdatingFourInOne = false;

// Delimiter ayarlarını al
const getDelimiterSettings = (): string => {
    const option = document.querySelector('input[name="delimiter-option"]:checked')?.getAttribute('value') || 'comma';
    const custom = (document.getElementById('custom-delimiter') as HTMLInputElement)?.value || '';
    return getDelimiter(option, custom);
};

// 4-in-1 mode'u güncelle
const updateFourInOneMode = (): void => {
    if (isUpdatingFourInOne) return;
    
    isUpdatingFourInOne = true;
    
    // Get current delimiter setting
    const delimiter = getDelimiterSettings();
    
    // Update all textareas
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        const textarea = document.getElementById(`four-in-one-${format}`) as HTMLTextAreaElement;
        if (textarea) {
            textarea.value = formatBytesToText(fourInOneData, format, delimiter);
        }
    });
    
    isUpdatingFourInOne = false;
};

// 4-in-1 mode input handler
const handleFourInOneInput = (sourceFormat: string, text: string): void => {
    if (isUpdatingFourInOne) return;
    
    isUpdatingFourInOne = true;
    
    // Get current delimiter setting
    const delimiter = getDelimiterSettings();
    
    // Parse the input text to bytes
    const parsedBytes = parseTextToBytes(text, sourceFormat);
    fourInOneData = new Uint8Array(parsedBytes);
    
    // Ana data array'ini de güncelle ve genişletme kontrolü yap
    const data = stateManager.getData();
    if (parsedBytes.length > data.length) {
        const newSize = Math.max(data.length * 2, parsedBytes.length);
        stateManager.expandDataArray(newSize);
        recreateAllGrids();
    }
    
    // Ana data'ya kopyala
    const currentData = stateManager.getData();
    for (let i = 0; i < Math.min(parsedBytes.length, currentData.length); i++) {
        stateManager.setByte(i, parsedBytes[i]);
    }
    
    // Update all other textareas
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        if (format !== sourceFormat) {
            const textarea = document.getElementById(`four-in-one-${format}`) as HTMLTextAreaElement;
            if (textarea) {
                textarea.value = formatBytesToText(fourInOneData, format, delimiter);
            }
        }
    });
    
    isUpdatingFourInOne = false;
};

// 4-in-1 mode'u temizle
const clearFourInOneMode = (): void => {
    fourInOneData = new Uint8Array(0);
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        const textarea = document.getElementById(`four-in-one-${format}`) as HTMLTextAreaElement;
        if (textarea) {
            textarea.value = '';
        }
    });
};

// Tüm formatları kopyala
const copyAllFourInOneFormats = (): void => {
    const delimiter = getDelimiterSettings();
    
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    let allFormats = '';
    
    formats.forEach((format, index) => {
        const textarea = document.getElementById(`four-in-one-${format}`) as HTMLTextAreaElement;
        if (textarea) {
            allFormats += `${format.toUpperCase()}:\n${textarea.value}\n\n`;
        }
    });
    
    navigator.clipboard.writeText(allFormats.trim()).then(() => {
        if (window.NotificationHelper) {
            window.NotificationHelper.showSuccess('Tüm formatlar panoya kopyalandı!');
        }
    }).catch(err => {
        if (window.NotificationHelper) {
            window.NotificationHelper.showError('Kopyalama başarısız!');
        }
        console.error('Failed to copy: ', err);
    });
};

// 4-in-1 mode copy butonlarını başlat
const initializeFourInOneCopyButtons = (): void => {
    document.querySelectorAll('.four-in-one-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = (btn as HTMLElement).dataset.format;
            const textarea = document.getElementById(`four-in-one-${format}`) as HTMLTextAreaElement;
            if (textarea && textarea.value) {
                navigator.clipboard.writeText(textarea.value).then(() => {
                    // Visual feedback
                    const originalText = btn.textContent;
                    (btn as HTMLElement).textContent = '✅ Copied!';
                    (btn as HTMLElement).style.backgroundColor = 'var(--theme-success)';
                    setTimeout(() => {
                        (btn as HTMLElement).textContent = originalText;
                        (btn as HTMLElement).style.backgroundColor = 'var(--theme-primary)';
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        });
    });
};

// 4-in-1 mode'u başlat
const initializeFourInOneMode = (): void => {
    // Load saved custom delimiter from localStorage
    const customDelimiterInput = document.getElementById('custom-delimiter') as HTMLInputElement;
    if (customDelimiterInput) {
        try {
            const savedCustomDelimiter = localStorage.getItem('bytesync-custom-delimiter');
            if (savedCustomDelimiter !== null) {
                customDelimiterInput.value = savedCustomDelimiter;
                // If custom delimiter exists, select 'custom' option and enable input
                const customOption = document.querySelector('input[name="delimiter-option"][value="custom"]') as HTMLInputElement;
                if (customOption) {
                    customOption.checked = true;
                    customDelimiterInput.disabled = false;
                }
            }
        } catch (err) {
            console.warn('localStorage okunamıyor:', err);
        }
    }
    
    // Add event listeners for delimiter options
    document.querySelectorAll('input[name="delimiter-option"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const customDelimiterInput = document.getElementById('custom-delimiter') as HTMLInputElement;
            if (customDelimiterInput) {
                customDelimiterInput.disabled = (e.target as HTMLInputElement).value !== 'custom';
            }
            updateFourInOneMode();
        });
    });
    
    // Add event listener for custom delimiter input
    if (customDelimiterInput) {
        customDelimiterInput.addEventListener('input', () => {
            // Save custom delimiter to localStorage
            try {
                localStorage.setItem('bytesync-custom-delimiter', customDelimiterInput.value);
            } catch (err) {
                console.warn('localStorage yazılamıyor:', err);
            }
            updateFourInOneMode();
        });
    }
    
    // Add event listeners for textarea inputs
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        const textarea = document.getElementById(`four-in-one-${format}`) as HTMLTextAreaElement;
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                handleFourInOneInput(format, (e.target as HTMLTextAreaElement).value);
            });
        }
    });
    
    // Add event listeners for action buttons
    const copyAllButton = document.getElementById('four-in-one-copy-all');
    if (copyAllButton) {
        copyAllButton.addEventListener('click', copyAllFourInOneFormats);
    }
    
    const clearAllButton = document.getElementById('four-in-one-clear-all');
    if (clearAllButton) {
        clearAllButton.addEventListener('click', clearFourInOneMode);
    }
    
    // Initialize copy buttons
    initializeFourInOneCopyButtons();
};

// Export
export {
    initializeFourInOneMode,
    updateFourInOneMode,
    handleFourInOneInput,
    clearFourInOneMode,
    copyAllFourInOneFormats,
    initializeFourInOneCopyButtons
};

