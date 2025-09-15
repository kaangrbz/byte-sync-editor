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
    getCopyDataInFormat,
    analyzeData,
    calculateEntropy,
    getByteFrequency,
    detectPatterns,
    parseTextToBytes,
    formatBytesToText,
    getDelimiter,
    exportToJSON,
    exportToCSV,
    exportToBase64,
    exportToURLEncoded,
    importFromJSON,
    importFromBase64,
    importFromURLEncoded,
    getTemplateData
} from './src/utils.js';

// DOM elementleri
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const hexGrid = document.getElementById('hex-grid');
const asciiGrid = document.getElementById('ascii-grid');
const decimalGrid = document.getElementById('decimal-grid');
const binaryGrid = document.getElementById('binary-grid');
const copyButtons = document.querySelectorAll('.copy-button');
const clearButtons = document.querySelectorAll('.clear-button');
const pasteOptionRadios = document.querySelectorAll('.paste-option-radio');
const customValueInputs = document.querySelectorAll('.custom-value-input');
const devtoolsButton = document.getElementById('devtools-button');

// Veri ve durum değişkenleri
let data = new Uint8Array(256);
let activeIndex = -1;
let allSelected = false;

// Grid oluşturma fonksiyonu
const createGrid = (grid, className, type) => {
    grid.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = `input-cell ${className}`;
        input.dataset.index = i;
        input.dataset.type = type;
        
        // Set the initial value and class
        const value = data[i];
        // Tüm modlarda varsayılan değer boş olsun
        input.value = value === 0 ? '' : convertValue(value, type);
        
        // Add appropriate class based on value
        if (value === 0) {
            input.classList.add('zero-value');
        } else if (value === 13) {
            input.classList.add('cr-value');
        } else if (value === 10) {
            input.classList.add('lf-value');
        }
        
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
        // Karakter limiti doldu, bir sonraki input'a geç
        setTimeout(() => {
            focusNextInput(index, type);
        }, 10);
    }

    // Validate and update data
    let byteValue;
    if (type === 'hex') {
        if (!/^[0-9a-fA-F]{0,2}$/.test(value)) {
            event.target.value = ''; // Clear invalid input
            return;
        }
        byteValue = parseInt(value, 16);
    } else if (type === 'ascii') {
        byteValue = value.charCodeAt(0);
    } else if (type === 'decimal') {
        if (!/^\d{0,3}$/.test(value) || parseInt(value) > 255) {
            event.target.value = '';
            return;
        }
        byteValue = parseInt(value, 10);
    } else if (type === 'binary') {
        if (!/^[01]{0,8}$/.test(value)) {
            event.target.value = '';
            return;
        }
        byteValue = parseInt(value, 2);
    }

    if (!isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
        data[index] = byteValue;
        updateAllViews();
    }
};


// Bir sonraki input'a odaklan ve içeriğini seç
const focusNextInput = (currentIndex, type) => {
    const nextIndex = (currentIndex + 1) % data.length;
    const activeTab = document.querySelector('.tab-content.active');
    
    if (activeTab) {
        const nextInput = activeTab.querySelector(`[data-index="${nextIndex}"]`);
        
        if (nextInput) {
            // Force focus and selection
            nextInput.focus();
            nextInput.select();
            highlightCell(nextIndex);
            // Trigger focus event to ensure proper state
            nextInput.dispatchEvent(new Event('focus', { bubbles: true }));
        }
    }
};



// Global paste seçeneği alma
const getPasteOption = () => {
    const selectedOption = document.querySelector('input[name="paste-option"]:checked');
    return selectedOption ? selectedOption.value : 'skip';
};

// Global özel değer alma
const getCustomValue = () => {
    const customInput = document.getElementById('custom-value');
    if (customInput && !customInput.disabled) {
        const value = parseInt(customInput.value, 10);
        return (!isNaN(value) && value >= 0 && value <= 255) ? value : 0;
    }
    return 0;
};



// Paste event handler
const handlePaste = (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text/plain');
    
    // Eğer tüm hücreler seçili ise, tümüne paste yap
    if (allSelected) {
        pasteToAllSelected(pastedText);
        return;
    }
    
    const startIndex = parseInt(event.target.dataset.index, 10);
    const type = event.target.dataset.type;
    const pasteOption = getPasteOption();
    const customValue = getCustomValue();

    let valuesToParse = [];
    if (type === 'ascii') {
        // ASCII için karakter karakter işle, paste seçeneklerini uygula
        const characters = pastedText.split('');
        for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            const charCode = char.charCodeAt(0);
            
            // Yazdırılabilir karakterler (32-126) veya CR/LF ise normal işle
            if ((charCode >= 32 && charCode <= 126) || charCode === 13 || charCode === 10) {
                valuesToParse.push(char);
            } else {
                // Geçersiz karakter için paste seçeneğini uygula
                switch (pasteOption) {
                    case 'skip':
                        // Atla - bu karakteri ekleme
                        break;
                    case 'empty':
                        // Boş değer (0) ekle
                        valuesToParse.push(String.fromCharCode(0));
                        break;
                    case 'custom':
                        // Özel değer ekle
                        valuesToParse.push(String.fromCharCode(customValue));
                        break;
                    default:
                        // Varsayılan olarak atla
                        break;
                }
            }
        }
    } else if (type === 'hex') {
        const cleanText = pastedText.replace(/\s/g, ''); // Remove all whitespace
        for (let i = 0; i < cleanText.length; i += 2) {
            valuesToParse.push(cleanText.substring(i, i + 2));
        }
    } else if (type === 'decimal') {
        // Decimal için hem virgül hem boşluk ile ayrılmış değerleri destekle
        // 0 değerlerini de dahil et
        valuesToParse = pastedText.trim().split(/[,\s]+/).filter(val => val.length > 0);
    } else {
        valuesToParse = pastedText.trim().split(/\s+/);
    }

    for (let i = 0; i < valuesToParse.length; i++) {
        const globalIndex = startIndex + i;
        if (globalIndex >= data.length) {
            break;
        }

        const value = valuesToParse[i];
        let byteValue;

        if (isValidValue(value, type)) {
            // Valid value - parse it
            byteValue = parseValue(value, type);
        } else if (value === '0' || value === '00' || value === '00000000') {
            // 0 değerlerini de kabul et
            byteValue = 0;
        } else {
            // Invalid value - handle based on paste option
            switch (pasteOption) {
                case 'skip':
                    continue; // Skip this value
                case 'empty':
                    byteValue = 0;
                    break;
                case 'custom':
                    byteValue = customValue;
                    break;
                default:
                    continue;
            }
        }

        if (!isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
            data[globalIndex] = byteValue;
        }
    }

    updateAllViews();
};

// Ok tuşu navigasyonu ve Ctrl+A işlemleri
const handleKeydown = (event) => {
    // Ctrl+A (veya Cmd+A) - Tümünü seç
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        selectAllCells();
        return;
    }

    // Delete tuşu - Tüm seçili ise temizle (Mac'te Fn+Delete veya normal Delete)
    if ((event.key === 'Delete' || event.key === 'Backspace') && allSelected) {
        event.preventDefault();
        clearAllCells();
        return;
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
        newIndex = (index - 1 + data.length) % data.length;
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const prevInput = activeTab.querySelector(`[data-index="${newIndex}"]`);
            if (prevInput) {
                // Force focus and selection
                prevInput.focus();
                prevInput.select();
                highlightCell(newIndex);
                // Trigger focus event to ensure proper state
                prevInput.dispatchEvent(new Event('focus', { bubbles: true }));
            }
        }
        return;
    }

    switch (event.key) {
        case 'ArrowRight':
            newIndex = (index + 1) % data.length;
            break;
        case 'ArrowLeft':
            newIndex = (index - 1 + data.length) % data.length;
            break;
        case 'ArrowDown':
            newIndex = (index + 16) % data.length;
            break;
        case 'ArrowUp':
            newIndex = (index - 16 + data.length) % data.length;
            break;
        default:
            return;
    }
    event.preventDefault();
    document.querySelector(`[data-index="${newIndex}"]`).focus();
};


// Tüm input alanlarını tüm view'larda güncelleme
const updateAllViews = () => {
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        const index = parseInt(input.dataset.index, 10);
        const type = input.dataset.type;
        const value = data[index];
        
        // Tüm modlarda 0 değerleri boş gösterilsin
        input.value = value === 0 ? '' : convertValue(value, type);
        
        // Remove all special value classes first
        input.classList.remove('zero-value', 'cr-value', 'lf-value');
        
        // Add appropriate class based on value
        if (value === 0) {
            input.classList.add('zero-value');
        } else if (value === 13) {
            input.classList.add('cr-value');
        } else if (value === 10) {
            input.classList.add('lf-value');
        }
    });
    
    // Update data analysis
    updateDataAnalysis();
    
    // If we just cleared all cells, ensure first input is focused
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

// Data analysis update function
const updateDataAnalysis = () => {
    const analysis = analyzeData(data);
    
    // Update statistics
    document.getElementById('total-bytes').textContent = analysis.totalBytes;
    document.getElementById('non-zero-bytes').textContent = analysis.nonZeroBytes;
    document.getElementById('unique-bytes').textContent = analysis.uniqueBytes;
    document.getElementById('entropy').textContent = analysis.entropy;
    
    // Update most frequent bytes
    const mostFrequentElements = [
        document.getElementById('most-frequent-1'),
        document.getElementById('most-frequent-2'),
        document.getElementById('most-frequent-3')
    ];
    
    mostFrequentElements.forEach((element, index) => {
        if (element) {
            element.textContent = analysis.mostFrequent[index] || '-';
        }
    });
    
    // Update patterns
    document.getElementById('repeats').textContent = analysis.patterns.repeats;
    document.getElementById('sequences').textContent = analysis.patterns.sequences;
    document.getElementById('ascii-chars').textContent = analysis.patterns.asciiChars;
    document.getElementById('control-chars').textContent = analysis.patterns.controlChars;
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

// Export/Import Functions
const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const exportData = (format) => {
    try {
        let content, filename, mimeType;
        
        switch (format) {
            case 'json':
                content = exportToJSON(data);
                filename = 'bytesync-data.json';
                mimeType = 'application/json';
                break;
            case 'csv':
                content = exportToCSV(data);
                filename = 'bytesync-data.csv';
                mimeType = 'text/csv';
                break;
            case 'base64':
                content = exportToBase64(data);
                filename = 'bytesync-data.txt';
                mimeType = 'text/plain';
                break;
            case 'url':
                content = exportToURLEncoded(data);
                filename = 'bytesync-data.txt';
                mimeType = 'text/plain';
                break;
            default:
                throw new Error('Unknown export format');
        }
        
        downloadFile(content, filename, mimeType);
        console.log(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed: ' + error.message);
    }
};

const importData = (format, content) => {
    try {
        let newData;
        
        switch (format) {
            case 'json':
                newData = importFromJSON(content);
                break;
            case 'base64':
                newData = importFromBase64(content);
                break;
            case 'url':
                newData = importFromURLEncoded(content);
                break;
            default:
                throw new Error('Unknown import format');
        }
        
        // Resize data array if needed
        if (newData.length !== data.length) {
            const resizedData = new Uint8Array(data.length);
            const copyLength = Math.min(newData.length, data.length);
            resizedData.set(newData.slice(0, copyLength));
            data.set(resizedData);
        } else {
            data.set(newData);
        }
        
        updateAllViews();
        console.log(`Data imported from ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed: ' + error.message);
    }
};

const loadTemplate = (templateName) => {
    try {
        const templateData = getTemplateData(templateName);
        data.set(templateData);
        updateAllViews();
        console.log(`Template '${templateName}' loaded`);
    } catch (error) {
        console.error('Template load failed:', error);
        alert('Template load failed: ' + error.message);
    }
};

// Initialize Export/Import functionality
const initializeExportImport = () => {
    // Export buttons
    document.getElementById('export-json')?.addEventListener('click', () => exportData('json'));
    document.getElementById('export-csv')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('export-base64')?.addEventListener('click', () => exportData('base64'));
    document.getElementById('export-url')?.addEventListener('click', () => exportData('url'));
    
    // Import buttons
    document.getElementById('import-json')?.addEventListener('click', () => {
        const content = prompt('Paste JSON content:');
        if (content) importData('json', content);
    });
    
    document.getElementById('import-base64')?.addEventListener('click', () => {
        const content = prompt('Paste Base64 content:');
        if (content) importData('base64', content);
    });
    
    document.getElementById('import-url')?.addEventListener('click', () => {
        const content = prompt('Paste URL encoded content:');
        if (content) importData('url', content);
    });
    
    // File import
    document.getElementById('import-file')?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const extension = file.name.split('.').pop().toLowerCase();
                
                try {
                    switch (extension) {
                        case 'json':
                            importData('json', content);
                            break;
                        case 'txt':
                            // Try to detect format
                            if (content.includes('{') && content.includes('}')) {
                                importData('json', content);
                            } else if (/^[A-Za-z0-9+/=]+$/.test(content.trim())) {
                                importData('base64', content);
                            } else {
                                importData('url', content);
                            }
                            break;
                        default:
                            alert('Unsupported file format');
                    }
                } catch (error) {
                    alert('Failed to import file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });
    
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = btn.dataset.template;
            loadTemplate(template);
        });
    });
    
    // 4 in 1 mode individual copy buttons
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
    allSelected = true;
    const allInputs = document.querySelectorAll('.input-cell');
    allInputs.forEach(input => {
        input.classList.add('all-selected');
    });
};

// Tüm seçimi temizleme
const clearAllSelection = () => {
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
    const pasteOption = getPasteOption();
    const customValue = getCustomValue();

    let valuesToParse = [];
    if (type === 'ascii') {
        // ASCII için karakter karakter işle, paste seçeneklerini uygula
        const characters = pastedText.split('');
        for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            const charCode = char.charCodeAt(0);
            
            // Yazdırılabilir karakterler (32-126) veya CR/LF ise normal işle
            if ((charCode >= 32 && charCode <= 126) || charCode === 13 || charCode === 10) {
                valuesToParse.push(char);
            } else {
                // Geçersiz karakter için paste seçeneğini uygula
                switch (pasteOption) {
                    case 'skip':
                        break;
                    case 'empty':
                        valuesToParse.push(String.fromCharCode(0));
                        break;
                    case 'custom':
                        valuesToParse.push(String.fromCharCode(customValue));
                        break;
                    default:
                        break;
                }
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

    // Tüm hücreleri temizle
    data.fill(0);
    
    // Paste edilen değerleri ekle
    for (let i = 0; i < Math.min(valuesToParse.length, data.length); i++) {
        const value = valuesToParse[i];
        let byteValue;

        if (isValidValue(value, type)) {
            byteValue = parseValue(value, type);
        } else if (value === '0' || value === '00' || value === '00000000') {
            // 0 değerlerini de kabul et
            byteValue = 0;
        } else {
            switch (pasteOption) {
                case 'skip':
                    continue;
                case 'empty':
                    byteValue = 0;
                    break;
                case 'custom':
                    byteValue = customValue;
                    break;
                default:
                    continue;
            }
        }

        if (!isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
            data[i] = byteValue;
        }
    }

    updateAllViews();
    clearAllSelection();
};

// DevTools açma fonksiyonu (Web versiyonu)
const openDevTools = () => {
    console.log('DevTools açılıyor...');
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

    // Menü öğeleri
    const menuItems = [
        { text: '📋 Kopyala', action: 'copy', shortcut: 'Ctrl+C' },
        { text: '📄 Yapıştır', action: 'paste', shortcut: 'Ctrl+V' },
        { text: '✂️ Kes', action: 'cut', shortcut: 'Ctrl+X' },
        { separator: true },
        { text: '🔍 Hepsini Seç', action: 'selectAll', shortcut: 'Ctrl+A' },
        { text: '🗑️ Temizle', action: 'clear', shortcut: 'Delete' },
        { separator: true },
        { text: '↩️ CR Ekle', action: 'addCR', shortcut: 'Cmd+Enter' },
        { text: '↵ LF Ekle', action: 'addLF', shortcut: 'Cmd+Shift+Enter' },
        { separator: true },
        { text: '🔧 DevTools', action: 'devtools', shortcut: 'F12' }
    ];

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
        case 'devtools':
            openDevTools();
            break;
    }
};

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
        }
    });
});

// Copy all data from a specific format
copyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const type = button.dataset.type;
        const smartData = getSmartCopyData(type);
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

// Advanced copy format buttons
document.addEventListener('DOMContentLoaded', () => {
    const copyFormatButtons = document.querySelectorAll('.copy-format-btn');
    copyFormatButtons.forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            const textToCopy = getCopyDataInFormat(format);
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log(`Content copied in ${format} format!`);
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.backgroundColor = 'var(--theme-success)';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = 'var(--theme-secondary)';
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
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

// Paste options event listeners
pasteOptionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const customInput = document.getElementById('custom-value');
        if (customInput) {
            customInput.disabled = e.target.value !== 'custom';
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('bytesync-paste-option', e.target.value);
        } catch (err) {
            console.warn('localStorage yazılamıyor:', err);
        }
    });
});

// Custom value input event listeners
customValueInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        try {
            localStorage.setItem('bytesync-custom-value', e.target.value);
        } catch (err) {
            console.warn('localStorage yazılamıyor:', err);
        }
    });
});

// Initialize the app
window.onload = () => {
    // Initialize theme system
    window.themeManager = new ThemeManager();
    
    // Load paste options from localStorage
    try {
        const savedPasteOption = localStorage.getItem('bytesync-paste-option') || 'skip';
        const savedCustomValue = localStorage.getItem('bytesync-custom-value') || '0';
        
        // Apply saved options
        document.querySelectorAll('input[name="paste-option"]').forEach(radio => {
            if (radio.value === savedPasteOption) {
                radio.checked = true;
            }
        });
        
        const customInput = document.getElementById('custom-value');
        if (customInput) {
            customInput.disabled = savedPasteOption !== 'custom';
            customInput.value = savedCustomValue;
        }
    } catch (err) {
        console.warn('localStorage okunamıyor:', err);
    }
    
    createGrid(hexGrid, 'hex-cell', 'hex');
    createGrid(asciiGrid, 'ascii-cell', 'ascii');
    createGrid(decimalGrid, 'decimal-cell', 'decimal');
    createGrid(binaryGrid, 'binary-cell', 'binary');
    
    // Initialize 4 in 1 mode
    initializeFourInOneMode();
    
    // Initialize export/import
    initializeExportImport();
    
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
    
    // DevTools butonu event listener
    if (devtoolsButton) {
        devtoolsButton.addEventListener('click', openDevTools);
    }

    // Context menu event listener (sağ tık)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        createContextMenu(e.clientX, e.clientY);
    });

    // Klavye kısayolları
    document.addEventListener('keydown', (e) => {
        // Shift + 1,2,3,4,5 - Mod değiştirme (document seviyesinde)
        if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
            let targetTab = null;
            switch (e.key) {
                case '1':
                    targetTab = 'ascii';
                    break;
                case '2':
                    targetTab = 'hex';
                    break;
                case '3':
                    targetTab = 'decimal';
                    break;
                case '4':
                    targetTab = 'binary';
                    break;
                case '5':
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
        
        // F12 - DevTools
        if (e.key === 'F12') {
            e.preventDefault();
            openDevTools();
        }
        
        // Ctrl+Shift+I - DevTools (alternatif)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            openDevTools();
        }
        
        // Ctrl+Shift+C - DevTools (alternatif)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            openDevTools();
        }
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

