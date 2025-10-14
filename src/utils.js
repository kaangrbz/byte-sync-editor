// Test edilebilir utility fonksiyonları

// Input türüne göre maksimum karakter sayısını döndür
export const getMaxLengthForType = (type) => {
    switch (type) {
        case 'ascii':
            return 1;
        case 'hex':
            return 2;
        case 'decimal':
            return 3;
        case 'binary':
            return 8;
        default:
            return 1;
    }
};

// Değer validasyonu
export const isValidValue = (value, type) => {
    switch (type) {
        case 'hex':
            return /^[0-9A-Fa-f]{1,2}$/.test(value);
        case 'decimal':
            return /^\d{1,3}$/.test(value) && parseInt(value) <= 255;
        case 'binary':
            return /^[01]{1,8}$/.test(value);
        case 'ascii':
            return value.length === 1 && value.charCodeAt(0) >= 0 && value.charCodeAt(0) <= 255;
        default:
            return false;
    }
};

// Değer parse etme
export const parseValue = (value, type) => {
    switch (type) {
        case 'hex':
            return parseInt(value, 16);
        case 'decimal':
            return parseInt(value, 10);
        case 'binary':
            return parseInt(value, 2);
        case 'ascii':
            return value.charCodeAt(0);
        default:
            return 0;
    }
};

// Kontrol karakterleri için görsel gösterim mapping'i
const getControlCharDisplay = (byte) => {
    const controlChars = {
        0: '[NULL]',    // Null karakter
        1: '[SOH]',     // Start of Heading
        2: '[STX]',     // Start of Text
        3: '[ETX]',     // End of Text
        4: '[EOT]',     // End of Transmission
        5: '[ENQ]',     // Enquiry
        6: '[ACK]',     // Acknowledge
        7: '[BEL]',     // Bell
        8: '[BS]',      // Backspace
        9: '[TAB]',     // Horizontal Tab
        10: '[LF]',     // Line Feed
        11: '[VT]',     // Vertical Tab
        12: '[FF]',     // Form Feed
        13: '[CR]',     // Carriage Return
        14: '[SO]',     // Shift Out
        15: '[SI]',     // Shift In
        16: '[DLE]',    // Data Link Escape
        17: '[DC1]',    // Device Control 1
        18: '[DC2]',    // Device Control 2
        19: '[DC3]',    // Device Control 3
        20: '[DC4]',    // Device Control 4
        21: '[NAK]',    // Negative Acknowledge
        22: '[SYN]',    // Synchronous Idle
        23: '[ETB]',    // End of Transmission Block
        24: '[CAN]',    // Cancel
        25: '[EM]',     // End of Medium
        26: '[SUB]',    // Substitute
        27: '[ESC]',    // Escape
        28: '[FS]',     // File Separator
        29: '[GS]',     // Group Separator
        30: '[RS]',     // Record Separator
        31: '[US]',     // Unit Separator
        127: '[DEL]',   // Delete
        160: '[NBSP]',  // Non-breaking space
        255: '[FF]'     // Form Feed (alternatif)
    };
    
    return controlChars[byte] || `[${byte.toString(16).toUpperCase().padStart(2, '0')}]`;
};

// Byte değerini belirli formata çevirme (HTML ile birlikte)
export const convertValue = (byte, type, includeHtml = false) => {
    if (isNaN(byte)) return '';
    switch (type) {
        case 'hex':
            return byte.toString(16).toUpperCase().padStart(2, '0');
        case 'ascii':
            // Görsel gösterim sistemi
            // Kontrol karakterleri (0-31, 127, 160)
            if ((byte >= 0 && byte <= 31) || byte === 127 || byte === 160) {
                const display = getControlCharDisplay(byte);
                const hexValue = byte.toString(16).toUpperCase().padStart(2, '0');
                const title = byte === 0 ? 'Null karakter' : 
                            byte === 9 ? 'Tab karakteri' :
                            byte === 10 ? 'Line Feed' :
                            byte === 13 ? 'Carriage Return' :
                            byte === 27 ? 'Escape' :
                            byte === 127 ? 'Delete' :
                            byte === 160 ? 'Non-breaking space' :
                            'Kontrol karakteri';
                
                return includeHtml ? `<span class="control-char" title="${title} (0x${hexValue})">${display}</span>` : display;
            }
            
            // Görünür ASCII karakterleri (32-126)
            if (byte >= 32 && byte <= 126) {
                return String.fromCharCode(byte);
            }
            
            // Genişletilmiş ASCII (128-255) - özel karakterler
            if (byte >= 128 && byte <= 255) {
                // Önce gerçek karakteri dene
                const char = String.fromCharCode(byte);
                // Eğer görünür bir karakter ise göster
                if (char && char.trim() !== '') {
                    return char;
                }
                // Değilse hex gösterimi ile göster
                const display = `[${byte.toString(16).toUpperCase().padStart(2, '0')}]`;
                return includeHtml ? `<span class="extended-char" title="Genişletilmiş ASCII (0x${byte.toString(16).toUpperCase().padStart(2, '0')})">${display}</span>` : display;
            }
            
            const display = `[${byte.toString(16).toUpperCase().padStart(2, '0')}]`;
            return includeHtml ? `<span class="extended-char" title="Bilinmeyen karakter (0x${byte.toString(16).toUpperCase().padStart(2, '0')})">${display}</span>` : display;
        case 'decimal':
            return byte.toString(10);
        case 'binary':
            return byte.toString(2).padStart(8, '0');
        default:
            return '';
    }
};

// Akıllı kopyalama - sondan başlayıp ilk geçerli karaktere kadar git
export const getSmartCopyData = (data, type) => {
    const values = Array.from(data).map(byte => convertValue(byte, type));
    
    // Sondan başlayıp ilk geçerli karakteri bul
    let endIndex = values.length - 1;
    
    // ASCII için: boş olmayan karakterleri bul
    if (type === 'ascii') {
        while (endIndex >= 0 && values[endIndex] === '') {
            endIndex--;
        }
    } else {
        // Diğer formatlar için: boş olmayan değerleri bul
        while (endIndex >= 0 && values[endIndex] === '') {
            endIndex--;
        }
    }
    
    // Eğer hiç geçerli karakter yoksa, tüm veriyi döndür
    if (endIndex < 0) {
        return values;
    }
    
    // İlk geçerli karakterden sona kadar olan kısmı döndür
    return values.slice(0, endIndex + 1);
};


// Data analysis functions
export const analyzeData = (data) => {
    const bytes = Array.from(data);
    const nonZeroBytes = bytes.filter(byte => byte !== 0);
    const uniqueBytes = new Set(bytes).size;
    
    // Calculate entropy
    const entropy = calculateEntropy(bytes);
    
    // Find most frequent bytes
    const frequency = getByteFrequency(bytes);
    const mostFrequent = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([byte, count]) => `0x${parseInt(byte).toString(16).toUpperCase().padStart(2, '0')} (${count})`);
    
    // Pattern detection
    const patterns = detectPatterns(bytes);
    
    return {
        totalBytes: bytes.length,
        nonZeroBytes: nonZeroBytes.length,
        uniqueBytes,
        entropy: entropy.toFixed(2),
        mostFrequent,
        patterns
    };
};

// Calculate Shannon entropy
export const calculateEntropy = (bytes) => {
    if (bytes.length === 0) return 0;
    
    const frequency = {};
    bytes.forEach(byte => {
        frequency[byte] = (frequency[byte] || 0) + 1;
    });
    
    let entropy = 0;
    const length = bytes.length;
    
    Object.values(frequency).forEach(count => {
        const probability = count / length;
        entropy -= probability * Math.log2(probability);
    });
    
    return entropy;
};

// Get byte frequency map
export const getByteFrequency = (bytes) => {
    const frequency = {};
    bytes.forEach(byte => {
        frequency[byte] = (frequency[byte] || 0) + 1;
    });
    return frequency;
};

// Detect patterns in data
export const detectPatterns = (bytes) => {
    let repeats = 0;
    let sequences = 0;
    let asciiChars = 0;
    let controlChars = 0;
    
    // Count ASCII and control characters
    bytes.forEach(byte => {
        if (byte >= 32 && byte <= 126) {
            asciiChars++;
        } else if (byte < 32 || byte === 127) {
            controlChars++;
        }
    });
    
    // Detect repeating patterns
    for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === bytes[i + 1]) {
            repeats++;
        }
    }
    
    // Detect sequences (consecutive increasing/decreasing)
    for (let i = 0; i < bytes.length - 2; i++) {
        const diff1 = bytes[i + 1] - bytes[i];
        const diff2 = bytes[i + 2] - bytes[i + 1];
        if (Math.abs(diff1) === 1 && diff1 === diff2) {
            sequences++;
        }
    }
    
    return {
        repeats,
        sequences,
        asciiChars,
        controlChars
    };
};

// 4 in 1 Mode Functions
export const parseTextToBytes = (text, format, delimiter = ' ') => {
    const bytes = [];
    
    // Handle empty text
    if (!text || text.trim() === '') {
        return bytes;
    }
    
    switch (format) {
        case 'ascii':
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i);
                if (charCode >= 0 && charCode <= 255) {
                    bytes.push(charCode);
                }
            }
            break;
            
        case 'hex':
            let hexValues;
            if (delimiter === '') {
                // No delimiter - split into pairs
                hexValues = [];
                const cleanText = text.replace(/\s+/g, ''); // Remove all whitespace
                for (let i = 0; i < cleanText.length; i += 2) {
                    const hexPair = cleanText.substring(i, i + 2);
                    if (hexPair.length === 2) {
                        hexValues.push(hexPair);
                    }
                }
            } else {
                hexValues = text.split(delimiter).filter(val => val.trim() !== '');
            }
            hexValues.forEach(hex => {
                const cleanHex = hex.replace(/^0x/i, '').trim().toUpperCase();
                if (/^[0-9A-F]{1,2}$/.test(cleanHex)) {
                    const value = parseInt(cleanHex, 16);
                    if (value >= 0 && value <= 255) {
                        bytes.push(value);
                    }
                }
            });
            break;
            
        case 'decimal':
            const decValues = text.split(delimiter).filter(val => val.trim() !== '');
            decValues.forEach(dec => {
                const num = parseInt(dec.trim(), 10);
                if (!isNaN(num) && num >= 0 && num <= 255) {
                    bytes.push(num);
                }
            });
            break;
            
        case 'binary':
            const binValues = text.split(delimiter).filter(val => val.trim() !== '');
            binValues.forEach(bin => {
                const cleanBin = bin.trim();
                if (/^[01]{1,8}$/.test(cleanBin)) {
                    const value = parseInt(cleanBin, 2);
                    if (value >= 0 && value <= 255) {
                        bytes.push(value);
                    }
                }
            });
            break;
    }
    
    return bytes;
};

export const formatBytesToText = (bytes, format, delimiter = ' ') => {
    // Ensure bytes is an array-like object
    const byteArray = Array.isArray(bytes) ? bytes : Array.from(bytes);
    
    switch (format) {
        case 'ascii':
            return byteArray.map(byte => {
                // Ensure byte is a number
                const numByte = Number(byte);
                return convertValue(numByte, 'ascii');
            }).join('');
            
        case 'hex':
            return byteArray.map(byte => {
                const numByte = Number(byte);
                return numByte.toString(16).toUpperCase().padStart(2, '0');
            }).join(delimiter);
            
        case 'decimal':
            return byteArray.map(byte => {
                const numByte = Number(byte);
                return numByte.toString();
            }).join(delimiter);
            
        case 'binary':
            return byteArray.map(byte => {
                const numByte = Number(byte);
                return numByte.toString(2).padStart(8, '0');
            }).join(delimiter);
            
        default:
            return '';
    }
};

export const getDelimiter = (delimiterOption, customDelimiter = '') => {
    switch (delimiterOption) {
        case 'none':
            return '';
        case 'comma':
            return ',';
        case 'space':
            return ' ';
        case 'custom':
            return customDelimiter;
        default:
            return ' ';
    }
};

