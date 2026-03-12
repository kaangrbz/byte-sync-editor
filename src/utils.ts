/**
 * ByteSync Editor - Utility Fonksiyonları
 * Test edilebilir utility fonksiyonları
 */

import type { GridFormat, DataAnalysisResult, DelimiterOption } from './types/index.js';
import type { TextEncoding } from './settings.js';

// ─── ISO-8859-9 (Windows-1254 compatible) encode/decode ────────────────────────

// Her karakter kendi code point'indedir (0x00–0xFF), sadece 0xD0–0xFF arası
// Latin-5 özel karakterleri içerir. Burada Latin-5'in 128–255 aralığını saklarız.
// Kaynak: https://en.wikipedia.org/wiki/ISO/IEC_8859-9
const ISO8859_9_HIGH: readonly string[] = [
  '\u0080', '\u0081', '\u0082', '\u0083', '\u0084', '\u0085', '\u0086', '\u0087',
  '\u0088', '\u0089', '\u008A', '\u008B', '\u008C', '\u008D', '\u008E', '\u008F',
  '\u0090', '\u0091', '\u0092', '\u0093', '\u0094', '\u0095', '\u0096', '\u0097',
  '\u0098', '\u0099', '\u009A', '\u009B', '\u009C', '\u009D', '\u009E', '\u009F',
  '\u00A0', '\u00A1', '\u00A2', '\u00A3', '\u00A4', '\u00A5', '\u00A6', '\u00A7',
  '\u00A8', '\u00A9', '\u00AA', '\u00AB', '\u00AC', '\u00AD', '\u00AE', '\u00AF',
  '\u00B0', '\u00B1', '\u00B2', '\u00B3', '\u00B4', '\u00B5', '\u00B6', '\u00B7',
  '\u00B8', '\u00B9', '\u00BA', '\u00BB', '\u00BC', '\u00BD', '\u00BE', '\u00BF',
  '\u00C0', '\u00C1', '\u00C2', '\u00C3', '\u00C4', '\u00C5', '\u00C6', '\u00C7',
  '\u00C8', '\u00C9', '\u00CA', '\u00CB', '\u00CC', '\u00CD', '\u00CE', '\u00CF',
  '\u011E', '\u00D1', '\u00D2', '\u00D3', '\u00D4', '\u00D5', '\u00D6', '\u00D7',
  '\u00D8', '\u00D9', '\u00DA', '\u00DB', '\u00DC', '\u0130', '\u015E', '\u00DF',
  '\u00E0', '\u00E1', '\u00E2', '\u00E3', '\u00E4', '\u00E5', '\u00E6', '\u00E7',
  '\u00E8', '\u00E9', '\u00EA', '\u00EB', '\u00EC', '\u00ED', '\u00EE', '\u00EF',
  '\u011F', '\u00F1', '\u00F2', '\u00F3', '\u00F4', '\u00F5', '\u00F6', '\u00F7',
  '\u00F8', '\u00F9', '\u00FA', '\u00FB', '\u00FC', '\u0131', '\u015F', '\u00FF',
];

// Unicode code point → ISO-8859-9 byte (sadece yüksek yarı için)
const UNICODE_TO_ISO8859_9: Map<number, number> = new Map(
  ISO8859_9_HIGH.map((char, i) => [char.codePointAt(0)!, i + 0x80])
);

function encodeISO88599(text: string): number[] {
  const result: number[] = [];

  for (const char of text) {
    const cp = char.codePointAt(0)!;

    if (cp < 0x80) {
      result.push(cp);
      continue;
    }

    const byte = UNICODE_TO_ISO8859_9.get(cp);

    if (byte !== undefined) {
      result.push(byte);
    } else {
      result.push(0x3F); // '?' — eşleşme yoksa
    }
  }

  return result;
}

function decodeISO88599(bytes: number[]): string {
  let result = '';

  for (const byte of bytes) {
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
    } else {
      result += ISO8859_9_HIGH[byte - 0x80] ?? '\uFFFD';
    }
  }

  return result;
}

// ─── Encoding-aware encode/decode ──────────────────────────────────────────────

export function encodeText(text: string, encoding: TextEncoding = 'utf-8'): number[] {
  if (encoding === 'iso-8859-9') {
    return encodeISO88599(text);
  }

  try {
    return Array.from(new TextEncoder().encode(text));
  } catch {
    return [];
  }
}

export function decodeBytes(bytes: number[], encoding: TextEncoding = 'utf-8'): string {
  if (encoding === 'iso-8859-9') {
    return decodeISO88599(bytes);
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(new Uint8Array(bytes.map(b => b & 0xFF)));
  } catch {
    return '';
  }
}

// Input türüne göre maksimum karakter sayısını döndür
export const getMaxLengthForType = (type: GridFormat): number => {
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

// Akıllı kopyalama - sondan başlayıp ilk geçerli karaktere kadar git
export const getSmartCopyData = (data: Uint8Array | number[], type: GridFormat): string[] => {
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

// Calculate Shannon entropy
export const calculateEntropy = (bytes: number[]): number => {
    if (bytes.length === 0) return 0;
    
    const frequency: Record<number, number> = {};
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
export const getByteFrequency = (bytes: number[]): Record<number, number> => {
    const frequency: Record<number, number> = {};
    bytes.forEach(byte => {
        frequency[byte] = (frequency[byte] || 0) + 1;
    });
    return frequency;
};

// Detect patterns in data
export const detectPatterns = (bytes: number[]): {
    repeats: number;
    sequences: number;
    asciiChars: number;
    controlChars: number;
} => {
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

// Data analysis functions
export const analyzeData = (data: Uint8Array | number[]): DataAnalysisResult => {
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
        .map(([byte, count]) => `0x${parseInt(byte, 10).toString(16).toUpperCase().padStart(2, '0')} (${count})`);
    
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

// Basit ve anlaşılır input parser
// Tek hücre input için optimize edilmiş, paste işlemleri için de destekler
export const parseTextToBytes = (
  text: string | null | undefined,
  format: GridFormat,
  encoding: TextEncoding = 'utf-8',
): number[] => {
  if (!text) return [];

  const input = format === 'ascii' ? String(text) : String(text).trim();
  if (input === '') return [];

  const result: number[] = [];

  switch (format) {
    case 'ascii':
      result.push(...encodeText(input, encoding));
      break;

    case 'hex':
      {
        // Tek hücre input için optimize: direkt parse et (maksimum 2 karakter)
        if (input.length <= 2 && /^[0-9a-fA-F]+$/.test(input)) {
          // Tek hücre input - direkt parse
          const padded = input.length === 1 ? '0' + input : input;
          const byteValue = parseInt(padded, 16);
          if (!isNaN(byteValue)) {
            result.push(byteValue & 0xFF);
          }
        } else {
          // Paste işlemi için: Virgül, boşluk, noktalı virgül ile ayrılmış değerleri işle
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
                const hexPair = padded.substring(i, i + 2);
                const byteValue = parseInt(hexPair, 16);
                if (!isNaN(byteValue)) {
                  result.push(byteValue & 0xFF);
                }
              }
            }
          }
        }
      }
      break;

    case 'decimal':
      {
        if (input.length <= 3 && /^\d+$/.test(input)) {
          const num = parseInt(input, 10);
          if (!isNaN(num) && num >= 0 && num <= 255) {
            result.push(num);
          }
        } else {
          const decParts = input.split(/[,;\s]+/).filter(p => p.trim() !== '');

          for (const part of decParts) {
            const cleaned = part.trim();
            if (!/^\d+$/.test(cleaned)) continue;

            if (cleaned.length <= 3) {
              const num = parseInt(cleaned, 10);
              if (!isNaN(num) && num >= 0 && num <= 255) {
                result.push(num);
                continue;
              }
            }

            // Greedy parsing: 3 hane -> 2 hane -> 1 hane dene (delimiter-siz girdi)
            let j = 0;
            while (j < cleaned.length) {
              let found = false;
              for (let len = 3; len >= 1; len--) {
                if (j + len > cleaned.length) continue;
                const chunk = cleaned.substring(j, j + len);
                const num = parseInt(chunk, 10);
                if (!isNaN(num) && num >= 0 && num <= 255) {
                  result.push(num);
                  j += len;
                  found = true;
                  break;
                }
              }
              if (!found) { j++; }
            }
          }
        }
      }
      break;

    case 'binary':
      {
        // Tek hücre input için optimize: direkt parse et (maksimum 8 karakter)
        if (input.length <= 8 && /^[01]+$/.test(input)) {
          // Tek hücre input - direkt parse (8 karaktere kadar)
          const padded = input.padStart(8, '0');
          const byteValue = parseInt(padded, 2);
          if (!isNaN(byteValue)) {
            result.push(byteValue & 0xFF);
          }
        } else {
          // Paste işlemi için: 0/1 karakterlerini 8'li gruplar halinde işle
          const binaryStr = input.replace(/[^01]/g, '');
          
          // 8'li gruplar halinde böl
          for (let i = 0; i < binaryStr.length; i += 8) {
            const binaryGroup = binaryStr.substring(i, i + 8);
            if (binaryGroup.length === 8) {
              const byteValue = parseInt(binaryGroup, 2);
              if (!isNaN(byteValue)) {
                result.push(byteValue);
              }
            }
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
export const formatBytesToText = (
  bytes: Uint8Array | number[] | ArrayLike<number>,
  format: GridFormat,
  delimiter: string = ' ',
  encoding: TextEncoding = 'utf-8',
): string => {
  if (!bytes || (!Array.isArray(bytes) && !(bytes instanceof Uint8Array) && typeof (bytes as any)[Symbol.iterator] !== 'function')) {
    return '';
  }
  const arr = Array.isArray(bytes) ? bytes : Array.from(bytes);

  switch (format) {
    case 'ascii':
      return decodeBytes(arr.map(b => Number(b) & 0xFF), encoding);

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

export const getDelimiter = (delimiterOption: DelimiterOption, customDelimiter: string = ''): string => {
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

// Sadece görünmeyen ASCII karakterleri için özel display fonksiyonu
export const getInvisibleAsciiDisplay = (value: number): string => {
  // Sadece kontrol karakterleri (görünmeyen karakterler)
  const controlCharNames: Record<number, string> = {
    0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
    8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
    16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
    24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
    127: 'DEL'
  };
  
  // Sadece kontrol karakteri ise özel isim göster
  if (controlCharNames[value]) {
    return `<span style="font-weight: bold; font-size: 0.9em; color: #666; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">${controlCharNames[value]}</span>`;
  }
  
  // Diğer tüm karakterler normal gösterim
  const asciiChar = formatBytesToText([value], 'ascii', '');
  return `<span style="font-weight: bold; font-size: 1.1em;">${asciiChar}</span>`;
};

