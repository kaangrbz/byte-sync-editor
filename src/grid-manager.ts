/**
 * ByteSync Editor - Grid Manager
 * Grid oluşturma, yönetimi ve input event handling
 */

import stateManager from './state-manager.js';
import { parseTextToBytes, formatBytesToText } from './utils.js';
import type { GridFormat } from './types/index.js';
import { getSettings } from './settings.js';

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
    return getActiveTab()?.querySelector(`[data-index="${index}"]`) ?? null;
};

// Tamamlanmış değer kontrolü (referans: decimal 3 rakam ve 0-255)
const isCompleteValue = (value: string, type: string): boolean => {
    const patterns: Record<string, RegExp> = {
        hex: /^[0-9a-fA-F]{2}$/,
        decimal: /^\d{3}$/,
        binary: /^[01]{8}$/,
        ascii: /^.{1}$/  // Boşluk karakteri de dahil olmak üzere herhangi bir karakter
    };
    if (!patterns[type]?.test(value)) return false;
    if (type === 'decimal') {
        const num = parseInt(value, 10);
        return !isNaN(num) && num >= 0 && num <= 255;
    }
    return true;
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
        input.setAttribute('aria-label', `Byte ${i}, ${type}`);

        // Inputları boş başlat
        input.value = '';

        // Add event listeners
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur', handleBlur);
        input.addEventListener('beforeinput', handleBeforeInput);
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeydown);
        input.addEventListener('paste', handlePaste);

        grid.appendChild(input);
    }
};

// Byte grid sekmeleri: sadece bu sekmelerde hücre üretilir
const BYTE_GRID_TABS = ['hex', 'ascii', 'decimal', 'binary'] as const;
const GRID_CONFIG: Record<string, { className: string; type: string }> = {
    hex: { className: 'hex-cell', type: 'hex' },
    ascii: { className: 'ascii-cell', type: 'ascii' },
    decimal: { className: 'decimal-cell', type: 'decimal' },
    binary: { className: 'binary-cell', type: 'binary' }
};

// Aktif sekme byte grid sekmesiyse adını döndür (hex, ascii, decimal, binary), değilse null
const getActiveByteGridTabName = (): string | null => {
    const activeTab = getActiveTab();
    const id = activeTab?.id ?? '';
    const name = id.replace(/-tab$/, '');
    return BYTE_GRID_TABS.includes(name as any) ? name : null;
};

// Tüm grid konteynerlerini boşalt (sadece birinde hücre kalacak)
const clearAllGridContainers = (): void => {
    if (hexGrid) hexGrid.innerHTML = '';
    if (asciiGrid) asciiGrid.innerHTML = '';
    if (decimalGrid) decimalGrid.innerHTML = '';
    if (binaryGrid) binaryGrid.innerHTML = '';
};

// Sadece aktif tab için hücreleri oluştur
const recreateAllGrids = (): void => {
    if (!hexGrid || !asciiGrid || !decimalGrid || !binaryGrid) return;

    const activeName = getActiveByteGridTabName();
    clearAllGridContainers();

    if (activeName) {
        const config = GRID_CONFIG[activeName];
        const gridEl = activeName === 'hex' ? hexGrid : activeName === 'ascii' ? asciiGrid : activeName === 'decimal' ? decimalGrid : binaryGrid;
        if (gridEl) createGrid(gridEl, config.className, config.type);
    }

    const inputCount = stateManager.getInputCount();
    const activeIndex = stateManager.getActiveIndex();
    if (activeIndex !== -1 && activeIndex < inputCount) {
        setTimeout(() => {
            const activeInput = getActiveInput(activeIndex);
            if (activeInput) activeInput.focus();
        }, 100);
    }
    updatePositionIndicator();
    onRecreateGridsCallback?.();
};

// Hücre odaklanma ve vurgulama
const handleFocus = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    if (stateManager.getAllSelected()) {
        if (onClearSelectionCallback) {
            onClearSelectionCallback();
        }
    }
    
    const index = parseInt(target.dataset.index || '0', 10);
    highlightCell(index);

    if (getSettings().selectOnFocus && target instanceof HTMLInputElement) {
        target.select();
    }
};

// Focus kaybında parse et; hata varsa eski değere dön (referans: _on_editing_finished)
const handleBlur = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.dataset.index || '0', 10);
    const type = (target.dataset.type || 'hex') as GridFormat;
    const value = target.value.trim();

    if (value.length === 0) {
        stateManager.setByte(index, 0);
        updateAllViews(true);
        return;
    }

    const bytes = parseTextToBytes(value, type);
    if (bytes.length === 1) {
        stateManager.setByte(index, bytes[0]);
        updateAllViews(true);
        return;
    }

    // Parse boş veya hatalı: state'teki mevcut byte'a göre metni geri yükle
    const currentByte = stateManager.getByte(index);
    const restored = formatBytesToText([currentByte], type, '');
    target.value = type === 'hex' ? restored.toUpperCase() : restored;
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

    // Boş input - byte değerini 0 yap, grid boyutu küçülebilir
    if (value.length === 0) {
        stateManager.setByte(index, 0);
        recreateAllGrids();
        updateAllViews(true);
        return;
    }

    const inputCountBefore = stateManager.getInputCount();

    // Parse - beforeinput ile zaten validasyon yapıldı
    const bytes = parseTextToBytes(value, type);

    if (bytes.length > 0) {
        const settings = getSettings();
        const hasDataAfter = stateManager.getDataSize() > index + 1;

        // INSERT modu açıksa ve sonrasında veri varsa: ekle ve sonrakileri kaydır
        if (settings.insertMode && hasDataAfter) {
            if (type === 'ascii' && bytes.length > 1) {
                for (let i = 0; i < bytes.length; i++) {
                    stateManager.insertByteAt(index + i, bytes[i]);
                }
            } else {
                stateManager.insertByteAt(index, bytes[0]);
            }
            recreateAllGrids();
            updateAllViews(true);
            const stayIndex = type === 'ascii' && bytes.length > 1 ? index + bytes.length : index;
            stateManager.setActiveIndex(stayIndex);
            const stayInput = getActiveInput(stayIndex);
            if (stayInput) {
                stayInput.focus();
                highlightCell(stayIndex);
            }
            return;
        }

        // Üzerine yaz (INSERT kapalı veya sonrasında veri yok)
        if (type === 'ascii' && bytes.length > 1) {
            const data = stateManager.getData();
            for (let i = 0; i < bytes.length; i++) {
                const globalIndex = index + i;
                if (globalIndex >= data.length) {
                    const newSize = Math.max(data.length * 2, globalIndex + 1);
                    stateManager.expandDataArray(newSize);
                }
                stateManager.setByte(globalIndex, bytes[i]);
            }
        } else {
            stateManager.setByte(index, bytes[0]);
        }

        const inputCountAfter = stateManager.getInputCount();
        if (inputCountAfter !== inputCountBefore) {
            const nextIndex = type === 'ascii' && bytes.length > 1 ? index + bytes.length : index + 1;
            if (isCompleteValue(value, type)) {
                stateManager.setActiveIndex(nextIndex);
            }
            recreateAllGrids();
        }
        updateAllViews(true);

        // Otomatik sonraki hücreye geç sadece ayar açıksa (50 ms gecikme: referans QTimer.singleShot(50))
        if (getSettings().autoAdvance && isCompleteValue(value, type)) {
            const nextIndex = type === 'ascii' && bytes.length > 1 ? index + bytes.length : index + 1;
            setTimeout(() => {
                const nextInput = getActiveInput(nextIndex);
                if (nextInput) {
                    nextInput.focus();
                    highlightCell(nextIndex);
                } else {
                    focusNextInput(index, type);
                }
            }, 50);
        }
    } else {
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
            highlightCell(newIndex);
            targetInput.dispatchEvent(new Event('focus', { bubbles: true }));
        }
    }
};

// Bir sonraki input'a odaklan
const focusNextInput = (currentIndex: number, _type: string): void => {
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
    let valuesToParse = parseTextToBytes(pastedText, type as any);
    const data = stateManager.getData();

    // 256 byte sınırı (referans: parse + uyarı + kesim)
    if (valuesToParse.length > 256) {
        if (typeof window !== 'undefined' && window.NotificationHelper) {
            window.NotificationHelper.showWarning('En fazla 256 byte yapıştırılabilir; fazlası yok sayıldı.');
        }
        valuesToParse = valuesToParse.slice(0, 256);
    }

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
    const isEmpty = (target as HTMLInputElement).value === '';
    const isLastCell = index === stateManager.getInputCount() - 1;
    const isOnlyCell = stateManager.getDataSize() <= 1;

    // Delete tuşu - Boş hücrede: hücreyi kaldır, sola kaydır, focus önceki (referans: delete_empty_requested)
    if (event.key === 'Delete' && isEmpty) {
        event.preventDefault();
        if (!isOnlyCell && !isLastCell) {
            stateManager.removeByteAt(index);
            recreateAllGrids();
            updateAllViews(true);
            const prevIndex = index - 1;
            setTimeout(() => {
                const prevInput = getActiveInput(prevIndex);
                if (prevInput) {
                    prevInput.focus();
                    highlightCell(prevIndex);
                }
            }, 10);
        } else {
            navigateToInput(index, 'prev');
        }
        return;
    }

    // Backspace tuşu - Boş hücrede: aynı (hücre sil, sola kaydır, focus önceki); doluysa varsayılan karakter silme
    if (event.key === 'Backspace' && isEmpty) {
        event.preventDefault();
        if (!isOnlyCell && !isLastCell) {
            stateManager.removeByteAt(index);
            recreateAllGrids();
            updateAllViews(true);
            const prevIndex = index - 1;
            setTimeout(() => {
                const prevInput = getActiveInput(prevIndex);
                if (prevInput) {
                    prevInput.focus();
                    highlightCell(prevIndex);
                }
            }, 10);
        } else {
            navigateToInput(index, 'prev');
        }
        return;
    }

    // Space - ASCII modunda boşluk karakteri (0x20) yazılır; diğer modlarda boş byte ekleme
    if (event.key === ' ') {
        const type = (target as HTMLElement).dataset.type;
        if (type === 'ascii') {
            // ASCII: Space'i normal karakter olarak bırak (input event 0x20 yazar)
            return;
        }
        const inputEl = target as HTMLInputElement;
        const hasSelection = inputEl.selectionStart !== inputEl.selectionEnd;
        if (!hasSelection) {
            event.preventDefault();
            stateManager.insertByteAt(index, 0);
            recreateAllGrids();
            updateAllViews(true);
            setTimeout(() => {
                const activeTab = getActiveTab();
                const sameInput = activeTab?.querySelector(`[data-index="${index}"]`) as HTMLInputElement | null;
                if (sameInput) {
                    sameInput.focus();
                    highlightCell(index);
                }
            }, 10);
            return;
        }
    }

    // Ok tuşları: sol/sağ önceki/sonraki, yukarı/aşağı ilk/son hücre
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateToInput(index, 'prev');
        return;
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        const inputCountForRight = stateManager.getInputCount();
        if (index === inputCountForRight - 1) {
            stateManager.insertByteAt(stateManager.getDataSize(), 0);
            recreateAllGrids();
            updateAllViews(true);
            const newIdx = stateManager.getInputCount() - 1;
            setTimeout(() => {
                const nextInput = getActiveInput(newIdx);
                if (nextInput) {
                    nextInput.focus();
                    highlightCell(newIdx);
                }
            }, 10);
        } else {
            navigateToInput(index, 'next');
        }
        return;
    }
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        const firstInput = getActiveTab()?.querySelector('[data-index="0"]') as HTMLElement;
        if (firstInput) {
            firstInput.focus();
            highlightCell(0);
        }
        return;
    }
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        const lastIndex = stateManager.getInputCount() - 1;
        const lastInput = getActiveInput(lastIndex);
        if (lastInput) {
            lastInput.focus();
            highlightCell(lastIndex);
        }
        return;
    }

    switch (event.key) {
        case 'Enter':
            // Enter tuşu - sonraki input'a geç; son hücredeyse yeni boş hücre ekle (referans: move_to_next_box)
            event.preventDefault();
            const inputCount = stateManager.getInputCount();
            if (index === inputCount - 1) {
                stateManager.insertByteAt(stateManager.getDataSize(), 0);
                recreateAllGrids();
                updateAllViews(true);
                const newIndex = stateManager.getInputCount() - 1;
                setTimeout(() => {
                    const nextInput = getActiveInput(newIndex);
                    if (nextInput) {
                        nextInput.focus();
                        highlightCell(newIndex);
                    }
                }, 10);
            } else {
                focusNextInput(index, target.dataset.type || '');
            }
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
    onUpdateViewsCallback?.();
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

/** Belirtilen byte index'ine odaklanır, scroll eder ve vurgular (Index'e git). */
const jumpToIndex = (index: number): void => {
    const count = stateManager.getInputCount();
    const clamped = Math.max(0, Math.min(index, count - 1));
    highlightCell(clamped);
    const el = getActiveInput(clamped);
    if (el) {
        el.focus();
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
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
                firstInput.focus();
                highlightCell(0);
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
    let valuesToParse = parseTextToBytes(pastedText, type as any);
    const data = stateManager.getData();

    // 256 byte sınırı (referans: uyarı + kesim)
    if (valuesToParse.length > 256) {
        if (typeof window !== 'undefined' && window.NotificationHelper) {
            window.NotificationHelper.showWarning('En fazla 256 byte yapıştırılabilir; fazlası yok sayıldı.');
        }
        valuesToParse = valuesToParse.slice(0, 256);
    }

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
        clearAllGridContainers();
        const activeName = getActiveByteGridTabName();
        if (activeName) {
            const config = GRID_CONFIG[activeName];
            const gridEl = activeName === 'hex' ? hexGrid : activeName === 'ascii' ? asciiGrid : activeName === 'decimal' ? decimalGrid : binaryGrid;
            if (gridEl) createGrid(gridEl, config.className, config.type);
        }
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
    jumpToIndex,
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

