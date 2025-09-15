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
            return /^[0-9a-fA-F]{1,2}$/.test(value);
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

// Byte değerini belirli formata çevirme
export const convertValue = (byte, type) => {
    if (isNaN(byte)) return '';
    switch (type) {
        case 'hex':
            return byte.toString(16).toUpperCase().padStart(2, '0');
        case 'ascii':
            if (byte === 13) return 'CR'; // Carriage Return
            if (byte === 10) return 'LF'; // Line Feed
            if (byte === 0) return ''; // 0 için boş göster
            return (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '';
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
        while (endIndex >= 0 && (values[endIndex] === '' || values[endIndex] === '0')) {
            endIndex--;
        }
    } else {
        // Diğer formatlar için: 0 olmayan değerleri bul
        while (endIndex >= 0 && (values[endIndex] === '0' || values[endIndex] === '00' || values[endIndex] === '00000000')) {
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

// Advanced copy format functions
export const getCopyDataInFormat = (data, format) => {
    const smartData = getSmartCopyData(data, 'hex');
    const bytes = smartData.map(hex => parseInt(hex, 16));
    
    switch (format) {
        case 'hex':
            return smartData.join(' ');
            
        case 'c-array':
            const cArray = bytes.map(byte => `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`).join(', ');
            return `uint8_t data[] = { ${cArray} };`;
            
        case 'python':
            const pythonBytes = bytes.map(byte => `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`).join(', ');
            return `data = bytes([${pythonBytes}])`;
            
        case 'javascript':
            const jsArray = bytes.map(byte => byte.toString()).join(', ');
            return `const data = new Uint8Array([${jsArray}]);`;
            
        case 'base64':
            const binaryString = bytes.map(byte => String.fromCharCode(byte)).join('');
            return btoa(binaryString);
            
        case 'ascii':
            return bytes.map(byte => String.fromCharCode(byte)).join('');
            
        default:
            return smartData.join(' ');
    }
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
                const cleanHex = hex.replace(/^0x/i, '').trim();
                if (/^[0-9a-fA-F]{1,2}$/i.test(cleanHex)) {
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
                if (numByte === 13) return 'CR';
                if (numByte === 10) return 'LF';
                if (numByte === 0) return '';
                return (numByte >= 32 && numByte <= 126) ? String.fromCharCode(numByte) : '';
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

// Export/Import Functions
export const exportToJSON = (data) => {
    const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: Array.from(data),
        metadata: {
            totalBytes: data.length,
            nonZeroBytes: Array.from(data).filter(byte => byte !== 0).length
        }
    };
    return JSON.stringify(exportData, null, 2);
};

export const exportToCSV = (data) => {
    const headers = ['Index', 'Hex', 'Decimal', 'Binary', 'ASCII'];
    const rows = [headers.join(',')];
    
    for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        const hex = byte.toString(16).toUpperCase().padStart(2, '0');
        const decimal = byte.toString();
        const binary = byte.toString(2).padStart(8, '0');
        const ascii = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '';
        
        rows.push([i, hex, decimal, binary, ascii].join(','));
    }
    
    return rows.join('\n');
};

export const exportToBase64 = (data) => {
    const binaryString = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
};

export const exportToURLEncoded = (data) => {
    const binaryString = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
    return encodeURIComponent(binaryString);
};

export const importFromJSON = (jsonString) => {
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.data && Array.isArray(parsed.data)) {
            return new Uint8Array(parsed.data);
        }
        throw new Error('Invalid JSON format');
    } catch (error) {
        throw new Error('Failed to parse JSON: ' + error.message);
    }
};

export const importFromBase64 = (base64String) => {
    try {
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (error) {
        throw new Error('Failed to decode Base64: ' + error.message);
    }
};

export const importFromURLEncoded = (urlString) => {
    try {
        const decoded = decodeURIComponent(urlString);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
        }
        return bytes;
    } catch (error) {
        throw new Error('Failed to decode URL: ' + error.message);
    }
};

// Template Functions
export const getTemplateData = (templateName) => {
    switch (templateName) {
        case 'empty':
            return new Uint8Array(256).fill(0);
            
        case 'hello':
            const helloText = 'Hello, World!';
            const helloBytes = new Uint8Array(256);
            for (let i = 0; i < helloText.length; i++) {
                helloBytes[i] = helloText.charCodeAt(i);
            }
            return helloBytes;
            
        case 'numbers':
            const numbersBytes = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                numbersBytes[i] = i;
            }
            return numbersBytes;
            
        case 'random':
            const randomBytes = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                randomBytes[i] = Math.floor(Math.random() * 256);
            }
            return randomBytes;
            
        default:
            return new Uint8Array(256).fill(0);
    }
};
