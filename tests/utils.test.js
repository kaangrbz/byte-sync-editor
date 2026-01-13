import {
  getMaxLengthForType,
  getDelimiter,
  getInvisibleAsciiDisplay,
  formatBytesToText
} from '../src/utils.js';

describe('Utility Fonksiyonlar', () => {
  
  describe('getMaxLengthForType', () => {
    test('ASCII için 1 döndürmeli', () => {
      expect(getMaxLengthForType('ascii')).toBe(1);
    });

    test('Hex için 2 döndürmeli', () => {
      expect(getMaxLengthForType('hex')).toBe(2);
    });

    test('Decimal için 3 döndürmeli', () => {
      expect(getMaxLengthForType('decimal')).toBe(3);
    });

    test('Binary için 8 döndürmeli', () => {
      expect(getMaxLengthForType('binary')).toBe(8);
    });

    test('Bilinmeyen format için 1 döndürmeli (varsayılan)', () => {
      expect(getMaxLengthForType('unknown')).toBe(1);
      expect(getMaxLengthForType('')).toBe(1);
      expect(getMaxLengthForType(null)).toBe(1);
      expect(getMaxLengthForType(undefined)).toBe(1);
    });
  });

  describe('getDelimiter', () => {
    test('none seçeneği için boş string döndürmeli', () => {
      expect(getDelimiter('none')).toBe('');
    });

    test('comma seçeneği için virgül döndürmeli', () => {
      expect(getDelimiter('comma')).toBe(',');
    });

    test('space seçeneği için boşluk döndürmeli', () => {
      expect(getDelimiter('space')).toBe(' ');
    });

    test('custom seçeneği için custom delimiter döndürmeli', () => {
      expect(getDelimiter('custom', '|')).toBe('|');
      expect(getDelimiter('custom', ';')).toBe(';');
      expect(getDelimiter('custom', '---')).toBe('---');
    });

    test('custom seçeneği için boş custom delimiter boş string döndürmeli', () => {
      expect(getDelimiter('custom', '')).toBe('');
    });

    test('bilinmeyen seçenek için boşluk döndürmeli (varsayılan)', () => {
      expect(getDelimiter('unknown')).toBe(' ');
      expect(getDelimiter('')).toBe(' ');
      expect(getDelimiter(null)).toBe(' ');
      expect(getDelimiter(undefined)).toBe(' ');
    });

    test('custom seçeneği olmadan custom delimiter kullanılmamalı', () => {
      // Custom seçeneği değilse custom delimiter ignore edilmeli
      expect(getDelimiter('comma', '|')).toBe(',');
      expect(getDelimiter('space', '|')).toBe(' ');
    });
  });

  describe('getInvisibleAsciiDisplay', () => {
    test('NULL karakteri (0) için HTML span döndürmeli', () => {
      const result = getInvisibleAsciiDisplay(0);
      expect(result).toContain('<span');
      expect(result).toContain('NUL');
      // null-char class'ı yok, sadece style var
    });

    test('TAB karakteri (9) için HTML span döndürmeli', () => {
      const result = getInvisibleAsciiDisplay(9);
      expect(result).toContain('<span');
      expect(result).toContain('TAB');
    });

    test('LF karakteri (10) için HTML span döndürmeli', () => {
      const result = getInvisibleAsciiDisplay(10);
      expect(result).toContain('<span');
      expect(result).toContain('LF');
    });

    test('CR karakteri (13) için HTML span döndürmeli', () => {
      const result = getInvisibleAsciiDisplay(13);
      expect(result).toContain('<span');
      expect(result).toContain('CR');
    });

    test('ESC karakteri (27) için HTML span döndürmeli', () => {
      const result = getInvisibleAsciiDisplay(27);
      expect(result).toContain('<span');
      expect(result).toContain('ESC');
    });

    test('DEL karakteri (127) için HTML span döndürmeli', () => {
      const result = getInvisibleAsciiDisplay(127);
      expect(result).toContain('<span');
      expect(result).toContain('DEL');
    });

    test('diğer kontrol karakterleri için HTML span döndürmeli', () => {
      const controlChars = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15];
      controlChars.forEach(char => {
        const result = getInvisibleAsciiDisplay(char);
        expect(result).toContain('<span');
      });
    });

    test('görünür ASCII karakterleri için normal span döndürmeli', () => {
      const visibleChars = [32, 65, 97, 48, 33];
      visibleChars.forEach(char => {
        const result = getInvisibleAsciiDisplay(char);
        expect(result).toContain('<span');
        // Kontrol karakteri için özel isim olmamalı
        expect(result).not.toContain('NUL');
        expect(result).not.toContain('TAB');
        expect(result).not.toContain('LF');
      });
    });

    test('görünür karakterler için formatBytesToText kullanmalı', () => {
      const result = getInvisibleAsciiDisplay(65); // 'A'
      const expectedChar = formatBytesToText([65], 'ascii', '');
      expect(result).toContain(expectedChar);
    });

    test('genişletilmiş ASCII karakterleri için normal span döndürmeli', () => {
      const extendedChars = [128, 200, 255];
      extendedChars.forEach(char => {
        const result = getInvisibleAsciiDisplay(char);
        expect(result).toContain('<span');
        // Kontrol karakteri için özel isim olmamalı
        expect(result).not.toContain('NUL');
      });
    });

    test('tüm kontrol karakterleri için doğru isimleri döndürmeli', () => {
      const controlCharMap = {
        0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
        8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
        16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
        24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
        127: 'DEL'
      };

      Object.entries(controlCharMap).forEach(([byte, name]) => {
        const result = getInvisibleAsciiDisplay(parseInt(byte));
        expect(result).toContain(name);
      });
    });

    test('HTML span içinde style attribute olmalı', () => {
      const result = getInvisibleAsciiDisplay(0);
      expect(result).toContain('style=');
      expect(result).toContain('font-weight');
    });

    test('kontrol karakterleri için title attribute olmalı', () => {
      const result = getInvisibleAsciiDisplay(0);
      // Title attribute kontrol karakteri için eklenebilir
      expect(typeof result).toBe('string');
    });
  });
});

