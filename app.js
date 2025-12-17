/**
 * ByteSync Editor - Main JavaScript File
 * All application logic and event handlers
 */

// App Configuration - will be loaded dynamically from manifest.json
let APP_CONFIG = {
    version: '1.42.3', // fallback version
    name: 'ByteSync Editor'
};

// Function to load app config from manifest.json
async function loadAppConfig() {
    try {
        const response = await fetch('./manifest.json');
        const manifest = await response.json();
        
        APP_CONFIG = {
            version: manifest.version || '1.41.4',
            name: manifest.name || 'ByteSync Editor'
        };
        
        console.log('App config loaded:', APP_CONFIG);
        return APP_CONFIG;
    } catch (error) {
        console.warn('Could not load manifest.json, using fallback config:', error);
        return APP_CONFIG;
    }
}

// Import utility functions
import { 
    getMaxLengthForType, 
    parseTextToBytes,
    formatBytesToText,
    getDelimiter,
    getInvisibleAsciiDisplay
} from './src/utils.js';

// DOM elementleri - window.onload içinde tanımlanacak
let tabButtons, tabContents, hexGrid, asciiGrid, decimalGrid, binaryGrid, copyButtons, clearButtons;

// Veri ve durum değişkenleri
let data = new Uint8Array(256);
let activeIndex = -1;
let allSelected = false;
// Kullanıcı tarafından değeri belirlenmiş hücreleri izlemek için
const touchedIndices = new Set();

// Dinamik genişletme fonksiyonu
const expandDataArray = (newSize) => {
    const oldData = data;
    data = new Uint8Array(newSize);
    
    // Eski verileri kopyala
    for (let i = 0; i < Math.min(oldData.length, newSize); i++) {
        data[i] = oldData[i];
    }
    
    // Yeni alanları 0 ile doldur
    for (let i = oldData.length; i < newSize; i++) {
        data[i] = 0;
    }
    
    console.log(`Data array genişletildi: ${oldData.length} → ${newSize} bytes`);
    
    // Kullanıcıya bildirim göster
    showExpansionNotification(oldData.length, newSize);
};

// Otomatik genişletme kontrolü
const checkAndExpandIfNeeded = () => {
    // Son 10 byte'ı kontrol et
    const lastBytes = data.slice(-10);
    const hasData = lastBytes.some(byte => byte !== 0);
    
    if (hasData && data.length < 1024) { // Maksimum 1024 byte
        const newSize = data.length * 2;
        expandDataArray(newSize);
        return true;
    }
    return false;
};

// Tüm grid'leri yeniden oluştur
const recreateAllGrids = () => {
    if (hexGrid && asciiGrid && decimalGrid && binaryGrid) {
        createGrid(hexGrid, 'hex-cell', 'hex');
        createGrid(asciiGrid, 'ascii-cell', 'ascii');
        createGrid(decimalGrid, 'decimal-cell', 'decimal');
        createGrid(binaryGrid, 'binary-cell', 'binary');
        
        // Aktif index'i koru
        if (activeIndex !== -1 && activeIndex < data.length) {
            setTimeout(() => {
                const activeInput = document.querySelector(`[data-index="${activeIndex}"]`);
                if (activeInput) {
                    activeInput.focus();
                    activeInput.select();
                }
            }, 100);
        }
    }
};

// Genişletme bildirimi göster (eski fonksiyon - yeni helper kullanıyor)
const showExpansionNotification = (oldSize, newSize) => {
    NotificationHelper.showExpansion(oldSize, newSize);
};

// Geliştirici modunu tespit et
const isDeveloperMode = () => {
    // Electron API'si mevcutsa kullan
    if (window.electronAPI && window.electronAPI.isDeveloperMode) {
        return window.electronAPI.isDeveloperMode();
    }
    
    // Web ortamında çalışıyorsa
    // Localhost veya 127.0.0.1 üzerinde çalışıyor mu?
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname === '0.0.0.0';
    
    // URL'de dev parametresi var mı?
    const hasDevParam = window.location.search.includes('dev=true');
    
    // localStorage'da dev mode aktif mi?
    const hasDevMode = localStorage.getItem('bytesync-dev-mode') === 'true';
    
    return isLocalhost || hasDevParam || hasDevMode;
};

// Grid oluşturma fonksiyonu
const createGrid = (grid, className, type) => {
    if (!grid) {
        alert(`Grid bulunamadı: ${type}`);
        return;
    }
    grid.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = `input-cell ${className}`;
        input.dataset.index = i;
        input.dataset.type = type;
        
        // Set the initial value and class
        const value = data[i];
        // Inputları boş başlat
        input.value = '';
        
        // Varsayılan değerler için CSS sınıfı ekleme
        
        // Add event listeners for selection, input, and paste
        input.addEventListener('focus', handleFocus);
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeydown);
        input.addEventListener('paste', handlePaste);

        grid.appendChild(input);
    }
};

// Hücre odaklanma ve vurgulama
const handleFocus = (event) => {
    // Eğer tüm seçili ise, tek hücreye odaklanıldığında seçimi temizle
    if (allSelected) {
        clearAllSelection();
    }
    
    const index = parseInt(event.target.dataset.index, 10);
    highlightCell(index);
};

// Input işleme ve tüm view'ları güncelleme
const handleInput = (event) => {
    const index = parseInt(event.target.dataset.index, 10);
    const type = event.target.dataset.type;
    const value = event.target.value;

    // Boş input - değeri değiştirme
    if (value.length === 0) return;

    // Parse ve kaydet
    const bytes = parseTextToBytes(value, type);
    console.log("🚀 ~ handleInput :",value, bytes, index, type)
    if (bytes.length > 0) {
        data[index] = bytes[0];
        touchedIndices.add(index);
        
        // Otomatik genişletme kontrolü
        const wasExpanded = checkAndExpandIfNeeded();
        if (wasExpanded) {
            // Grid'leri yeniden oluştur
            recreateAllGrids();
        }
        
        updateAllViews(true);
        
        // Auto-navigation (basitleştirilmiş)
        if (isCompleteValue(value, type)) {
            setTimeout(() => {
              focusNextInput(index, type);
            }, 10);
        }
    } else if (bytes.length === 0 && value.length > 0) {
      console.log('bytes.length === 0', value, type);
      event.target.value = '';
    }
};

// Yardımcı fonksiyon: Tamamlanmış değer kontrolü
const isCompleteValue = (value, type) => {
    const patterns = {
        hex: /^[0-9a-fA-F]{2}$/,
        decimal: /^\d{3}$/,
        binary: /^[01]{8}$/,
        ascii: /^.{1}$/  // Boşluk karakteri de dahil olmak üzere herhangi bir karakter
    };
    return patterns[type]?.test(value) || false;
};



// Utility helper fonksiyonları
const getActiveTab = () => document.querySelector('.tab-content.active');
const getActiveType = () => getActiveTab()?.querySelector('.input-cell')?.dataset.type;
const getActiveInput = (index) => document.querySelector(`[data-index="${index}"]`);
const getDelimiterSettings = () => {
    const option = document.querySelector('input[name="delimiter-option"]:checked')?.value || 'comma';
    const custom = document.getElementById('custom-delimiter')?.value || '';
    return getDelimiter(option, custom);
};


// Ortak input navigation fonksiyonu
const navigateToInput = (index, direction = 'next') => {
    const newIndex = direction === 'next' 
        ? (index + 1) % data.length 
        : (index - 1 + data.length) % data.length;
    
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const targetInput = activeTab.querySelector(`[data-index="${newIndex}"]`);
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
            highlightCell(newIndex);
            targetInput.dispatchEvent(new Event('focus', { bubbles: true }));
        }
    }
};

// Bir sonraki input'a odaklan
const focusNextInput = (currentIndex, type) => {
    navigateToInput(currentIndex, 'next');
};







// Paste event handler
const handlePaste = (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text/plain');
    
    if (allSelected) {
        pasteToAllSelected(pastedText);
        return;
    }
    
    const startIndex = parseInt(event.target.dataset.index, 10);
    const type = event.target.dataset.type;
    const valuesToParse = parseTextToBytes(pastedText, type);

    for (let i = 0; i < valuesToParse.length; i++) {
        const globalIndex = startIndex + i;
        if (globalIndex >= data.length) {
            // Array'i genişlet
            const newSize = Math.max(data.length * 2, globalIndex + 1);
            expandDataArray(newSize);
            recreateAllGrids();
        }

        data[globalIndex] = valuesToParse[i];
        touchedIndices.add(globalIndex);
    }

    updateAllViews();
};

// Input seviyesinde sadece navigasyon ve hücre işlemleri
const handleKeydown = (event) => {
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
    if ((event.key === 'Delete' || event.key === 'Backspace') && allSelected) {
        return; // Document seviyesindeki event listener'a bırak
    }

    // Cmd+Enter - CR (Carriage Return) karakteri ekle
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const index = parseInt(event.target.dataset.index, 10);
        data[index] = 13; // CR character
        updateAllViews();
        // Move to next input
        setTimeout(() => {
            focusNextInput(index, event.target.dataset.type);
        }, 10);
        return;
    }


    // Cmd+Shift+Enter - LF (Line Feed) karakteri ekle
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        const index = parseInt(event.target.dataset.index, 10);
        data[index] = 10; // LF character
        updateAllViews();
        // Move to next input
        setTimeout(() => {
            focusNextInput(index, event.target.dataset.type);
        }, 10);
        return;
    }

    // Normal navigasyon (sadece tüm seçili değilse)
    if (allSelected) {
        return;
    }

    const index = parseInt(event.target.dataset.index, 10);
    let newIndex = index;

    // Backspace tuşu - Boş input'ta bir önceki input'a git
    if (event.key === 'Backspace' && event.target.value === '') {
        event.preventDefault();
        navigateToInput(index, 'prev');
        return;
    }

    switch (event.key) {
        case 'Enter':
            // Enter tuşu - sonraki input'a geç
            event.preventDefault();
            focusNextInput(index, event.target.dataset.type);
            return;
        default:
            return;
    }
};


// Tüm input alanlarını tüm view'larda güncelleme
const updateAllViews = (excludeActiveInput = false) => {
    const allInputs = document.querySelectorAll('.input-cell');
    const activeInput = document.activeElement;
    
    allInputs.forEach(input => {
        const index = parseInt(input.dataset.index, 10);
        const type = input.dataset.type;
        const value = data[index];
        
        // Aktif input'u hariç tut
        if (excludeActiveInput && input === activeInput) {
            return;
        }
        
        // CR/LF highlight sınıflarını kaldır
        input.classList.remove('cr-character', 'lf-character', 'crlf-character');
        
        // Değer yoksa (undefined/null/boş string) boş bırak
        if (value === undefined || value === null || value === '') {
            input.value = '';
            return;
        }
        // Başlangıçtaki doldurulmamış 0 değerlerini gizle; kullanıcı 0 yazdıysa göster
        if (value === 0 && !touchedIndices.has(index)) {
            input.value = '';
            return;
        }
        
        // Değeri format et
        if (typeof value === 'number') {
            let keyValue = formatBytesToText([value], type, '');
            input.value = type == 'hex' ? keyValue.toUpperCase() : keyValue
            
            // CR ve LF karakterleri için highlight ekle
            if (value === 13) {
                input.classList.add('cr-character');
            } else if (value === 10) {
                input.classList.add('lf-character');
            }
        } else {
            input.value = '';
        }
    });
    
    // İlk input'a focus
    if (activeIndex === -1 && allInputs.length > 0) {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const firstInput = activeTab.querySelector('.input-cell');
            if (firstInput && document.activeElement !== firstInput) {
                setTimeout(() => {
                    firstInput.focus();
                    firstInput.select();
                    highlightCell(0);
                }, 10);
            }
        }
    }
};


// 4 in 1 Mode Functions
let fourInOneData = new Uint8Array(0);
let isUpdatingFourInOne = false;

const updateFourInOneMode = () => {
    if (isUpdatingFourInOne) return;
    
    isUpdatingFourInOne = true;
    
    // Get current delimiter setting
    const delimiter = getDelimiterSettings();
    
    // Update all textareas
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        const textarea = document.getElementById(`four-in-one-${format}`);
        if (textarea) {
            textarea.value = formatBytesToText(fourInOneData, format, delimiter);
        }
    });
    
    isUpdatingFourInOne = false;
};

const handleFourInOneInput = (sourceFormat, text) => {
    if (isUpdatingFourInOne) return;
    
    isUpdatingFourInOne = true;
    
    // Get current delimiter setting
    const delimiter = getDelimiterSettings();
    
    // Parse the input text to bytes
    const parsedBytes = parseTextToBytes(text, sourceFormat);
    fourInOneData = new Uint8Array(parsedBytes);
    
    // Ana data array'ini de güncelle ve genişletme kontrolü yap
    if (parsedBytes.length > data.length) {
        const newSize = Math.max(data.length * 2, parsedBytes.length);
        expandDataArray(newSize);
        recreateAllGrids();
    }
    
    // Ana data'ya kopyala
    for (let i = 0; i < Math.min(parsedBytes.length, data.length); i++) {
        data[i] = parsedBytes[i];
    }
    
    // Update all other textareas
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        if (format !== sourceFormat) {
            const textarea = document.getElementById(`four-in-one-${format}`);
            if (textarea) {
                textarea.value = formatBytesToText(fourInOneData, format, delimiter);
            }
        }
    });
    
    isUpdatingFourInOne = false;
};

const clearFourInOneMode = () => {
    fourInOneData = new Uint8Array(0);
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    formats.forEach(format => {
        const textarea = document.getElementById(`four-in-one-${format}`);
        if (textarea) {
            textarea.value = '';
        }
    });
};

const copyAllFourInOneFormats = () => {
    const delimiter = getDelimiterSettings();
    
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    let allFormats = '';
    
    formats.forEach((format, index) => {
        const textarea = document.getElementById(`four-in-one-${format}`);
        if (textarea) {
            allFormats += `${format.toUpperCase()}:\n${textarea.value}\n\n`;
        }
    });
    
    navigator.clipboard.writeText(allFormats.trim()).then(() => {
        NotificationHelper.showSuccess('Tüm formatlar panoya kopyalandı!');
    }).catch(err => {
        NotificationHelper.showError('Kopyalama başarısız!');
        console.error('Failed to copy: ', err);
    });
};

// 4 in 1 mode individual copy buttons
const initializeFourInOneCopyButtons = () => {
    document.querySelectorAll('.four-in-one-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            const textarea = document.getElementById(`four-in-one-${format}`);
            if (textarea && textarea.value) {
                navigator.clipboard.writeText(textarea.value).then(() => {
                    NotificationHelper.showSuccess(`${format.toUpperCase()} formatı panoya kopyalandı!`);
                    // Visual feedback
                    const originalText = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    btn.style.backgroundColor = 'var(--theme-success)';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.backgroundColor = 'var(--theme-primary)';
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        });
    });
};

// Hücreyi index'e göre tüm tab'larda vurgulama
const highlightCell = (index) => {
    if (activeIndex !== -1) {
        document.querySelectorAll(`[data-index="${activeIndex}"]`).forEach(el => el.classList.remove('highlight'));
    }
    activeIndex = index;
    document.querySelectorAll(`[data-index="${activeIndex}"]`).forEach(el => el.classList.add('highlight'));
};

// Tüm hücreleri temizleme
const clearAllCells = () => {
    // Array'i 256 byte'a düşür
    if (data.length > 256) {
        data = new Uint8Array(256);
        // Grid'leri yeniden oluştur
        recreateAllGrids();
    } else {
        // Reset all data to zero
        data.fill(0);
    }
    
    // Remove highlight from active cell
    if (activeIndex !== -1) {
        document.querySelectorAll(`[data-index="${activeIndex}"]`).forEach(el => el.classList.remove('highlight'));
        activeIndex = -1;
    }
    // Clear all selection
    clearAllSelection();
    
    // Tüm inputları boş yap
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        input.value = '';
    });
    
    // Update all views
    updateAllViews();
    
    // Focus on first input after clearing
    setTimeout(() => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const firstInput = activeTab.querySelector('.input-cell');
            if (firstInput) {
                // Force focus and selection
                firstInput.focus();
                firstInput.select();
                highlightCell(0);
                // Trigger focus event to ensure proper state
                firstInput.dispatchEvent(new Event('focus', { bubbles: true }));
            }
        }
    }, 100);
};

// Tüm hücreleri seçme
const selectAllCells = () => {
    // 4in1 modunda mıyız kontrol et
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'four-in-one-tab') {
        // 4in1 modunda aktif textarea'yı bul ve seç
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.tagName === 'TEXTAREA' && activeTab.contains(activeTextarea)) {
            // Aktif textarea'yı seç
            activeTextarea.select();
        } else {
            // Eğer hiçbir textarea aktif değilse, ilk textarea'yı seç
            const firstTextarea = activeTab.querySelector('textarea');
            if (firstTextarea) {
                firstTextarea.focus();
                firstTextarea.select();
            }
        }
        return;
    }
    
    // Normal grid modlarında
    allSelected = true;
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        input.classList.add('all-selected');
    });
};

// Tüm seçimi temizleme
const clearAllSelection = () => {
    // 4in1 modunda mıyız kontrol et
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'four-in-one-tab') {
        // 4in1 modunda aktif textarea'nın seçimini temizle
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.tagName === 'TEXTAREA' && activeTab.contains(activeTextarea)) {
            // Cursor'u textarea'nın sonuna taşı
            const length = activeTextarea.value.length;
            activeTextarea.setSelectionRange(length, length);
        }
        return;
    }
    
    // Normal grid modlarında
    allSelected = false;
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        input.classList.remove('all-selected');
    });
};

// Tüm seçili hücrelere paste yapma
const pasteToAllSelected = (pastedText) => {
    const type = getActiveType();

    const valuesToParse = parseTextToBytes(pastedText, type);

    // Tüm hücreleri temizle
    data.fill(0);
    
    // Paste edilen değerleri ekle
    for (let i = 0; i < valuesToParse.length; i++) {
        if (i >= data.length) {
            // Array'i genişlet
            const newSize = Math.max(data.length * 2, i + 1);
            expandDataArray(newSize);
            recreateAllGrids();
        }
        data[i] = valuesToParse[i];
    }

    updateAllViews();
    clearAllSelection();
};

// DevTools açma fonksiyonu
const openDevTools = () => {
    console.log('DevTools açılıyor...');
    
    // Electron API'si mevcutsa kullan
    if (window.electronAPI && window.electronAPI.openDevTools) {
        window.electronAPI.openDevTools();
        return;
    }
    
    // Web ortamında DevTools açmak için F12 simülasyonu
    const event = new KeyboardEvent('keydown', {
        key: 'F12',
        code: 'F12',
        keyCode: 123,
        which: 123,
        bubbles: true
    });
    document.dispatchEvent(event);
};

// Context menu oluşturma
const createContextMenu = (x, y) => {
    // Mevcut context menu'yu kaldır
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block'; // Menüyü görünür yap

    // Menü öğeleri - daha organize
    const menuItems = [
        // Kopyalama/Yapıştırma grubu
        { text: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
        { text: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
        { text: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
        { separator: true },
        
        // Seçim grubu
        { text: 'Select All', action: 'selectAll', shortcut: 'Ctrl+A' },
        { text: 'Clear', action: 'clear', shortcut: 'Delete' },
        { separator: true },
        
        // Özel karakterler grubu
        { text: 'Add CR (\\r)', action: 'addCR', shortcut: 'Cmd+Enter' },
        { text: 'Add LF (\\n)', action: 'addLF', shortcut: 'Cmd+Shift+Enter' },
        { text: 'Reset (0)', action: 'reset', shortcut: 'Space' },
        { separator: true },
        
        // Sistem grubu
        { text: 'Refresh', action: 'refresh', shortcut: 'F5' }
    ];
    
    // DevTools seçeneği kaldırıldı

    menuItems.forEach(item => {
        if (item.separator) {
            const separator = document.createElement('div');
            separator.className = 'context-menu-separator';
            menu.appendChild(separator);
        } else {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `
                <span>${item.text}</span>
                <span style="margin-left: auto; font-size: 0.75rem; color: var(--theme-textSecondary);">${item.shortcut}</span>
            `;
            
            menuItem.addEventListener('click', () => {
                handleContextMenuAction(item.action);
                menu.remove();
            });
            
            menu.appendChild(menuItem);
        }
    });

    document.body.appendChild(menu);
    
    // Menü dışına tıklandığında kapat
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
};

// Context menu aksiyonları
const handleContextMenuAction = (action) => {
    switch (action) {
        case 'copy':
            if (allSelected) {
                // Tüm grid'i kopyala
        const type = getActiveType();
                // utils.js'deki standart formatBytesToText fonksiyonunu kullan
                const textToCopy = formatBytesToText(data, type, ' ');
                navigator.clipboard.writeText(textToCopy);
            } else if (activeIndex !== -1) {
                // Aktif hücreyi kopyala
                const activeInput = getActiveInput(activeIndex);
                if (activeInput) {
                    activeInput.select();
                    document.execCommand('copy');
                }
            }
            break;
        case 'paste':
            if (allSelected) {
                // Tüm grid'e paste yap
                navigator.clipboard.readText().then(text => {
                    pasteToAllSelected(text);
                });
            } else if (activeIndex !== -1) {
                // Aktif hücreye paste yap
                navigator.clipboard.readText().then(text => {
                    const activeInput = getActiveInput(activeIndex);
                    if (activeInput) {
                        const event = new ClipboardEvent('paste', {
                            clipboardData: new DataTransfer()
                        });
                        event.clipboardData.setData('text/plain', text);
                        handlePaste(event);
                    }
                });
            }
            break;
        case 'cut':
            if (allSelected) {
                // Tüm grid'i kes
        const type = getActiveType();
                // utils.js'deki standart formatBytesToText fonksiyonunu kullan
                const textToCopy = formatBytesToText(data, type, ' ');
                navigator.clipboard.writeText(textToCopy);
                clearAllCells();
            } else if (activeIndex !== -1) {
                // Aktif hücreyi kes
                const activeInput = getActiveInput(activeIndex);
                if (activeInput) {
                    activeInput.select();
                    document.execCommand('copy');
                    data[activeIndex] = 0;
                    updateAllViews();
                }
            }
            break;
        case 'selectAll':
            selectAllCells();
            break;
        case 'clear':
            if (allSelected) {
                clearAllCells();
            } else if (activeIndex !== -1) {
                data[activeIndex] = 0;
                updateAllViews();
                // Clear single cell - focus on current cell
                const currentInput = document.querySelector(`[data-index="${activeIndex}"]`);
                if (currentInput) {
                    currentInput.focus();
                    currentInput.select();
                }
            }
            break;
        case 'addCR':
            if (activeIndex !== -1) {
                data[activeIndex] = 13; // CR character
                updateAllViews();
                // Move to next input
                setTimeout(() => {
                    focusNextInput(activeIndex, document.querySelector(`[data-index="${activeIndex}"]`).dataset.type);
                }, 10);
            }
            break;
        case 'addLF':
            if (activeIndex !== -1) {
                data[activeIndex] = 10; // LF character
                updateAllViews();
                // Move to next input
                setTimeout(() => {
                    focusNextInput(activeIndex, document.querySelector(`[data-index="${activeIndex}"]`).dataset.type);
                }, 10);
            }
            break;
        case 'reset':
            if (activeIndex !== -1) {
                data[activeIndex] = 0; // Reset to 0
                updateAllViews();
                // Focus on current cell
                const currentInput = document.querySelector(`[data-index="${activeIndex}"]`);
                if (currentInput) {
                    currentInput.focus();
                    currentInput.select();
                }
            }
            break;
        case 'refresh':
            // Sayfayı yenile
            window.location.reload();
            break;
        // DevTools case kaldırıldı
    }
};

// Tab switching logic - window.onload içinde tanımlanacak

// Copy all data from a specific format - window.onload içinde tanımlanacak


// Clear all cells event listeners - window.onload içinde tanımlanacak

// Paste options event listeners - window.onload içinde tanımlanacak

// Dev butonu kaldırıldı


// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt triggered');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    showInstallPrompt();
});

const showInstallPrompt = () => {
    // Create install button
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.className = 'fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50';
    installButton.style.display = 'none';
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA install outcome:', outcome);
            deferredPrompt = null;
            installButton.remove();
        }
    });
    
    document.body.appendChild(installButton);
    
    // Show button after a delay
    setTimeout(() => {
        installButton.style.display = 'block';
    }, 3000);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.remove();
        }
    }, 10000);
};

// Handle URL mode parameters
const handleUrlMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode) {
        // Wait for DOM to be ready
        setTimeout(() => {
            const tabButton = document.querySelector(`[data-tab="${mode}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }, 100);
    }
};

// Populate ASCII/HEX/DECIMAL reference table
const populateAsciiTable = () => {
    const tableBody = document.getElementById('ascii-table-body');
    if (!tableBody) return;
    
    
    // Helper function to get ASCII display for invisible characters
    const getInvisibleAsciiDisplay = (value) => {
        // Kontrol karakterleri için özel isimler
        const controlCharNames = {
            0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
            8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
            16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
            24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
            127: 'DEL'
        };
        
        // Genişletilmiş ASCII karakterleri için özel isimler
        const extendedAsciiNames = {
            128: '€', 129: '•', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡',
            136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹', 140: 'Œ', 141: '•', 142: 'Ž', 143: '•',
            144: '•', 145: '\'\'', 146: '\'', 147: '"', 148: '"', 149: '•', 150: '–', 151: '—',
            152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ', 157: '•', 158: 'ž', 159: 'Ÿ',
            160: ' ', 161: '¡', 162: '¢', 163: '£', 164: '¤', 165: '¥', 166: '¦', 167: '§',
            168: '¨', 169: '©', 170: 'ª', 171: '«', 172: '¬', 173: '­', 174: '®', 175: '¯',
            176: '°', 177: '±', 178: '²', 179: '³', 180: '´', 181: 'µ', 182: '¶', 183: '·',
            184: '¸', 185: '¹', 186: 'º', 187: '»', 188: '¼', 189: '½', 190: '¾', 191: '¿',
            192: 'À', 193: 'Á', 194: 'Â', 195: 'Ã', 196: 'Ä', 197: 'Å', 198: 'Æ', 199: 'Ç',
            200: 'È', 201: 'É', 202: 'Ê', 203: 'Ë', 204: 'Ì', 205: 'Í', 206: 'Î', 207: 'Ï',
            208: 'Ð', 209: 'Ñ', 210: 'Ò', 211: 'Ó', 212: 'Ô', 213: 'Õ', 214: 'Ö', 215: '×',
            216: 'Ø', 217: 'Ù', 218: 'Ú', 219: 'Û', 220: 'Ü', 221: 'Ý', 222: 'Þ', 223: 'ß',
            224: 'à', 225: 'á', 226: 'â', 227: 'ã', 228: 'ä', 229: 'å', 230: 'æ', 231: 'ç',
            232: 'è', 233: 'é', 234: 'ê', 235: 'ë', 236: 'ì', 237: 'í', 238: 'î', 239: 'ï',
            240: 'ð', 241: 'ñ', 242: 'ò', 243: 'ó', 244: 'ô', 245: 'õ', 246: 'ö', 247: '÷',
            248: 'ø', 249: 'ù', 250: 'ú', 251: 'û', 252: 'ü', 253: 'ý', 254: 'þ', 255: 'ÿ'
        };
        
        // Kontrol karakteri ise özel isim göster
        if (controlCharNames[value]) {
            return `<span style="font-weight: bold; font-size: 0.9em; color: #666; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">${controlCharNames[value]}</span>`;
        }
        
        // Genişletilmiş ASCII ise özel karakter göster
        if (extendedAsciiNames[value]) {
            return `<span style="font-weight: bold; font-size: 1.1em; color: #2196F3;">${extendedAsciiNames[value]}</span>`;
        }
        
        // Normal görünür karakter
        const asciiChar = formatBytesToText([value], 'ascii', '');
        return `<span style="font-weight: bold; font-size: 1.1em;">${asciiChar}</span>`;
    };
    
    // Helper function to get ASCII display - utils'den import edilen fonksiyonu kullan
    const getAsciiDisplay = (value) => {
        return getInvisibleAsciiDisplay(value);
    };
    
    // Helper function to create a cell group (DEC, HEX, ASCII)
    const createCellGroup = (value) => {
        const cells = [];
        
        // CR/LF class belirleme
        let crlfClass = '';
        if (value === 13) {
            crlfClass = 'cr-character';
        } else if (value === 10) {
            crlfClass = 'lf-character';
        }
        
        // DECIMAL cell
        const decCell = document.createElement('td');
        decCell.className = `px-4 py-3 border text-center decimal-cell table-cell ${crlfClass}`;
        decCell.style.borderColor = 'var(--theme-border)';
        decCell.style.color = 'var(--theme-text)';
        decCell.style.fontWeight = 'bold';
        decCell.style.fontSize = '1em';
        decCell.textContent = value;
        cells.push(decCell);
        
        // HEX cell
        const hexCell = document.createElement('td');
        hexCell.className = `px-4 py-3 border text-center table-cell ${crlfClass}`;
        hexCell.style.borderColor = 'var(--theme-border)';
        hexCell.style.color = 'var(--theme-text)';
        hexCell.style.fontWeight = 'bold';
        hexCell.style.fontSize = '0.95em';
        hexCell.textContent = formatBytesToText([value], 'hex', '');
        cells.push(hexCell);
        
        // ASCII cell
        const asciiCell = document.createElement('td');
        asciiCell.className = `px-4 py-3 border text-center table-cell ${crlfClass}`;
        asciiCell.style.borderColor = 'var(--theme-border)';
        asciiCell.style.color = 'var(--theme-text)';
        asciiCell.innerHTML = getAsciiDisplay(value);
        cells.push(asciiCell);
        
        return cells;
    };
    
    // Her satırda 4 grup değer göster (0-63 satır, her satır 4 değer)
    const rowCount = 64;
    for (let row = 0; row < rowCount; row++) {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--theme-border)';
        
        // Zebra striping
        if (row % 2 === 0) {
            tr.style.backgroundColor = 'var(--theme-surface)';
        } else {
            tr.style.backgroundColor = 'var(--theme-background)';
        }
        
        // Her satırda 4 değer: row, row+64, row+128, row+192
        for (let col = 0; col < 4; col++) {
            const value = row + (col * 64);
            if (value < 256) {
                const cells = createCellGroup(value);
                cells.forEach(cell => tr.appendChild(cell));
            }
        }
        
        tableBody.appendChild(tr);
    }
};

// Initialize the app
window.onload = () => {
    
    // Handle URL mode parameters
    handleUrlMode();
    
    // Populate ASCII reference table
    populateAsciiTable();
    
    // DOM elementlerini bul
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');
    hexGrid = document.getElementById('hex-grid');
    asciiGrid = document.getElementById('ascii-grid');
    decimalGrid = document.getElementById('decimal-grid');
    binaryGrid = document.getElementById('binary-grid');
    copyButtons = document.querySelectorAll('.copy-button');
    clearButtons = document.querySelectorAll('.clear-button');
    
    // DOM elementlerini kontrol et
    if (!hexGrid || !asciiGrid || !decimalGrid || !binaryGrid) {
        alert('Grid elementleri bulunamadı!');
        return;
    }
    
    // Initialize theme system
    window.themeManager = new ThemeManager();
    
    // Dev butonu kaldırıldı
    
    
    createGrid(hexGrid, 'hex-cell', 'hex');
    createGrid(asciiGrid, 'ascii-cell', 'ascii');
    createGrid(decimalGrid, 'decimal-cell', 'decimal');
    createGrid(binaryGrid, 'binary-cell', 'binary');
    
    // Initialize 4 in 1 mode
    initializeFourInOneMode();
    
    // Initialize 4 in 1 copy buttons
    initializeFourInOneCopyButtons();
    
    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all tabs and buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = 'var(--theme-secondary)';
                btn.style.color = 'var(--theme-text)';
            });
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to the clicked tab and button
            button.classList.add('active');
            button.style.backgroundColor = 'var(--theme-primary)';
            button.style.color = 'white';
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // Save active tab to localStorage
            try {
                localStorage.setItem('bytesync-active-tab', targetTab);
            } catch (err) {
                console.warn('localStorage yazılamıyor:', err);
            }

            // Clear all selection when switching tabs
            clearAllSelection();

            // Re-apply highlight to the current active cell
            if (activeIndex !== -1) {
                const activeInput = document.querySelector(`#${targetTab}-tab [data-index="${activeIndex}"]`);
                if (activeInput) activeInput.focus();
            } else {
                // Eğer aktif hücre yoksa ve grid boşsa, 1. input'a focus ol
                const isGridEmpty = data.every(value => value === 0);
                if (isGridEmpty) {
                    const firstInput = document.querySelector(`#${targetTab}-tab [data-index="0"]`);
                    if (firstInput) {
                        firstInput.focus();
                        firstInput.select();
                    }
                }
            }
        });
    });

    // Copy all data from a specific format
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            // utils.js'deki standart formatBytesToText fonksiyonunu kullan
            const textToCopy = formatBytesToText(data, type, ' ');
            
            // Use the clipboard API for modern browsers
            navigator.clipboard.writeText(textToCopy).then(() => {
                NotificationHelper.showSuccess('İçerik panoya kopyalandı!');
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    });

    // Clear all cells event listeners
    clearButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearAllCells();
            // Show feedback
            const originalText = button.textContent;
            const originalBg = button.style.backgroundColor;
            button.textContent = 'Cleared!';
            button.style.backgroundColor = 'var(--theme-success)';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = originalBg;
            }, 1500);
        });
    });

    
    // Load and set active tab from localStorage
    try {
        const savedTab = localStorage.getItem('bytesync-active-tab') || 'hex';
        const tabButton = document.querySelector(`[data-tab="${savedTab}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
            tabButton.style.backgroundColor = 'var(--theme-primary)';
            tabButton.style.color = 'white';
            tabButton.click();
        } else {
            // Fallback to hex if saved tab not found
            const hexButton = document.querySelector('[data-tab="hex"]');
            hexButton.classList.add('active');
            hexButton.style.backgroundColor = 'var(--theme-primary)';
            hexButton.style.color = 'white';
            hexButton.click();
        }
    } catch (err) {
        console.warn('localStorage okunamıyor:', err);
        // Fallback to hex
        const hexButton = document.querySelector('[data-tab="hex"]');
        hexButton.classList.add('active');
        hexButton.style.backgroundColor = 'var(--theme-primary)';
        hexButton.style.color = 'white';
        hexButton.click();
    }
    


    // Context menu event listener (sağ tık) - MacOS uyumlu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        createContextMenu(e.clientX, e.clientY);
    });
    
    // MacOS için alternatif: Ctrl+Click
    document.addEventListener('mousedown', (e) => {
        if (e.ctrlKey && e.button === 0) { // Ctrl + sol tık
            e.preventDefault();
            e.stopPropagation();
            createContextMenu(e.clientX, e.clientY);
        }
    });

    // Global klavye kısayolları (document seviyesinde)
    document.addEventListener('keydown', (e) => {
        // Command/Ctrl + 1,2,3,4,5 - Mod değiştirme (Mac: ⌘, Windows: Ctrl)
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
            let targetTab = null;
            // Command + sayı tuşları ile tab değiştirme
            switch (e.code) {
                case 'Digit1':
                    targetTab = 'ascii';
                    break;
                case 'Digit2':
                    targetTab = 'hex';
                    break;
                case 'Digit3':
                    targetTab = 'decimal';
                    break;
                case 'Digit4':
                    targetTab = 'binary';
                    break;
                case 'Digit5':
                    targetTab = 'four-in-one';
                    break;
            }
            
            if (targetTab) {
                e.preventDefault();
                const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
                if (tabButton) {
                    tabButton.click();
                }
                return;
            }
        }

        // Ctrl+A (veya Cmd+A) - Tümünü seç (global işlem)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllCells();
            return;
        }

        // Delete tuşu - Tüm seçili ise temizle (global işlem)
        if ((e.key === 'Delete' || e.key === 'Backspace') && allSelected) {
            e.preventDefault();
            clearAllCells();
            return;
        }

        // F5 tuşu - Sayfayı yenile
        if (e.key === 'F5') {
            e.preventDefault();
            window.location.reload();
            return;
        }
        // DevTools tuş kombinasyonları kaldırıldı
    });
    
    // PWA güncelleme yöneticisini başlat
    pwaUpdateManager = new PWAUpdateManager();
};

// Initialize 4 in 1 mode
const initializeFourInOneMode = () => {
    // Load saved custom delimiter from localStorage
    const customDelimiterInput = document.getElementById('custom-delimiter');
    if (customDelimiterInput) {
        try {
            const savedCustomDelimiter = localStorage.getItem('bytesync-custom-delimiter');
            if (savedCustomDelimiter !== null) {
                customDelimiterInput.value = savedCustomDelimiter;
                // If custom delimiter exists, select 'custom' option and enable input
                const customOption = document.querySelector('input[name="delimiter-option"][value="custom"]');
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
            const customDelimiterInput = document.getElementById('custom-delimiter');
            if (customDelimiterInput) {
                customDelimiterInput.disabled = e.target.value !== 'custom';
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
        const textarea = document.getElementById(`four-in-one-${format}`);
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                handleFourInOneInput(format, e.target.value);
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
};

// PWA Güncelleme Kontrolü ve Bildirimi
class PWAUpdateManager {
    constructor() {
        this.updateAvailable = false;
        this.registration = null;
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('./sw.js');
                
                // Service Worker mesajlarını dinle
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                        this.showUpdateNotification();
                    }
                });

                // Güncelleme kontrolü
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });

                // Sayfa yüklendiğinde güncelleme kontrolü
                this.checkForUpdates();
            } catch (error) {
                // Service Worker kayıt hatası - sessizce geç
            }
        }
    }

    async checkForUpdates() {
        if (this.registration) {
            try {
                await this.registration.update();
            } catch (error) {
                // Güncelleme kontrolü hatası - sessizce geç
            }
        }
    }

    showUpdateNotification() {
        if (this.updateAvailable) return; // Zaten gösterilmiş
        
        this.updateAvailable = true;
        
        // Güncelleme bildirimi oluştur
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-notification">
                <div class="update-content">
                    <div class="update-icon">🔄</div>
                    <div class="update-text">
                        <h3>Yeni Güncelleme Mevcut!</h3>
                        <p>ByteSync Editor'ün yeni bir sürümü mevcut. Güncellemek için sayfayı yenileyin.</p>
                    </div>
                    <div class="update-actions">
                        <button id="update-now-btn" class="update-btn primary">Şimdi Güncelle</button>
                        <button id="update-later-btn" class="update-btn secondary">Daha Sonra</button>
                    </div>
                </div>
            </div>
        `;

        // Stil ekle
        const style = document.createElement('style');
        style.textContent = `
            #pwa-update-notification {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                animation: slideDown 0.3s ease-out;
            }
            
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            
            @keyframes slideUp {
                from { transform: translateY(0); }
                to { transform: translateY(-100%); }
            }
            
            .update-notification {
                padding: 16px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .update-content {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .update-icon {
                font-size: 24px;
                animation: spin 2s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .update-text {
                flex: 1;
            }
            
            .update-text h3 {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .update-text p {
                margin: 0;
                font-size: 14px;
                opacity: 0.9;
            }
            
            .update-actions {
                display: flex;
                gap: 12px;
            }
            
            .update-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .update-btn.primary {
                background: #4CAF50;
                color: white;
            }
            
            .update-btn.primary:hover {
                background: #45a049;
                transform: translateY(-1px);
            }
            
            .update-btn.secondary {
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
            }
            
            .update-btn.secondary:hover {
                background: rgba(255,255,255,0.3);
            }
            
            @media (max-width: 768px) {
                .update-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 12px;
                }
                
                .update-actions {
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Event listener'ları ekle
        document.getElementById('update-now-btn').addEventListener('click', () => {
            this.performUpdate();
        });

        document.getElementById('update-later-btn').addEventListener('click', () => {
            this.hideUpdateNotification();
        });

        // 10 saniye sonra otomatik gizle
        setTimeout(() => {
            if (this.updateAvailable) {
                this.hideUpdateNotification();
            }
        }, 10000);
    }

    hideUpdateNotification() {
        const notification = document.getElementById('pwa-update-notification');
        if (notification) {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
                this.updateAvailable = false;
            }, 300);
        }
    }

    async performUpdate() {
        try {
            // Service Worker'ı yenile
            if (this.registration && this.registration.waiting) {
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Hard refresh yap
            window.location.reload(true);
        } catch (error) {
            // Hata durumunda normal refresh
            window.location.reload();
        }
    }
}

// PWA güncelleme yöneticisini başlat
let pwaUpdateManager;

// Feedback Form Functions
class FeedbackForm {
    constructor() {
        this.form = document.getElementById('feedback-form');
        this.previewModal = document.getElementById('preview-modal');
        this.previewContent = document.getElementById('preview-content');
        this.githubRepo = 'kaangrbz/byte-sync-editor'; // GitHub repository URL
        this.appVersion = APP_CONFIG.version; // App version from config
        
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        // Form submit event
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Önizleme butonu
        const previewBtn = document.getElementById('preview-feedback');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }
        
        // Modal kapatma butonları
        const closeBtns = ['close-preview', 'close-preview-btn'];
        closeBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.hidePreview());
            }
        });
        
        // Modal dışına tıklama ile kapatma
        if (this.previewModal) {
            this.previewModal.addEventListener('click', (e) => {
                if (e.target === this.previewModal) {
                    this.hidePreview();
                }
            });
        }
        
        // GitHub'da oluştur butonu
        const createIssueBtn = document.getElementById('create-issue-btn');
        if (createIssueBtn) {
            createIssueBtn.addEventListener('click', () => this.createGitHubIssue());
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        this.createGitHubIssue();
    }
    
    showPreview() {
        const formData = this.getFormData();
        if (!formData) return;
        
        const preview = this.generatePreview(formData);
        this.previewContent.innerHTML = preview;
        this.previewModal.classList.remove('hidden');
        this.previewModal.classList.add('flex');
    }
    
    hidePreview() {
        this.previewModal.classList.add('hidden');
        this.previewModal.classList.remove('flex');
    }
    
    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            type: formData.get('type'),
            title: formData.get('title'),
            description: formData.get('description'),
            email: formData.get('email')
        };
        
        // Validation
        if (!data.type || !data.title || !data.description) {
            alert('Please fill in all required fields.');
            return null;
        }
        
        return data;
    }
    
    generatePreview(data) {
        const typeEmojis = {
            'bug': '🐛',
            'feature': '💡',
            'improvement': '⚡',
            'question': '❓',
            'other': '💬'
        };
        
        const typeLabels = {
            'bug': 'Bug Report',
            'feature': 'Feature Request',
            'improvement': 'Improvement Suggestion',
            'question': 'Question',
            'other': 'Other'
        };
        
        const emoji = typeEmojis[data.type] || '💬';
        const label = typeLabels[data.type] || 'Feedback';
        
        return `
            <div class="border rounded-lg p-4" style="border-color: var(--theme-border);">
                <div class="flex items-center mb-3">
                    <span class="text-2xl mr-2">${emoji}</span>
                    <h3 class="text-lg font-bold">${data.title}</h3>
                    <span class="ml-auto px-2 py-1 text-xs rounded" style="background-color: var(--theme-primary); color: white;">${label}</span>
                </div>
                <div class="prose max-w-none">
                    <p class="whitespace-pre-wrap">${data.description}</p>
                </div>
                ${data.email ? `<div class="mt-3 text-sm" style="color: var(--theme-textSecondary);">Contact: ${data.email}</div>` : ''}
            </div>
        `;
    }
    
    createGitHubIssue() {
        const formData = this.getFormData();
        if (!formData) return;
        
        const typeEmojis = {
            'bug': '🐛',
            'feature': '💡',
            'improvement': '⚡',
            'question': '❓',
            'other': '💬'
        };
        
        const emoji = typeEmojis[formData.type] || '💬';
        
        // GitHub issue URL'si oluştur
        const title = encodeURIComponent(`${emoji} ${formData.title}`);
        const body = this.generateIssueBody(formData);
        const labels = this.getLabelsForType(formData.type);
        
        const githubUrl = `https://github.com/${this.githubRepo}/issues/new?title=${title}&body=${encodeURIComponent(body)}&labels=${labels}`;
        
        // Open in new tab
        window.open(githubUrl, '_blank');
        
        // Show success message
        this.showSuccessMessage();
    }
    
    generateIssueBody(data) {
        const typeLabels = {
            'bug': 'Bug Report',
            'feature': 'Feature Request',
            'improvement': 'Improvement Suggestion',
            'question': 'Question',
            'other': 'Feedback'
        };
        
        const label = typeLabels[data.type] || 'Feedback';
        
        let body = `## ${label}\n\n`;
        body += `**Description:**\n${data.description}\n\n`;
        
        if (data.email) {
            body += `**Contact:** ${data.email}\n\n`;
        }
        
        body += `---\n`;
        body += `**ByteSync Editor v${this.appVersion}**\n`;
        body += `**Submission Date:** ${new Date().toLocaleString('en-US')}\n`;
        
        if (data.type === 'bug') {
            body += `\n**Additional information for bug report:**\n`;
            body += `- App Version: ${this.appVersion}\n`;
            body += `- Operating System: ${navigator.platform}\n`;
            body += `- Browser: ${navigator.userAgent}\n`;
            body += `- Steps to reproduce:\n`;
            body += `  1. \n`;
            body += `  2. \n`;
            body += `  3. \n`;
            body += `\n**Expected behavior:**\n\n`;
            body += `**Actual behavior:**\n\n`;
        }
        
        return body;
    }
    
    getLabelsForType(type) {
        const labelMap = {
            'bug': 'bug',
            'feature': 'enhancement',
            'improvement': 'enhancement',
            'question': 'question',
            'other': 'feedback'
        };
        
        return labelMap[type] || 'feedback';
    }
    
    showSuccessMessage() {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-all duration-300';
        notification.style.backgroundColor = 'var(--theme-success)';
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="text-xl mr-2">✅</span>
                <span>Opening GitHub page...</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load app config from manifest.json
    await loadAppConfig();
    
    // Initialize feedback form with loaded config
    new FeedbackForm();
    
    // Update version in HTML
    updateVersionInHTML();
});

// Function to update version in HTML if needed
function updateVersionInHTML() {
    const versionElement = document.getElementById('app-title');
    if (versionElement) {
        // Use the centralized version from config
        versionElement.textContent = `${APP_CONFIG.name} v${APP_CONFIG.version}`;
    }
}


