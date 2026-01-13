/**
 * ByteSync Editor - Docklight PTP Parser
 * PTP dosya parsing ve yönetimi
 */

import stateManager from './state-manager.js';
import { parseTextToBytes, formatBytesToText, getDelimiter } from './utils.js';
import { recreateAllGrids } from './grid-manager.js';
import { switchTab } from './tab-manager.js';

// Types
interface PTPFileData {
    name: string;
    size: number;
    content: string;
}

interface PTPSendBlock {
    index: number | null;
    description: string;
    hexString: string;
    bytes: Uint8Array;
    settings: number[];
}

interface PTPParsedData {
    version: string | null;
    commSettings: {
        values?: string[];
    };
    sendBlocks: PTPSendBlock[];
}

// State
let ptpFileData: PTPFileData | null = null;
let ptpParsedData: PTPParsedData | null = null;
let ptpSelectedBlockIndex = -1;
let isUpdatingPTPTextareas = false;

// Parse hex string to byte array
const parseHexString = (hexStr: string): number[] => {
    if (!hexStr || typeof hexStr !== 'string') {
        return [];
    }
    
    // Remove whitespace and split by spaces
    const hexValues = hexStr.trim().split(/\s+/);
    const bytes: number[] = [];
    
    for (const hex of hexValues) {
        // Remove any non-hex characters and parse
        const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');
        if (cleanHex.length > 0) {
            const byte = parseInt(cleanHex, 16);
            if (!isNaN(byte) && byte >= 0 && byte <= 255) {
                bytes.push(byte);
            }
        }
    }
    
    return bytes;
};

// Parse PTP file content
const parsePTPFile = (content: string): PTPParsedData => {
    const lines = content.split(/\r?\n/);
    const result: PTPParsedData = {
        version: null,
        commSettings: {},
        sendBlocks: []
    };
    
    let currentSection: string | null = null;
    let currentSendBlock: PTPSendBlock | null = null;
    let lineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // Check for section headers
        if (line === 'VERSION') {
            currentSection = 'version';
            continue;
        } else if (line === 'COMMSETTINGS') {
            currentSection = 'commSettings';
            continue;
        } else if (line === 'COMMDISPLAY') {
            currentSection = 'commDisplay';
            continue;
        } else if (line === 'VERSATAP') {
            currentSection = 'versatap';
            continue;
        } else if (line === 'CHANNELALIAS') {
            currentSection = 'channelAlias';
            continue;
        } else if (line === 'SEND') {
            // Save previous block if exists
            if (currentSendBlock) {
                result.sendBlocks.push(currentSendBlock);
            }
            
            // Start new SEND block
            currentSendBlock = {
                index: null,
                description: '',
                hexString: '',
                bytes: new Uint8Array(0),
                settings: []
            };
            currentSection = 'send';
            lineIndex = 0;
            continue;
        }
        
        // Process section content
        if (currentSection === 'version') {
            result.version = line;
            currentSection = null;
        } else if (currentSection === 'commSettings') {
            // Store comm settings
            if (!result.commSettings.values) {
                result.commSettings.values = [];
            }
            result.commSettings.values.push(line);
        } else if (currentSection === 'send' && currentSendBlock) {
            if (lineIndex === 0) {
                // First line after SEND is the index
                currentSendBlock.index = parseInt(line, 10) || 0;
            } else if (lineIndex === 1) {
                // Second line is the description
                currentSendBlock.description = line;
            } else if (lineIndex === 2) {
                // Third line is the hex string
                currentSendBlock.hexString = line;
                currentSendBlock.bytes = new Uint8Array(parseHexString(line));
            } else {
                // Remaining lines are settings
                const setting = parseInt(line, 10);
                if (!isNaN(setting)) {
                    currentSendBlock.settings.push(setting);
                }
            }
            lineIndex++;
        }
    }
    
    // Don't forget the last block
    if (currentSendBlock) {
        result.sendBlocks.push(currentSendBlock);
    }
    
    return result;
};

// Load PTP file
const loadPTPFile = (file: File): void => {
    if (!file || !file.name.endsWith('.ptp')) {
        if (window.NotificationHelper) {
            window.NotificationHelper.showError('Lütfen geçerli bir .ptp dosyası seçin!');
        }
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            ptpFileData = {
                name: file.name,
                size: file.size,
                content: content
            };
            
            // Parse the file
            ptpParsedData = parsePTPFile(content);
            
            // Display the parsed data
            displayPTPData(ptpParsedData);
            
            // Show file info
            showPTPFileInfo(ptpFileData, ptpParsedData);
            
            // Load preferences after file is loaded
            loadPTPPreferences();
            
            if (window.NotificationHelper) {
                window.NotificationHelper.showSuccess('PTP dosyası başarıyla yüklendi!');
            }
        } catch (error) {
            console.error('PTP parse error:', error);
            if (window.NotificationHelper) {
                window.NotificationHelper.showError('Dosya parse edilirken hata oluştu: ' + (error as Error).message);
            }
        }
    };
    
    reader.onerror = () => {
        if (window.NotificationHelper) {
            window.NotificationHelper.showError('Dosya okunurken hata oluştu!');
        }
    };
    
    reader.readAsText(file);
};

// Show file information
const showPTPFileInfo = (fileData: PTPFileData, parsedData: PTPParsedData): void => {
    const fileInfoDiv = document.getElementById('ptp-file-info');
    const fileInfoContent = document.getElementById('ptp-file-info-content');
    
    if (!fileInfoDiv || !fileInfoContent) return;
    
    fileInfoDiv.classList.remove('hidden');
    
    const infoHTML = `
        <div><strong>Dosya Adı:</strong> ${fileData.name}</div>
        <div><strong>Dosya Boyutu:</strong> ${fileData.size} bytes</div>
        <div><strong>Versiyon:</strong> ${parsedData.version || 'Bilinmiyor'}</div>
        <div><strong>SEND Blok Sayısı:</strong> ${parsedData.sendBlocks.length}</div>
    `;
    
    fileInfoContent.innerHTML = infoHTML;
};

// Display parsed PTP data in tab
const displayPTPData = (parsedData: PTPParsedData): void => {
    const mainContent = document.getElementById('ptp-main-content');
    const blocksList = document.getElementById('ptp-blocks-list');
    
    if (!mainContent || !blocksList) return;
    
    // Show main content
    mainContent.classList.remove('hidden');
    
    // Clear previous blocks
    blocksList.innerHTML = '';
    
    if (!parsedData || !parsedData.sendBlocks || parsedData.sendBlocks.length === 0) {
        blocksList.innerHTML = '<p class="text-center p-4" style="color: var(--theme-textSecondary);">SEND bloğu bulunamadı.</p>';
        return;
    }
    
    // Create block cards
    parsedData.sendBlocks.forEach((block, index) => {
        const blockCard = createPTPBlockCard(block, index);
        blocksList.appendChild(blockCard);
    });
    
    // Select first block by default
    if (parsedData.sendBlocks.length > 0) {
        selectPTPBlock(0);
    }
};

// Create a block card element
const createPTPBlockCard = (block: PTPSendBlock, index: number): HTMLElement => {
    const card = document.createElement('div');
    card.className = 'ptp-block-card cursor-pointer';
    card.style.cssText = 'background-color: var(--theme-background); border: 2px solid var(--theme-border); border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.5rem; transition: all 0.2s ease;';
    card.dataset.blockIndex = index.toString();
    
    // Hex önizleme oluştur (maksimum 16 byte göster)
    const previewBytes = Array.from(block.bytes.slice(0, 16));
    const hexPreview = formatBytesToText(previewBytes, 'hex', ' ');
    const previewText = block.bytes.length > 16 ? `${hexPreview}...` : hexPreview;
    
    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h6 class="font-semibold mb-1" style="color: var(--theme-text);">
                    ${block.description || 'Açıklama yok'}
                </h6>
                <p class="text-xs mb-1" style="color: var(--theme-textSecondary);">
                    ${block.bytes.length} bytes
                </p>
                <p class="text-xs font-mono" style="color: var(--theme-textSecondary); opacity: 0.8;">
                    ${previewText}
                </p>
            </div>
        </div>
    `;
    
    // Click handler to select block
    card.addEventListener('click', () => {
        selectPTPBlock(index);
    });
    
    return card;
};

// Select PTP block and update textareas
const selectPTPBlock = (index: number): void => {
    if (!ptpParsedData || !ptpParsedData.sendBlocks || !ptpParsedData.sendBlocks[index]) {
        return;
    }
    
    ptpSelectedBlockIndex = index;
    const block = ptpParsedData.sendBlocks[index];
    
    // Update block card highlights
    document.querySelectorAll('.ptp-block-card').forEach(card => {
        (card as HTMLElement).style.borderColor = 'var(--theme-border)';
        (card as HTMLElement).style.backgroundColor = 'var(--theme-background)';
    });
    
    const selectedCard = document.querySelector(`.ptp-block-card[data-block-index="${index}"]`) as HTMLElement;
    if (selectedCard) {
        selectedCard.style.borderColor = 'var(--theme-primary)';
        selectedCard.style.backgroundColor = 'var(--theme-surfaceHover)';
    }
    
    // Show textareas and hide no-selection message
    const textareasContainer = document.getElementById('ptp-textareas-container');
    const noSelection = document.getElementById('ptp-no-selection');
    
    if (textareasContainer) textareasContainer.classList.remove('hidden');
    if (noSelection) noSelection.classList.add('hidden');
    
    // Update textareas
    updatePTPTextareas(block);
};

// Update PTP textareas with block data
const updatePTPTextareas = (block: PTPSendBlock): void => {
    if (isUpdatingPTPTextareas) return;
    
    isUpdatingPTPTextareas = true;
    
    const delimiter = getPTPDelimiter();
    const formats = ['hex', 'ascii', 'decimal', 'binary'];
    
    formats.forEach(format => {
        const textarea = document.getElementById(`ptp-textarea-${format}`) as HTMLTextAreaElement;
        if (textarea) {
            textarea.value = formatBytesToText(Array.from(block.bytes), format, delimiter);
        }
    });
    
    isUpdatingPTPTextareas = false;
};

// Handle PTP textarea input
const handlePTPTextareaInput = (sourceFormat: string, text: string): void => {
    if (isUpdatingPTPTextareas) return;
    if (ptpSelectedBlockIndex === -1) return;
    if (!ptpParsedData || !ptpParsedData.sendBlocks || !ptpParsedData.sendBlocks[ptpSelectedBlockIndex]) return;
    
    isUpdatingPTPTextareas = true;
    
    const delimiter = getPTPDelimiter();
    const block = ptpParsedData.sendBlocks[ptpSelectedBlockIndex];
    
    // Parse the input text to bytes
    const parsedBytes = parseTextToBytes(text, sourceFormat);
    block.bytes = new Uint8Array(parsedBytes);
    
    // Update hex string
    block.hexString = parsedBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    
    // Update all other textareas
    const formats = ['hex', 'ascii', 'decimal', 'binary'];
    formats.forEach(format => {
        if (format !== sourceFormat) {
            const textarea = document.getElementById(`ptp-textarea-${format}`) as HTMLTextAreaElement;
            if (textarea) {
                textarea.value = formatBytesToText(parsedBytes, format, delimiter);
            }
        }
    });
    
    isUpdatingPTPTextareas = false;
    
    // Save preferences
    savePTPPreferences();
};

// Get PTP delimiter settings
const getPTPDelimiter = (): string => {
    const option = (document.querySelector('input[name="ptp-delimiter-option"]:checked') as HTMLInputElement)?.value || 'comma';
    const custom = (document.getElementById('ptp-custom-delimiter') as HTMLInputElement)?.value || '';
    return getDelimiter(option, custom);
};

// Save PTP preferences
const savePTPPreferences = (): void => {
    try {
        const preferences = {
            delimiterOption: (document.querySelector('input[name="ptp-delimiter-option"]:checked') as HTMLInputElement)?.value || 'comma',
            customDelimiter: (document.getElementById('ptp-custom-delimiter') as HTMLInputElement)?.value || '',
            selectedBlockIndex: ptpSelectedBlockIndex
        };
        localStorage.setItem('bytesync-ptp-preferences', JSON.stringify(preferences));
    } catch (error) {
        console.warn('PTP preferences kaydedilemedi:', error);
    }
};

// Load PTP preferences
const loadPTPPreferences = (): void => {
    try {
        const saved = localStorage.getItem('bytesync-ptp-preferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            
            // Load delimiter option
            const delimiterOption = document.querySelector(`input[name="ptp-delimiter-option"][value="${preferences.delimiterOption}"]`) as HTMLInputElement;
            if (delimiterOption) {
                delimiterOption.checked = true;
            }
            
            // Load custom delimiter
            const customDelimiterInput = document.getElementById('ptp-custom-delimiter') as HTMLInputElement;
            if (customDelimiterInput && preferences.customDelimiter) {
                customDelimiterInput.value = preferences.customDelimiter;
                if (preferences.delimiterOption === 'custom') {
                    customDelimiterInput.disabled = false;
                }
            }
            
            // Load selected block index
            if (preferences.selectedBlockIndex !== undefined && preferences.selectedBlockIndex >= 0) {
                if (ptpParsedData && ptpParsedData.sendBlocks && ptpParsedData.sendBlocks[preferences.selectedBlockIndex]) {
                    selectPTPBlock(preferences.selectedBlockIndex);
                }
            }
        }
    } catch (error) {
        console.warn('PTP preferences yüklenemedi:', error);
    }
};

// Add PTP block to main editor
const addPTPToEditor = (blockIndex: number): void => {
    if (!ptpParsedData || !ptpParsedData.sendBlocks || !ptpParsedData.sendBlocks[blockIndex]) {
        if (window.NotificationHelper) {
            window.NotificationHelper.showError('Blok bulunamadı!');
        }
        return;
    }
    
    const block = ptpParsedData.sendBlocks[blockIndex];
    const bytes = block.bytes;
    
    if (!bytes || bytes.length === 0) {
        if (window.NotificationHelper) {
            window.NotificationHelper.showError('Blokta byte verisi yok!');
        }
        return;
    }
    
    // Check if we need to expand the data array
    const requiredSize = bytes.length;
    const data = stateManager.getData();
    if (requiredSize > data.length) {
        const newSize = Math.max(data.length * 2, requiredSize);
        stateManager.expandDataArray(newSize);
        recreateAllGrids();
    }
    
    // Copy bytes to data array starting from index 0
    for (let i = 0; i < bytes.length; i++) {
        stateManager.setByte(i, bytes[i]);
    }
    
    // Switch to hex tab to show the data
    switchTab('hex');
    
    if (window.NotificationHelper) {
        window.NotificationHelper.showSuccess(`${bytes.length} byte ana editöre eklendi!`);
    }
};

// Initialize Docklight PTP Mode
const initializeDocklightPTPMode = (): void => {
    // Load saved preferences
    loadPTPPreferences();
    
    // File input
    const fileInput = document.getElementById('ptp-file-input') as HTMLInputElement;
    const browseBtn = document.getElementById('ptp-browse-btn');
    const uploadArea = document.getElementById('ptp-upload-area');
    
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', async () => {
            // Check if Electron API is available
            if (window.electronAPI && (window.electronAPI as any).showOpenDialog) {
                try {
                    const result = await (window.electronAPI as any).showOpenDialog({
                        title: 'Select PTP File',
                        filters: [
                            { name: 'PTP Files', extensions: ['ptp'] },
                            { name: 'All Files', extensions: ['*'] }
                        ],
                        properties: ['openFile']
                    });
                    
                    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                        // File content is already read in main process
                        if (result.fileContent && result.fileName) {
                            // Create a File-like object from the content
                            const blob = new Blob([result.fileContent], { type: 'text/plain' });
                            const file = new File([blob], result.fileName, { type: 'text/plain' });
                            
                            loadPTPFile(file);
                            
                            // Update file name display
                            const fileNameDiv = document.getElementById('ptp-file-name');
                            if (fileNameDiv) {
                                fileNameDiv.textContent = `Selected: ${result.fileName}`;
                                fileNameDiv.style.color = 'var(--theme-success)';
                            }
                        } else if (result.error) {
                            if (window.NotificationHelper) {
                                window.NotificationHelper.showError('Dosya okunurken hata oluştu: ' + result.error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error opening dialog:', error);
                    // Fallback to file input
                    fileInput.click();
                }
            } else {
                // Web environment - use file input
                fileInput.click(); 
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                loadPTPFile(file);
                // Update file name display
                const fileNameDiv = document.getElementById('ptp-file-name');
                if (fileNameDiv) {
                    fileNameDiv.textContent = `Selected: ${file.name}`;
                    fileNameDiv.style.color = 'var(--theme-success)';
                }
            }
        });
    }
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            (uploadArea as HTMLElement).style.borderColor = 'var(--theme-primary)';
            (uploadArea as HTMLElement).style.backgroundColor = 'var(--theme-surfaceHover)';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            (uploadArea as HTMLElement).style.borderColor = 'var(--theme-border)';
            (uploadArea as HTMLElement).style.backgroundColor = 'transparent';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            (uploadArea as HTMLElement).style.borderColor = 'var(--theme-border)';
            (uploadArea as HTMLElement).style.backgroundColor = 'transparent';
            
            const file = e.dataTransfer?.files[0];
            if (file && file.name.endsWith('.ptp')) {
                loadPTPFile(file);
                // Update file name display
                const fileNameDiv = document.getElementById('ptp-file-name');
                if (fileNameDiv) {
                    fileNameDiv.textContent = `Selected: ${file.name}`;
                    fileNameDiv.style.color = 'var(--theme-success)';
                }
            } else {
                if (window.NotificationHelper) {
                    window.NotificationHelper.showError('Lütfen geçerli bir .ptp dosyası seçin!');
                }
            }
        });
    }
    
    // Separator options event listeners
    document.querySelectorAll('input[name="ptp-delimiter-option"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const customDelimiterInput = document.getElementById('ptp-custom-delimiter') as HTMLInputElement;
            if (customDelimiterInput) {
                customDelimiterInput.disabled = (e.target as HTMLInputElement).value !== 'custom';
            }
            
            // Update textareas if a block is selected
            if (ptpSelectedBlockIndex !== -1 && ptpParsedData && ptpParsedData.sendBlocks && ptpParsedData.sendBlocks[ptpSelectedBlockIndex]) {
                updatePTPTextareas(ptpParsedData.sendBlocks[ptpSelectedBlockIndex]);
            }
            
            savePTPPreferences();
        });
    });
    
    // Custom delimiter input
    const customDelimiterInput = document.getElementById('ptp-custom-delimiter') as HTMLInputElement;
    if (customDelimiterInput) {
        customDelimiterInput.addEventListener('input', () => {
            // Update textareas if a block is selected
            if (ptpSelectedBlockIndex !== -1 && ptpParsedData && ptpParsedData.sendBlocks && ptpParsedData.sendBlocks[ptpSelectedBlockIndex]) {
                updatePTPTextareas(ptpParsedData.sendBlocks[ptpSelectedBlockIndex]);
            }
            savePTPPreferences();
        });
    }
    
    // Textarea input event listeners
    const formats = ['hex', 'ascii', 'decimal', 'binary'];
    formats.forEach(format => {
        const textarea = document.getElementById(`ptp-textarea-${format}`) as HTMLTextAreaElement;
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                handlePTPTextareaInput(format, (e.target as HTMLTextAreaElement).value);
            });
        }
    });
    
    // Copy buttons
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('ptp-copy-btn')) {
            const format = target.dataset.format;
            const textarea = document.getElementById(`ptp-textarea-${format}`) as HTMLTextAreaElement;
            if (textarea && textarea.value) {
                navigator.clipboard.writeText(textarea.value).then(() => {
                    // Visual feedback
                    const originalText = target.textContent;
                    target.textContent = '✅ Copied!';
                    target.style.backgroundColor = 'var(--theme-success)';
                    setTimeout(() => {
                        target.textContent = originalText;
                        target.style.backgroundColor = 'var(--theme-primary)';
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        }
    });
};

// Export
export {
    parsePTPFile,
    parseHexString,
    loadPTPFile,
    initializeDocklightPTPMode,
    addPTPToEditor,
    selectPTPBlock
};

