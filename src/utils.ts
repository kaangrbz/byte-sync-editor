/**
 * ByteSync Editor - Utility Fonksiyonları
 * Test edilebilir utility fonksiyonları
 */

import type { GridFormat, DataAnalysisResult, DelimiterOption } from './types/index.js';

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

// Kontrol karakterleri için görsel gösterim mapping'i - artık sadece direkt karakter
const getControlCharDisplay = (byte: number): string => {
    // Tüm karakterleri direkt göster
    return String.fromCharCode(byte);
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

// Utilities
const isPrintableAscii = (n: number): boolean => n >= 0x20 && n <= 0x7E;

// BigInt -> minimal big-endian byte array
const bigintToBytesBE = (nBigInt: bigint): number[] => {
  if (nBigInt === 0n) return [0];
  const out: number[] = [];
  let v = nBigInt < 0n ? -nBigInt : nBigInt;
  while (v > 0n) {
    out.unshift(Number(v & 0xFFn));
    v >>= 8n;
  }
  return out;
};

// Basit ve anlaşılır input parser
// Tek hücre input için optimize edilmiş, paste işlemleri için de destekler
export const parseTextToBytes = (text: string | null | undefined, format: GridFormat): number[] => {
  if (!text) return [];
  
  // ASCII için trim kullanma, diğer formatlar için trim kullan
  const input = format === 'ascii' ? String(text) : String(text).trim();
  if (input === '') return [];
  
  const result: number[] = [];

  switch (format) {
    case 'ascii':
      // Unicode/UTF-8: Tüm karakterleri UTF-8 encoding ile byte dizisine çevir
      // TextEncoder kullanarak tüm Unicode karakterlerini (Türkçe, Çince, Arapça vb.) destekle
      try {
        const encoder = new TextEncoder();
        const utf8Bytes = encoder.encode(input);
        result.push(...Array.from(utf8Bytes));
      } catch (e) {
        // Fallback: Eğer TextEncoder desteklenmiyorsa eski yöntemi kullan
        for (let i = 0; i < input.length; i++) {
          const codePoint = input.codePointAt(i);
          if (codePoint !== undefined) {
            if (codePoint < 0x80) {
              // 1 byte: 0xxxxxxx
              result.push(codePoint);
            } else if (codePoint < 0x800) {
              // 2 bytes: 110xxxxx 10xxxxxx
              result.push(0xC0 | (codePoint >> 6));
              result.push(0x80 | (codePoint & 0x3F));
            } else if (codePoint < 0xD800 || codePoint >= 0xE000) {
              // 3 bytes: 1110xxxx 10xxxxxx 10xxxxxx (BMP karakterler)
              result.push(0xE0 | (codePoint >> 12));
              result.push(0x80 | ((codePoint >> 6) & 0x3F));
              result.push(0x80 | (codePoint & 0x3F));
            } else {
              // 4 bytes: Surrogate pair (UTF-16)
              i++; // Bir sonraki karakteri de oku
              if (i < input.length) {
                const low = input.codePointAt(i);
                if (low !== undefined && low >= 0xDC00 && low < 0xE000) {
                  const fullCodePoint = 0x10000 + (((codePoint & 0x3FF) << 10) | (low & 0x3FF));
                  result.push(0xF0 | (fullCodePoint >> 18));
                  result.push(0x80 | ((fullCodePoint >> 12) & 0x3F));
                  result.push(0x80 | ((fullCodePoint >> 6) & 0x3F));
                  result.push(0x80 | (fullCodePoint & 0x3F));
                }
              }
            }
            // Surrogate pair ise bir sonraki karakteri atla
            if (codePoint >= 0xD800 && codePoint < 0xDC00) {
              // Zaten yukarıda i++ yaptık
            } else if (codePoint > 0xFFFF) {
              // 4 byte karakter, bir sonraki karakteri atla
              i++;
            }
          }
        }
      }
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
        // Tek hücre input için optimize: direkt parse et (maksimum 3 karakter, 0-255)
        if (input.length <= 3 && /^\d+$/.test(input)) {
          const num = parseInt(input, 10);
          if (!isNaN(num) && num >= 0 && num <= 255) {
            result.push(num);
          }
        } else {
          // Paste işlemi için: Boşluk, virgül ile ayrılmış sayıları işle
          const decParts = input.split(/[,\s]+/).filter(part => part.trim() !== '');
          
          for (const part of decParts) {
            const num = parseInt(part.trim(), 10);
            if (!isNaN(num) && num >= 0 && num <= 255) {
              result.push(num);
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
  delimiter: string = ' '
): string => {
  if (!bytes || (!Array.isArray(bytes) && !(bytes instanceof Uint8Array) && typeof (bytes as any)[Symbol.iterator] !== 'function')) {
    return '';
  }
  const arr = Array.isArray(bytes) ? bytes : Array.from(bytes);

  switch (format) {
    case 'ascii':
      // Unicode/UTF-8: Byte dizisini UTF-8 decoding ile Unicode string'e çevir
      // TextDecoder kullanarak tüm Unicode karakterlerini (Türkçe, Çince, Arapça vb.) destekle
      try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const uint8Array = new Uint8Array(arr.map(b => Number(b) & 0xFF));
        return decoder.decode(uint8Array);
      } catch (e) {
        // Fallback: Eğer TextDecoder desteklenmiyorsa veya geçersiz UTF-8 ise
        // Geçerli UTF-8 byte dizilerini manuel olarak decode et
        const bytes = arr.map(b => Number(b) & 0xFF);
        let result = '';
        let i = 0;
        
        while (i < bytes.length) {
          const byte1 = bytes[i];
          
          if (byte1 < 0x80) {
            // 1 byte: 0xxxxxxx
            result += String.fromCharCode(byte1);
            i++;
          } else if ((byte1 & 0xE0) === 0xC0 && i + 1 < bytes.length) {
            // 2 bytes: 110xxxxx 10xxxxxx
            const byte2 = bytes[i + 1];
            if ((byte2 & 0xC0) === 0x80) {
              const codePoint = ((byte1 & 0x1F) << 6) | (byte2 & 0x3F);
              result += String.fromCodePoint(codePoint);
              i += 2;
            } else {
              // Geçersiz UTF-8, raw byte göster
              result += String.fromCharCode(byte1);
              i++;
            }
          } else if ((byte1 & 0xF0) === 0xE0 && i + 2 < bytes.length) {
            // 3 bytes: 1110xxxx 10xxxxxx 10xxxxxx
            const byte2 = bytes[i + 1];
            const byte3 = bytes[i + 2];
            if ((byte2 & 0xC0) === 0x80 && (byte3 & 0xC0) === 0x80) {
              const codePoint = ((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F);
              result += String.fromCodePoint(codePoint);
              i += 3;
            } else {
              // Geçersiz UTF-8, raw byte göster
              result += String.fromCharCode(byte1);
              i++;
            }
          } else if ((byte1 & 0xF8) === 0xF0 && i + 3 < bytes.length) {
            // 4 bytes: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
            const byte2 = bytes[i + 1];
            const byte3 = bytes[i + 2];
            const byte4 = bytes[i + 3];
            if ((byte2 & 0xC0) === 0x80 && (byte3 & 0xC0) === 0x80 && (byte4 & 0xC0) === 0x80) {
              const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
              result += String.fromCodePoint(codePoint);
              i += 4;
            } else {
              // Geçersiz UTF-8, raw byte göster
              result += String.fromCharCode(byte1);
              i++;
            }
          } else {
            // Geçersiz UTF-8 veya tek byte, raw byte göster
            result += String.fromCharCode(byte1);
            i++;
          }
        }
        
        return result;
      }

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

