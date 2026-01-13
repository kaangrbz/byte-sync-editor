/**
 * ByteSync Editor - Grid Manager
 * Grid oluşturma, yönetimi ve input event handling
 */

import stateManager from './state-manager.js';
import { parseTextToBytes, formatBytesToText } from './utils.js';
import type { GridFormat } from './types/index.js';

// DOM element referansları
let hexGrid: HTMLElement | null = null;
let asciiGrid: HTMLElement | null = null;
let decimalGrid: HTMLElement | null = null;
let binaryGrid: HTMLElement | null = null;

// Callback fonksiyonları
let onRecreateGridsCallback: (() => void) | null = null;
let onUpdateViewsCallback: (() => void) | null = null;
let onPositionUpdateCallback: (() => void) | null = null;
let onClearSelectionCallback: (() => void) | null = null;
let onSelectAllCallback: (() => void) | null = null;

// Yardımcı fonksiyonlar
const getActiveTab = (): HTMLElement | null => {
    return document.querySelector('.tab-content.active');
};

const getActiveType = (): string | undefined => {
    const cell = getActiveTab()?.querySelector('.input-cell') as HTMLElement;
    return cell?.dataset.type;
};

const getActiveInput = (index: number): HTMLElement | null => {
    return document.querySelector(`[data-index="${index}"]`);
};

// Tamamlanmış değer kontrolü
const isCompleteValue = (value: string, type: string): boolean => {
    const patterns: Record<string, RegExp> = {
        hex: /^[0-9a-fA-F]{2}$/,
        decimal: /^\d{3}$/,
        binary: /^[01]{8}$/,
        ascii: /^.{1}$/  // Boşluk karakteri de dahil olmak üzere herhangi bir karakter
    };
    return patterns[type]?.test(value) || false;
};

// Tek karakter validasyonu
const validateInputChar = (type: GridFormat, char: string, currentValue: string): boolean => {
    switch (type) {
        case 'hex':
            // Hex: Sadece 0-9, a-f, A-F karakterleri, maksimum 2 karakter
            return /^[0-9a-fA-F]$/.test(char) && currentValue.length < 2;
        case 'decimal':
            // Decimal: Sadece 0-9 karakterleri, maksimum 3 karakter
            return /^[0-9]$/.test(char) && currentValue.length < 3;
        case 'binary':
            // Binary: Sadece 0-1 karakterleri, maksimum 8 karakter
            return /^[01]$/.test(char) && currentValue.length < 8;
        case 'ascii':
            // ASCII: Herhangi bir karakter (değişiklik yok)
            return true;
        default:
            return false;
    }
};

// Decimal için 0-255 aralığı kontrolü
const validateDecimalValue = (value: string): boolean => {
    if (value === '') return true; // Boş değer geçerli
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
};

// Grid oluşturma fonksiyonu
const createGrid = (grid: HTMLElement, className: string, type: string): void => {
    if (!grid) {
        console.error(`Grid bulunamadı: ${type}`);
        return;
    }
    grid.innerHTML = '';
    
    // Input sayısı: veri boyutu + 1 (yeni veri girebilmek için)
    const inputCount = stateManager.getInputCount();
    const data = stateManager.getData();
    
    // Data array'i gerekirse genişlet
    if (inputCount > data.length) {
        const newSize = Math.max(data.length * 2, inputCount);
        stateManager.expandDataArray(newSize);
    }
    
    for (let i = 0; i < inputCount; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = `input-cell ${className}`;
        input.dataset.index = i.toString();
        input.dataset.type = type;
        
        // Inputları boş başlat
        input.value = '';
        
        // Add event listeners
        input.addEventListener('focus', handleFocus);
        input.addEventListener('beforeinput', handleBeforeInput);
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeydown);
        input.addEventListener('paste', handlePaste);

        grid.appendChild(input);
    }
};

// Tüm grid'leri yeniden oluştur
const recreateAllGrids = (): void => {
    if (hexGrid && asciiGrid && decimalGrid && binaryGrid) {
        createGrid(hexGrid, 'hex-cell', 'hex');
        createGrid(asciiGrid, 'ascii-cell', 'ascii');
        createGrid(decimalGrid, 'decimal-cell', 'decimal');
        createGrid(binaryGrid, 'binary-cell', 'binary');
        
        // Aktif index'i koru
        const inputCount = stateManager.getInputCount();
        const activeIndex = stateManager.getActiveIndex();
        if (activeIndex !== -1 && activeIndex < inputCount) {
            setTimeout(() => {
                const activeInput = document.querySelector(`[data-index="${activeIndex}"]`);
                if (activeInput) {
                    (activeInput as HTMLElement).focus();
                    (activeInput as HTMLInputElement).select();
                }
            }, 100);
        }
        
        // Pozisyon göstergesini güncelle
        updatePositionIndicator();
    }
};

// Hücre odaklanma ve vurgulama
const handleFocus = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    // Eğer tüm seçili ise, tek hücreye odaklanıldığında seçimi temizle
    if (stateManager.getAllSelected()) {
        if (onClearSelectionCallback) {
            onClearSelectionCallback();
        }
    }
    
    const index = parseInt(target.dataset.index || '0', 10);
    highlightCell(index);
};

// BeforeInput event handler - Geçersiz karakterleri engelle
const handleBeforeInput = (event: InputEvent): void => {
    const target = event.target as HTMLInputElement;
    const type = target.dataset.type as GridFormat;
    const currentValue = target.value;
    const inputChar = event.data || '';
    
    // Silme işlemleri için (Backspace, Delete) validasyon yapma
    if (!inputChar) {
        return; // Silme işlemlerine izin ver
    }
    
    // Selection durumunu dikkate alarak yeni değeri hesapla
    const selectionStart = target.selectionStart || 0;
    const selectionEnd = target.selectionEnd || 0;
    const valueBeforeSelection = currentValue.slice(0, selectionStart);
    const valueAfterSelection = currentValue.slice(selectionEnd);
    const newValue = valueBeforeSelection + inputChar + valueAfterSelection;
    
    // Karakter validasyonu (selection durumunu dikkate alarak)
    if (!validateInputChar(type, inputChar, valueBeforeSelection)) {
        event.preventDefault();
        return;
    }
    
    // Decimal için overflow kontrolü (yeni değer 0-255 aralığında olmalı)
    if (type === 'decimal') {
        if (!validateDecimalValue(newValue)) {
            event.preventDefault();
            return;
        }
    }
};

// Input işleme ve tüm view'ları güncelleme
const handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.dataset.index || '0', 10);
    const type = target.dataset.type as GridFormat;
    const value = target.value;

    // Boş input - byte değerini 0 yap (görünmez olacak çünkü touchedIndices kontrolü var)
    if (value.length === 0) {
        stateManager.setByte(index, 0);
        updateAllViews(true);
        return;
    }

    // Parse ve kaydet - beforeinput ile zaten validasyon yapıldı, burada sadece parse edip kaydet
    const bytes = parseTextToBytes(value, type);
    
    if (bytes.length > 0) {
        // ASCII için: UTF-8 karakterler çoklu byte olabilir, tüm byte'ları kaydet
        if (type === 'ascii' && bytes.length > 1) {
            // Çoklu byte karakter (örn: ğ, ü, ş) - tüm byte'ları kaydet
            const data = stateManager.getData();
            for (let i = 0; i < bytes.length; i++) {
                const globalIndex = index + i;
                if (globalIndex >= data.length) {
                    // Array'i genişlet
                    const newSize = Math.max(data.length * 2, globalIndex + 1);
                    stateManager.expandDataArray(newSize);
                }
                stateManager.setByte(globalIndex, bytes[i]);
            }
        } else {
            // Tek byte karakter veya diğer formatlar - sadece ilk byte'ı kaydet
            stateManager.setByte(index, bytes[0]);
        }
        
        // Veri boyutu değişti, grid'leri yeniden oluştur (yeni input eklemek için)
        recreateAllGrids();
        
        updateAllViews(true);
        
        // Auto-navigation - değer tamamlandıysa bir sonraki input'a geç
        // ASCII için: çoklu byte karakterlerde tüm byte'lar yazıldıktan sonra geç
        if (isCompleteValue(value, type)) {
            setTimeout(() => {
                const nextIndex = type === 'ascii' && bytes.length > 1 
                    ? index + bytes.length 
                    : index + 1;
                const nextInput = document.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement;
                if (nextInput) {
                    nextInput.focus();
                    (nextInput as HTMLInputElement).select();
                    highlightCell(nextIndex);
                } else {
                    focusNextInput(index, type);
                }
            }, 10);
        }
    } else {
        // Parse edilemedi (bu durumda beforeinput'da engellenmiş olmalı, ama yine de kontrol)
        // Değeri temizle
        target.value = '';
        stateManager.setByte(index, 0);
        updateAllViews(true);
    }
};

// Ortak input navigation fonksiyonu
const navigateToInput = (index: number, direction: 'next' | 'prev' = 'next'): void => {
    const data = stateManager.getData();
    const newIndex = direction === 'next' 
        ? (index + 1) % data.length 
        : (index - 1 + data.length) % data.length;
    
    const activeTab = getActiveTab();
    if (activeTab) {
        const targetInput = activeTab.querySelector(`[data-index="${newIndex}"]`) as HTMLElement;
        if (targetInput) {
            targetInput.focus();
            (targetInput as HTMLInputElement).select();
            highlightCell(newIndex);
            targetInput.dispatchEvent(new Event('focus', { bubbles: true }));
        }
    }
};

// Bir sonraki input'a odaklan
const focusNextInput = (currentIndex: number, type: string): void => {
    navigateToInput(currentIndex, 'next');
};

// Paste event handler
const handlePaste = (event: ClipboardEvent): void => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    
    if (stateManager.getAllSelected()) {
        if (onSelectAllCallback) {
            onSelectAllCallback();
        }
        pasteToAllSelected(pastedText);
        return;
    }
    
    const target = event.target as HTMLElement;
    const startIndex = parseInt(target.dataset.index || '0', 10);
    const type = target.dataset.type || '';
    const valuesToParse = parseTextToBytes(pastedText, type as any);
    const data = stateManager.getData();

    for (let i = 0; i < valuesToParse.length; i++) {
        const globalIndex = startIndex + i;
        if (globalIndex >= data.length) {
            // Array'i genişlet
            const newSize = Math.max(data.length * 2, globalIndex + 1);
            stateManager.expandDataArray(newSize);
        }

        stateManager.setByte(globalIndex, valuesToParse[i]);
    }
    
    // Veri eklendi, grid'leri yeniden oluştur
    recreateAllGrids();
    updateAllViews();
};

// Input seviyesinde navigasyon ve hücre işlemleri
const handleKeydown = (event: KeyboardEvent): void => {
    // Global işlemleri document seviyesine bırak
    if (event.shiftKey && !event.ctrlKey && !event.metaKey && 
        ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(event.code)) {
        return; // Document seviyesindeki event listener'a bırak
    }

    // Ctrl+A (veya Cmd+A) - Tümünü seç (global işlem, document seviyesine bırak)
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        return; // Document seviyesindeki event listener'a bırak
    }

    // Delete tuşu - Tüm seçili ise temizle (global işlem, document seviyesine bırak)
    if ((event.key === 'Delete' || event.key === 'Backspace') && stateManager.getAllSelected()) {
        return; // Document seviyesindeki event listener'a bırak
    }

    // Cmd+Enter - CR (Carriage Return) karakteri ekle
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const index = parseInt(target.dataset.index || '0', 10);
        stateManager.setByte(index, 13); // CR character
        updateAllViews();
        // Move to next input
        setTimeout(() => {
            focusNextInput(index, target.dataset.type || '');
        }, 10);
        return;
    }

    // Cmd+Shift+Enter - LF (Line Feed) karakteri ekle
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const index = parseInt(target.dataset.index || '0', 10);
        stateManager.setByte(index, 10); // LF character
        updateAllViews();
        // Move to next input
        setTimeout(() => {
            focusNextInput(index, target.dataset.type || '');
        }, 10);
        return;
    }

    // Normal navigasyon (sadece tüm seçili değilse)
    if (stateManager.getAllSelected()) {
        return;
    }

    const target = event.target as HTMLElement;
    const index = parseInt(target.dataset.index || '0', 10);

    // Backspace tuşu - Boş input'ta bir önceki input'a git
    if (event.key === 'Backspace' && (target as HTMLInputElement).value === '') {
        event.preventDefault();
        navigateToInput(index, 'prev');
        return;
    }

    switch (event.key) {
        case 'Enter':
            // Enter tuşu - sonraki input'a geç
            event.preventDefault();
            focusNextInput(index, target.dataset.type || '');
            return;
        default:
            return;
    }
};

// Tüm input alanlarını tüm view'larda güncelleme
const updateAllViews = (excludeActiveInput: boolean = false): void => {
    const allInputs = document.querySelectorAll('.input-cell');
    const activeInput = document.activeElement;
    const data = stateManager.getData();
    const touchedIndices = stateManager.getTouchedIndices();
    
    allInputs.forEach(input => {
        const inputEl = input as HTMLInputElement;
        const index = parseInt(inputEl.dataset.index || '0', 10);
        const type = inputEl.dataset.type || '';
        const value = data[index];
        
        // Aktif input'u hariç tut
        if (excludeActiveInput && input === activeInput) {
            return;
        }
        
        // CR/LF highlight sınıflarını kaldır
        inputEl.classList.remove('cr-character', 'lf-character', 'crlf-character');
        
        // Değer yoksa (undefined/null) boş bırak
        if (value === undefined || value === null) {
            inputEl.value = '';
            return;
        }
        // Başlangıçtaki doldurulmamış 0 değerlerini gizle; kullanıcı 0 yazdıysa göster
        if (value === 0 && !touchedIndices.has(index)) {
            inputEl.value = '';
            return;
        }
        
        // Değeri format et
        if (typeof value === 'number') {
            // ASCII için: UTF-8 çoklu byte karakterleri için tüm byte'ları kontrol et
            if (type === 'ascii') {
                // Bu byte'ın geçerli bir UTF-8 sequence'in başlangıcı olup olmadığını kontrol et
                const byte = value;
                let bytesToDecode: number[] = [byte];
                
                // UTF-8 sequence başlangıcı kontrolü
                if ((byte & 0xE0) === 0xC0 && index + 1 < data.length) {
                    // 2 byte sequence
                    bytesToDecode = [byte, data[index + 1] || 0];
                } else if ((byte & 0xF0) === 0xE0 && index + 2 < data.length) {
                    // 3 byte sequence
                    bytesToDecode = [byte, data[index + 1] || 0, data[index + 2] || 0];
                } else if ((byte & 0xF8) === 0xF0 && index + 3 < data.length) {
                    // 4 byte sequence
                    bytesToDecode = [byte, data[index + 1] || 0, data[index + 2] || 0, data[index + 3] || 0];
                }
                
                // Decode etmeyi dene
                const decoded = formatBytesToText(bytesToDecode, 'ascii', '');
                
                // Eğer decode başarılıysa (geçerli bir karakter döndüyse) göster
                // Aksi halde sadece bu byte'ı göster
                if (decoded.length > 0 && bytesToDecode.length > 1) {
                    // Çoklu byte karakter - sadece ilk byte'ın olduğu hücrede göster
                    // Diğer byte'ların olduğu hücrelerde boş bırak (onlar zaten başka bir input'ta gösterilecek)
                    const isContinuationByte = (byte & 0xC0) === 0x80;
                    if (isContinuationByte) {
                        // Bu bir devam byte'ı, boş bırak
                        inputEl.value = '';
                    } else {
                        // Bu sequence'in başlangıcı, karakteri göster
                        inputEl.value = decoded;
                    }
                } else {
                    // Tek byte veya geçersiz sequence, normal göster
                    inputEl.value = formatBytesToText([byte], 'ascii', '');
                }
            } else {
                // Diğer formatlar için normal işlem
                let keyValue = formatBytesToText([value], type as any, '');
                inputEl.value = (type === 'hex') ? keyValue.toUpperCase() : keyValue;
            }
            
            // CR ve LF karakterleri için highlight ekle
            if (value === 13) {
                inputEl.classList.add('cr-character');
            } else if (value === 10) {
                inputEl.classList.add('lf-character');
            }
        } else {
            inputEl.value = '';
        }
    });
    
    // İlk input'a focus
    const activeIndex = stateManager.getActiveIndex();
    if (activeIndex === -1 && allInputs.length > 0) {
        const activeTab = getActiveTab();
        if (activeTab) {
            const firstInput = activeTab.querySelector('.input-cell') as HTMLElement;
            if (firstInput && document.activeElement !== firstInput) {
                setTimeout(() => {
                    firstInput.focus();
                    (firstInput as HTMLInputElement).select();
                    highlightCell(0);
                }, 10);
            }
        }
    }
    
    // Pozisyon göstergesini güncelle
    updatePositionIndicator();
};

// Pozisyon göstergesini güncelle
const updatePositionIndicator = (): void => {
    const totalBytes = stateManager.getDataSize();
    const activeIndex = stateManager.getActiveIndex();
    const currentPosition = activeIndex >= 0 ? activeIndex + 1 : 0;
    
    const indicators = [
        document.getElementById('hex-position-indicator'),
        document.getElementById('ascii-position-indicator'),
        document.getElementById('decimal-position-indicator'),
        document.getElementById('binary-position-indicator')
    ];
    
    indicators.forEach(indicator => {
        if (indicator) {
            indicator.textContent = `${currentPosition} / ${totalBytes}`;
        }
    });
    
    if (onPositionUpdateCallback) {
        onPositionUpdateCallback();
    }
};

// Hücreyi index'e göre tüm tab'larda vurgulama
const highlightCell = (index: number): void => {
    const previousIndex = stateManager.getActiveIndex();
    if (previousIndex !== -1) {
        document.querySelectorAll(`[data-index="${previousIndex}"]`).forEach(el => {
            el.classList.remove('highlight');
        });
    }
    
    stateManager.setActiveIndex(index);
    document.querySelectorAll(`[data-index="${index}"]`).forEach(el => {
        el.classList.add('highlight');
    });
    
    // Pozisyon göstergesini güncelle
    updatePositionIndicator();
};

// Tüm hücreleri temizleme
const clearAllCells = (): void => {
    stateManager.clearAllData();
    
    // Grid'leri yeniden oluştur
    recreateAllGrids();
    
    // Remove highlight from active cell
    const activeIndex = stateManager.getActiveIndex();
    if (activeIndex !== -1) {
        document.querySelectorAll(`[data-index="${activeIndex}"]`).forEach(el => {
            el.classList.remove('highlight');
        });
    }
    
    // Clear all selection
    if (onClearSelectionCallback) {
        onClearSelectionCallback();
    }
    
    // Tüm inputları mecburen sıfırla ve boş yap
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        (input as HTMLInputElement).value = '';
    });
    
    // Update all views
    updateAllViews();
    
    // Pozisyon göstergesini güncelle
    updatePositionIndicator();
    
    // Focus on first input after clearing
    setTimeout(() => {
        const activeTab = getActiveTab();
        if (activeTab) {
            const firstInput = activeTab.querySelector('.input-cell') as HTMLElement;
            if (firstInput) {
                // Force focus and selection
                firstInput.focus();
                (firstInput as HTMLInputElement).select();
                highlightCell(0);
                // Trigger focus event to ensure proper state
                firstInput.dispatchEvent(new Event('focus', { bubbles: true }));
            }
        }
    }, 100);
};

// Tüm hücreleri seçme
const selectAllCells = (): void => {
    // 4in1 modunda mıyız kontrol et
    const activeTab = getActiveTab();
    if (activeTab && activeTab.id === 'four-in-one-tab') {
        // 4in1 modunda aktif textarea'yı bul ve seç
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.tagName === 'TEXTAREA' && activeTab.contains(activeTextarea)) {
            // Aktif textarea'yı seç
            (activeTextarea as HTMLTextAreaElement).select();
        } else {
            // Eğer hiçbir textarea aktif değilse, ilk textarea'yı seç
            const firstTextarea = activeTab.querySelector('textarea') as HTMLTextAreaElement;
            if (firstTextarea) {
                firstTextarea.focus();
                firstTextarea.select();
            }
        }
        return;
    }
    
    // Normal grid modlarında
    stateManager.setAllSelected(true);
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        input.classList.add('all-selected');
    });
};

// Tüm seçimi temizleme
const clearAllSelection = (): void => {
    // 4in1 modunda mıyız kontrol et
    const activeTab = getActiveTab();
    if (activeTab && activeTab.id === 'four-in-one-tab') {
        // 4in1 modunda aktif textarea'nın seçimini temizle
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.tagName === 'TEXTAREA' && activeTab.contains(activeTextarea)) {
            // Cursor'u textarea'nın sonuna taşı
            const length = (activeTextarea as HTMLTextAreaElement).value.length;
            (activeTextarea as HTMLTextAreaElement).setSelectionRange(length, length);
        }
        return;
    }
    
    // Normal grid modlarında
    stateManager.setAllSelected(false);
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        input.classList.remove('all-selected');
    });
};

// Tüm seçili hücrelere paste yapma
const pasteToAllSelected = (pastedText: string): void => {
    const type = getActiveType() || '';
    const valuesToParse = parseTextToBytes(pastedText, type as any);
    const data = stateManager.getData();

    // Tüm hücreleri temizle
    stateManager.clearAllData();
    
    // Paste edilen değerleri ekle
    for (let i = 0; i < valuesToParse.length; i++) {
        if (i >= data.length) {
            // Array'i genişlet
            const newSize = Math.max(data.length * 2, i + 1);
            stateManager.expandDataArray(newSize);
        }
        stateManager.setByte(i, valuesToParse[i]);
    }
    
    // Veri eklendi, grid'leri yeniden oluştur
    recreateAllGrids();
    updateAllViews();
    
    if (onClearSelectionCallback) {
        onClearSelectionCallback();
    }
};

// Initialize grids
const initializeGrids = (
    hexGridEl: HTMLElement | null,
    asciiGridEl: HTMLElement | null,
    decimalGridEl: HTMLElement | null,
    binaryGridEl: HTMLElement | null
): void => {
    hexGrid = hexGridEl;
    asciiGrid = asciiGridEl;
    decimalGrid = decimalGridEl;
    binaryGrid = binaryGridEl;
    
    if (hexGrid && asciiGrid && decimalGrid && binaryGrid) {
        createGrid(hexGrid, 'hex-cell', 'hex');
        createGrid(asciiGrid, 'ascii-cell', 'ascii');
        createGrid(decimalGrid, 'decimal-cell', 'decimal');
        createGrid(binaryGrid, 'binary-cell', 'binary');
        
        updatePositionIndicator();
    }
};

// Callback setters
const setOnRecreateGrids = (callback: () => void): void => {
    onRecreateGridsCallback = callback;
};

const setOnUpdateViews = (callback: () => void): void => {
    onUpdateViewsCallback = callback;
};

const setOnPositionUpdate = (callback: () => void): void => {
    onPositionUpdateCallback = callback;
};

const setOnClearSelection = (callback: () => void): void => {
    onClearSelectionCallback = callback;
};

const setOnSelectAll = (callback: () => void): void => {
    onSelectAllCallback = callback;
};

// Export
export {
    initializeGrids,
    createGrid,
    recreateAllGrids,
    highlightCell,
    updateAllViews,
    updatePositionIndicator,
    clearAllCells,
    selectAllCells,
    clearAllSelection,
    pasteToAllSelected,
    navigateToInput,
    focusNextInput,
    getActiveTab,
    getActiveType,
    getActiveInput,
    setOnRecreateGrids,
    setOnUpdateViews,
    setOnPositionUpdate,
    setOnClearSelection,
    setOnSelectAll
};

