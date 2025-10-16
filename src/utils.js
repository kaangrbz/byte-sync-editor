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


// Kontrol karakterleri için görsel gösterim mapping'i - artık sadece direkt karakter
const getControlCharDisplay = (byte) => {
    // Tüm karakterleri direkt göster
    return String.fromCharCode(byte);
};


// Akıllı kopyalama - sondan başlayıp ilk geçerli karaktere kadar git
export const getSmartCopyData = (data, type) => {
    const values = formatBytesToText(data, type, ' ').split(' ');
    
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

// Utilities
const isPrintableAscii = n => n >= 0x20 && n <= 0x7E;

// BigInt -> minimal big-endian byte array
const bigintToBytesBE = (nBigInt) => {
  if (nBigInt === 0n) return [0];
  const out = [];
  let v = nBigInt < 0n ? -nBigInt : nBigInt;
  while (v > 0n) {
    out.unshift(Number(v & 0xFFn));
    v >>= 8n;
  }
  return out;
};

// Basit ve anlaşılır input parser
export const parseTextToBytes = (text, format) => {
  if (!text || text.trim() === '') return [];
  const input = String(text).trim();
  const result = [];

  switch (format) {
    case 'ascii':
      // ASCII: Her karakteri byte değerine çevir
      for (let i = 0; i < input.length; i++) {
        result.push(input.charCodeAt(i) & 0xFF);
      }
      break;

    case 'hex':
      // HEX: Virgül, boşluk, noktalı virgül ile ayrılmış değerleri işle
      const hexParts = input.split(/[,\s;]+/).filter(part => part.trim() !== '');
      
      for (const part of hexParts) {
        const cleanHex = part.trim().replace(/[^0-9a-fA-F]/g, '');
        if (cleanHex) {
          // 0x prefix varsa kaldır
          const hexValue = cleanHex.replace(/^0x/i, '');
          
          // Tek karakter ise 0 ile başlat
          const padded = hexValue.length % 2 ? '0' + hexValue : hexValue;
          
          // 2'şer karakter grupla
          for (let i = 0; i < padded.length; i += 2) {
            const hexPair = padded.substr(i, 2);
            const byteValue = parseInt(hexPair, 16);
            if (!isNaN(byteValue)) {
              result.push(byteValue & 0xFF);
            }
          }
        }
      }
      break;

    case 'decimal':
      // DECIMAL: Boşluk, virgül ile ayrılmış sayıları işle
      const decParts = input.split(/[,\s]+/).filter(part => part.trim() !== '');
      
      for (const part of decParts) {
        const num = parseInt(part.trim(), 10);
        if (!isNaN(num) && num >= 0 && num <= 255) {
          result.push(num);
        }
      }
      break;

    case 'binary':
      // BINARY: 0/1 karakterlerini 8'li gruplar halinde işle
      const binaryStr = input.replace(/[^01]/g, '');
      
      // 8'li gruplar halinde böl
      for (let i = 0; i < binaryStr.length; i += 8) {
        const binaryGroup = binaryStr.substr(i, 8);
        if (binaryGroup.length === 8) {
          const byteValue = parseInt(binaryGroup, 2);
          if (!isNaN(byteValue)) {
            result.push(byteValue);
          }
        }
      }
      break;

    default:
      break;
  }

  return result;
};


// Format bytes -> text
export const formatBytesToText = (bytes, format, delimiter = ' ') => {
  if (!Array.isArray(bytes) && !(bytes && typeof bytes[Symbol.iterator] === 'function')) return '';
  const arr = Array.isArray(bytes) ? bytes : Array.from(bytes);

  switch (format) {
    case 'ascii':
      return arr.map(b => {
        const n = Number(b) & 0xFF;
        // Tüm karakterleri direkt göster, [xx] formatı yok
        return String.fromCharCode(n);
      }).join('');

    case 'hex':
      return arr.map(b => (Number(b) & 0xFF).toString(16).toUpperCase().padStart(2, '0')).join(delimiter);

    case 'decimal':
      return arr.map(b => String(Number(b) & 0xFF)).join(delimiter);

    case 'binary':
      return arr.map(b => (Number(b) & 0xFF).toString(2).padStart(8, '0')).join(delimiter);

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

