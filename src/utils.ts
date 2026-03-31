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

export type ConversionMode = 'character' | 'byte';

const splitTokens = (text: string): string[] => {
  return text.split(/[,\s;]+/).map(token => token.trim()).filter(token => token !== '');
};

const parseByteMode = (text: string, format: GridFormat): number[] => {
  const result: number[] = [];

  switch (format) {
    case 'ascii':
      try {
        const encoder = new TextEncoder();
        result.push(...Array.from(encoder.encode(text)));
      } catch {
        for (let i = 0; i < text.length; i++) {
          result.push(text.charCodeAt(i) & 0xFF);
        }
      }
      return result;
    case 'hex':
      splitTokens(text).forEach(token => {
        const normalizedToken = token.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '');
        if (normalizedToken === '') {
          return;
        }
        const paddedToken = normalizedToken.length % 2 === 1 ? `0${normalizedToken}` : normalizedToken;
        for (let i = 0; i < paddedToken.length; i += 2) {
          const value = parseInt(paddedToken.slice(i, i + 2), 16);
          if (!isNaN(value)) {
            result.push(value & 0xFF);
          }
        }
      });
      return result;
    case 'decimal':
      splitTokens(text).forEach(token => {
        const value = parseInt(token, 10);
        if (!isNaN(value) && value >= 0 && value <= 255) {
          result.push(value);
        }
      });
      return result;
    case 'binary':
      splitTokens(text).forEach(token => {
        const normalizedToken = token.replace(/[^01]/g, '');
        if (normalizedToken === '') {
          return;
        }
        const paddedToken = normalizedToken.padStart(8, '0');
        const value = parseInt(paddedToken, 2);
        if (!isNaN(value)) {
          result.push(value & 0xFF);
        }
      });
      return result;
    default:
      return result;
  }
};

const parseCharacterMode = (text: string, format: GridFormat): number[] => {
  switch (format) {
    case 'ascii':
      return Array.from(text).map(char => char.codePointAt(0)).filter((value): value is number => value !== undefined);
    case 'hex':
      return splitTokens(text).map(token => token.replace(/^0x/i, '')).map(token => parseInt(token, 16)).filter(value => !isNaN(value));
    case 'decimal':
      return splitTokens(text).map(token => parseInt(token, 10)).filter(value => !isNaN(value));
    case 'binary':
      return splitTokens(text).map(token => parseInt(token, 2)).filter(value => !isNaN(value));
    default:
      return [];
  }
};

export const parseTextToBytes = (
  text: string | null | undefined,
  format: GridFormat,
  mode: ConversionMode = 'character'
): number[] => {
  if (!text) {
    return [];
  }

  const input = format === 'ascii' ? String(text) : String(text).trim();
  if (input === '') {
    return [];
  }

  if (mode === 'byte') {
    return parseByteMode(input, format);
  }

  return parseCharacterMode(input, format);
};

const formatByteMode = (values: number[], format: GridFormat, delimiter: string): string => {
  switch (format) {
    case 'ascii':
      try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        return decoder.decode(new Uint8Array(values.map(value => Number(value) & 0xFF)));
      } catch {
        return values.map(value => String.fromCharCode(Number(value) & 0xFF)).join('');
      }
    case 'hex':
      return values.map(value => (Number(value) & 0xFF).toString(16).toUpperCase().padStart(2, '0')).join(delimiter);
    case 'decimal':
      return values.map(value => String(Number(value) & 0xFF)).join(delimiter);
    case 'binary':
      return values.map(value => (Number(value) & 0xFF).toString(2).padStart(8, '0')).join(delimiter);
    default:
      return '';
  }
};

const formatCharacterMode = (values: number[], format: GridFormat, delimiter: string): string => {
  switch (format) {
    case 'ascii':
      return values.map(value => String.fromCodePoint(Math.max(0, Number(value) || 0))).join('');
    case 'hex':
      return values.map(value => (Number(value) >>> 0).toString(16).toUpperCase()).join(delimiter);
    case 'decimal':
      return values.map(value => String(Number(value))).join(delimiter);
    case 'binary':
      return values.map(value => (Number(value) >>> 0).toString(2)).join(delimiter);
    default:
      return '';
  }
};

export const formatBytesToText = (
  bytes: Uint8Array | number[] | ArrayLike<number>,
  format: GridFormat,
  delimiter: string = ' ',
  mode: ConversionMode = 'character'
): string => {
  if (!bytes || (!Array.isArray(bytes) && !(bytes instanceof Uint8Array) && typeof (bytes as any)[Symbol.iterator] !== 'function')) {
    return '';
  }
  const values = Array.isArray(bytes) ? bytes : Array.from(bytes);

  if (mode === 'byte') {
    return formatByteMode(values, format, delimiter);
  }

  return formatCharacterMode(values, format, delimiter);
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

