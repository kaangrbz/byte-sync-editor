/**
 * ByteSync Editor - Ana JavaScript Dosyası
 * Tüm uygulama mantığı ve event handler'ları
 */

// Import utility functions
import { 
    getMaxLengthForType, 
    convertValue, 
    isValidValue, 
    parseValue, 
    getSmartCopyData, 
    parseTextToBytes,
    formatBytesToText,
    getDelimiter
} from './src/utils.js';

// DOM elementleri - window.onload içinde tanımlanacak
let tabButtons, tabContents, hexGrid, asciiGrid, decimalGrid, binaryGrid, copyButtons, clearButtons;

// Veri ve durum değişkenleri
let data = new Uint8Array(256);
let activeIndex = -1;
let allSelected = false;

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
    let value = event.target.value;

    // Karakter limiti kontrolü ve otomatik geçiş
    const maxLength = getMaxLengthForType(type);
    if (value.length >= maxLength) {

        console.log('value:', value, 'type:', type, 'maxLength:', maxLength);
        // Sadece geçerli bir değer tamamlandığında bir sonraki input'a geç
        if (type === 'hex' && /^[0-9a-fA-F]{2}$/.test(value)) {
            // Geçerli 2 karakterlik hex değeri tamamlandı
            console.log('Hex geçiş yapılıyor:', value, index);
            setTimeout(() => {
                focusNextInput(index, type);
            }, 10);
        } else if (type === 'decimal' && /^\d{3}$/.test(value) && parseInt(value) <= 255) {
            // Geçerli 3 karakterlik decimal değeri tamamlandı
            setTimeout(() => {
                focusNextInput(index, type);
            }, 10);
        } else if (type === 'binary' && /^[01]{8}$/.test(value)) {
            // Geçerli 8 karakterlik binary değeri tamamlandı
            setTimeout(() => {
                focusNextInput(index, type);
            }, 10);
        } else if (type === 'ascii' && value.length === 1) {
            // ASCII için 1 karakter tamamlandı
            setTimeout(() => {
                focusNextInput(index, type);
            }, 10);
        }
    }

    // Validate and update data
    let byteValue;
    if (type === 'hex') {
        // Hex değerlerini büyük harfe çevir
        value = value.toUpperCase();
        event.target.value = value; // Input'u büyük harfle güncelle
        
        if (!/^[0-9A-F]{0,2}$/.test(value)) {
            // Geçersiz hex değeri - maksimum değeri yaz (FF)
            if (value.length >= maxLength) {
                event.target.value = 'FF';
                byteValue = 255;
                // Sonraki input'a geç
                setTimeout(() => {
                    focusNextInput(index, type);
                }, 10);
            } else {
                event.target.value = ''; // Kısa değerler için temizle
                return;
            }
        } else if (value.length > 0) {
            byteValue = parseInt(value, 16);
        } else {
            // Boş hex input - değeri değiştirme
            return;
        }
    } else if (type === 'ascii') {
        if (value.length > 0) {
            byteValue = value.charCodeAt(0);
        } else {
            // Boş ASCII input - değeri değiştirme
            return;
        }
    } else if (type === 'decimal') {
        if (!/^\d{0,3}$/.test(value) || (value.length > 0 && parseInt(value) > 255)) {
            // Geçersiz decimal değeri - maksimum değeri yaz (255)
            if (value.length >= maxLength) {
                event.target.value = '255';
                byteValue = 255;
                // Sonraki input'a geç
                setTimeout(() => {
                    focusNextInput(index, type);
                }, 10);
            } else {
                event.target.value = ''; // Kısa değerler için temizle
                return;
            }
        } else if (value.length > 0) {
            byteValue = parseInt(value, 10);
        } else {
            // Boş decimal input - değeri değiştirme
            return;
        }
    } else if (type === 'binary') {
        if (!/^[01]{0,8}$/.test(value)) {
            // Geçersiz binary değeri - maksimum değeri yaz (11111111)
            if (value.length >= maxLength) {
                event.target.value = '11111111';
                byteValue = 255;
                // Sonraki input'a geç
                setTimeout(() => {
                    focusNextInput(index, type);
                }, 10);
            } else {
                event.target.value = ''; // Kısa değerler için temizle
                return;
            }
        } else if (value.length > 0) {
            byteValue = parseInt(value, 2);
        } else {
            // Boş binary input - değeri değiştirme
            return;
        }
    }

    // 0 değerleri de dahil olmak üzere tüm geçerli değerleri kaydet
    if (!isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
        data[index] = byteValue;
        // Aktif input'u güncelleme - 0 değerleri de korunacak
        updateAllViews(true);
    }
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






// Ortak paste parsing fonksiyonu
const parsePastedText = (pastedText, type) => {
    if (!pastedText || pastedText.trim() === '') return [];
    
    let valuesToParse = [];
    if (type === 'ascii') {
        // ASCII için karakter karakter işle
        const characters = pastedText.split('');
        for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            const charCode = char.charCodeAt(0);
            
            // Yazdırılabilir karakterler (32-126) veya CR/LF ise normal işle
            if ((charCode >= 32 && charCode <= 126) || charCode === 13 || charCode === 10) {
                valuesToParse.push(char);
            }
        }
    } else if (type === 'hex') {
        const cleanText = pastedText.replace(/\s/g, '');
        for (let i = 0; i < cleanText.length; i += 2) {
            valuesToParse.push(cleanText.substring(i, i + 2));
        }
    } else if (type === 'decimal') {
        valuesToParse = pastedText.trim().split(/[,\s]+/).filter(val => val.length > 0);
    } else {
        valuesToParse = pastedText.trim().split(/\s+/);
    }
    
    return valuesToParse;
};

// Ortak byte parsing fonksiyonu
const parseValueToByte = (value, type) => {
    if (!value || value.trim() === '') return null;
    
    if (isValidValue(value, type)) {
        return parseValue(value, type);
    } else if (value === '0' || value === '00' || value === '00000000') {
        return 0;
    } else {
        return null;
    }
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
    const valuesToParse = parsePastedText(pastedText, type);

    for (let i = 0; i < valuesToParse.length; i++) {
        const globalIndex = startIndex + i;
        if (globalIndex >= data.length) break;

        const value = valuesToParse[i];
        const byteValue = parseValueToByte(value, type);

        if (byteValue !== null && !isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
            data[globalIndex] = byteValue;
        }
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
        
        // Değer yoksa veya undefined/null ise boş string
        if (value === undefined || value === null) {
            input.value = '';
            return;
        }
        
        // Değer 0-255 arası byte değeri ise convert et (0 dahil)
        if (typeof value === 'number' && value >= 0 && value <= 255) {
            input.value = convertValue(value, type);
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
    const delimiterOption = document.querySelector('input[name="delimiter-option"]:checked')?.value || 'comma';
    const customDelimiter = document.getElementById('custom-delimiter')?.value || '';
    const delimiter = getDelimiter(delimiterOption, customDelimiter);
    
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
    const delimiterOption = document.querySelector('input[name="delimiter-option"]:checked')?.value || 'comma';
    const customDelimiter = document.getElementById('custom-delimiter')?.value || '';
    const delimiter = getDelimiter(delimiterOption, customDelimiter);
    
    // Parse the input text to bytes
    const parsedBytes = parseTextToBytes(text, sourceFormat, delimiter);
    fourInOneData = new Uint8Array(parsedBytes);
    
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
    const delimiterOption = document.querySelector('input[name="delimiter-option"]:checked')?.value || 'space';
    const customDelimiter = document.getElementById('custom-delimiter')?.value || '';
    const delimiter = getDelimiter(delimiterOption, customDelimiter);
    
    const formats = ['ascii', 'hex', 'decimal', 'binary'];
    let allFormats = '';
    
    formats.forEach((format, index) => {
        const textarea = document.getElementById(`four-in-one-${format}`);
        if (textarea) {
            allFormats += `${format.toUpperCase()}:\n${textarea.value}\n\n`;
        }
    });
    
    navigator.clipboard.writeText(allFormats.trim()).then(() => {
        console.log('All formats copied to clipboard!');
    }).catch(err => {
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
                    console.log(`${format.toUpperCase()} copied to clipboard!`);
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
    // Reset all data to zero
    data.fill(0);
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
    const activeTab = document.querySelector('.tab-content.active');
    const type = activeTab.querySelector('.input-cell').dataset.type;

    const valuesToParse = parsePastedText(pastedText, type);

    // Tüm hücreleri temizle
    data.fill(0);
    
    // Paste edilen değerleri ekle
    for (let i = 0; i < Math.min(valuesToParse.length, data.length); i++) {
        const value = valuesToParse[i];
        const byteValue = parseValueToByte(value, type);

        if (byteValue !== null && !isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
            data[i] = byteValue;
        }
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
        { text: 'Reset (0)', action: 'reset', shortcut: 'Space' }
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
                const activeTab = document.querySelector('.tab-content.active');
                const type = activeTab.querySelector('.input-cell').dataset.type;
                const smartData = getSmartCopyData(data, type);
                let textToCopy = '';
                if (type === 'ascii') {
                    textToCopy = smartData.join('');
                } else {
                    textToCopy = smartData.join(' ');
                }
                navigator.clipboard.writeText(textToCopy);
            } else if (activeIndex !== -1) {
                // Aktif hücreyi kopyala
                const activeInput = document.querySelector(`[data-index="${activeIndex}"]`);
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
                    const activeInput = document.querySelector(`[data-index="${activeIndex}"]`);
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
                const activeTab = document.querySelector('.tab-content.active');
                const type = activeTab.querySelector('.input-cell').dataset.type;
                const smartData = getSmartCopyData(data, type);
                let textToCopy = '';
                if (type === 'ascii') {
                    textToCopy = smartData.join('');
                } else {
                    textToCopy = smartData.join(' ');
                }
                navigator.clipboard.writeText(textToCopy);
                clearAllCells();
            } else if (activeIndex !== -1) {
                // Aktif hücreyi kes
                const activeInput = document.querySelector(`[data-index="${activeIndex}"]`);
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
        // DevTools case kaldırıldı
    }
};

// Tab switching logic - window.onload içinde tanımlanacak

// Copy all data from a specific format - window.onload içinde tanımlanacak


// Clear all cells event listeners - window.onload içinde tanımlanacak

// Paste options event listeners - window.onload içinde tanımlanacak

// Dev butonu kaldırıldı

// PWA Service Worker Registration
const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered successfully:', registration);
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        if (confirm('New version available! Reload to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
};

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
    
    // ASCII karakter isimleri (kontrol karakterleri)
    const controlCharNames = [
        'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
        'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
        'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
        'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'
    ];
    
    // Helper function to get ASCII display
    const getAsciiDisplay = (value) => {
        if (value < 32) {
            return `<span style="color: var(--theme-warning); font-weight: bold; font-size: 0.9em;">${controlCharNames[value]}</span>`;
        } else if (value === 32) {
            return '<span style="color: var(--theme-textSecondary); font-weight: bold;">SP</span>';
        } else if (value === 127) {
            return '<span style="color: var(--theme-warning); font-weight: bold; font-size: 0.9em;">DEL</span>';
        } else if (value < 127) {
            return `<span style="font-weight: bold; font-size: 1.1em;">${String.fromCharCode(value)}</span>`;
        } else {
            return `<span style="color: var(--theme-textSecondary); font-size: 1.1em;">&#${value};</span>`;
        }
    };
    
    // Helper function to create a cell group (DEC, HEX, ASCII)
    const createCellGroup = (value) => {
        const cells = [];
        
        // DECIMAL cell
        const decCell = document.createElement('td');
        decCell.className = 'px-4 py-3 border text-center decimal-cell';
        decCell.style.borderColor = 'var(--theme-border)';
        decCell.style.color = 'var(--theme-text)';
        decCell.style.fontWeight = 'bold';
        decCell.style.fontSize = '1em';
        decCell.textContent = value;
        cells.push(decCell);
        
        // HEX cell
        const hexCell = document.createElement('td');
        hexCell.className = 'px-4 py-3 border text-center';
        hexCell.style.borderColor = 'var(--theme-border)';
        hexCell.style.color = 'var(--theme-text)';
        hexCell.style.fontWeight = 'bold';
        hexCell.style.fontSize = '0.95em';
        hexCell.textContent = value.toString(16).toUpperCase().padStart(2, '0');
        cells.push(hexCell);
        
        // ASCII cell
        const asciiCell = document.createElement('td');
        asciiCell.className = 'px-4 py-3 border text-center';
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
    // Register service worker
    registerServiceWorker();
    
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
            const smartData = getSmartCopyData(data, type);
            let textToCopy = '';
            
            if (type === 'ascii') {
                textToCopy = smartData.join('');
            } else {
                textToCopy = smartData.join(' ');
            }
            
            // Use the clipboard API for modern browsers
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log('Content copied to clipboard!');
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
        // Shift + 1,2,3,4,5 - Mod değiştirme
        if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
            let targetTab = null;
            // Shift basılıyken key değeri değişir (!, ", #, $, %) bu yüzden code kullanıyoruz
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
        
        // DevTools tuş kombinasyonları kaldırıldı
    });
};

// Initialize 4 in 1 mode
const initializeFourInOneMode = () => {
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
    const customDelimiterInput = document.getElementById('custom-delimiter');
    if (customDelimiterInput) {
        customDelimiterInput.addEventListener('input', () => {
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

