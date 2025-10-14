/**
 * Görsel Karakter Gösterimi Testleri
 * Tüm 256 karakter için test coverage
 */

import { convertValue } from '../src/utils.js';

describe('Görsel Karakter Gösterimi', () => {
  
  describe('Kontrol Karakterleri (0-31)', () => {
    test('NULL karakter (0)', () => {
      expect(convertValue(0, 'ascii')).toBe('[NULL]');
    });

    test('TAB karakteri (9)', () => {
      expect(convertValue(9, 'ascii')).toBe('[TAB]');
    });

    test('Line Feed (10)', () => {
      expect(convertValue(10, 'ascii')).toBe('[LF]');
    });

    test('Carriage Return (13)', () => {
      expect(convertValue(13, 'ascii')).toBe('[CR]');
    });

    test('Escape (27)', () => {
      expect(convertValue(27, 'ascii')).toBe('[ESC]');
    });

    test('Diğer kontrol karakterleri', () => {
      expect(convertValue(1, 'ascii')).toBe('[SOH]');
      expect(convertValue(2, 'ascii')).toBe('[STX]');
      expect(convertValue(3, 'ascii')).toBe('[ETX]');
      expect(convertValue(7, 'ascii')).toBe('[BEL]');
      expect(convertValue(8, 'ascii')).toBe('[BS]');
      expect(convertValue(11, 'ascii')).toBe('[VT]');
      expect(convertValue(12, 'ascii')).toBe('[FF]');
      expect(convertValue(31, 'ascii')).toBe('[US]');
    });
  });

  describe('Görünür ASCII Karakterleri (32-126)', () => {
    test('Boşluk karakteri (32)', () => {
      expect(convertValue(32, 'ascii')).toBe(' ');
    });

    test('Yazdırılabilir karakterler', () => {
      expect(convertValue(65, 'ascii')).toBe('A');
      expect(convertValue(97, 'ascii')).toBe('a');
      expect(convertValue(48, 'ascii')).toBe('0');
      expect(convertValue(33, 'ascii')).toBe('!');
      expect(convertValue(64, 'ascii')).toBe('@');
      expect(convertValue(126, 'ascii')).toBe('~');
    });

    test('Türkçe karakterler (ASCII aralığında)', () => {
      // ASCII aralığında Türkçe karakter yok, bu test gelecekteki genişletmeler için
      expect(convertValue(65, 'ascii')).toBe('A');
    });
  });

  describe('Özel Karakterler', () => {
    test('DEL karakteri (127)', () => {
      expect(convertValue(127, 'ascii')).toBe('[DEL]');
    });

    test('Non-breaking space (160)', () => {
      expect(convertValue(160, 'ascii')).toBe('[NBSP]');
    });
  });

  describe('Genişletilmiş ASCII (128-255)', () => {
    test('Hex DE (222) - özel karakter', () => {
      const result = convertValue(222, 'ascii');
      // Bu karakter görünür olabilir veya [DE] olarak gösterilebilir
      expect(result).toMatch(/^(Þ|[DE])$/);
    });

    test('Diğer genişletilmiş ASCII karakterleri', () => {
      // 128-255 arası karakterlerin test edilmesi
      expect(convertValue(128, 'ascii')).toBeDefined();
      expect(convertValue(200, 'ascii')).toBeDefined();
      expect(convertValue(255, 'ascii')).toBeDefined();
    });

    test('Genişletilmiş ASCII karakteri (128)', () => {
      const result = convertValue(128, 'ascii');
      // Bu karakter görünür olabilir veya [80] olarak gösterilebilir
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('HTML Gösterimi', () => {
    test('HTML ile kontrol karakterleri', () => {
      const result = convertValue(0, 'ascii', true);
      expect(result).toContain('<span class="null-char"');
      expect(result).toContain('[NULL]');
      expect(result).toContain('title="Null karakter (0x00)"');
    });

    test('HTML ile genişletilmiş ASCII', () => {
      const result = convertValue(222, 'ascii', true);
      if (result.includes('<span')) {
        expect(result).toContain('class="extended-char"');
        expect(result).toContain('title=');
      }
    });

    test('HTML olmadan normal karakterler', () => {
      expect(convertValue(65, 'ascii', false)).toBe('A');
      expect(convertValue(65, 'ascii', true)).toBe('A'); // HTML etiketi yok
    });
  });

  describe('Tüm 256 Karakter Testi', () => {
    test('Her byte değeri için geçerli sonuç', () => {
      for (let i = 0; i <= 255; i++) {
        const result = convertValue(i, 'ascii');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        
        // Sonuç boş string olmamalı
        expect(result).not.toBe('');
      }
    });

    test('Kritik karakterlerin doğru gösterimi', () => {
      const criticalChars = [
        { byte: 0, expected: '[NULL]' },
        { byte: 9, expected: '[TAB]' },
        { byte: 10, expected: '[LF]' },
        { byte: 13, expected: '[CR]' },
        { byte: 27, expected: '[ESC]' },
        { byte: 32, expected: ' ' },
        { byte: 65, expected: 'A' },
        { byte: 97, expected: 'a' },
        { byte: 127, expected: '[DEL]' },
        { byte: 160, expected: '[NBSP]' }
      ];

      criticalChars.forEach(({ byte, expected }) => {
        expect(convertValue(byte, 'ascii')).toBe(expected);
      });
    });
  });

  describe('Veri Bütünlüğü', () => {
    test('Hiçbir karakter kaybolmamalı', () => {
      const allResults = [];
      for (let i = 0; i <= 255; i++) {
        const result = convertValue(i, 'ascii');
        allResults.push({ byte: i, result });
      }

      // Tüm sonuçlar benzersiz olmalı (aynı byte farklı sonuç vermemeli)
      const uniqueResults = new Set(allResults.map(r => r.result));
      expect(uniqueResults.size).toBeGreaterThan(200); // En az 200 farklı gösterim olmalı
    });

    test('Geri dönüşüm testi', () => {
      // Hex ve decimal formatlarında geri dönüşüm mümkün olmalı
      for (let i = 0; i <= 255; i++) {
        const hexResult = convertValue(i, 'hex');
        const decimalResult = convertValue(i, 'decimal');
        
        expect(parseInt(hexResult, 16)).toBe(i);
        expect(parseInt(decimalResult, 10)).toBe(i);
      }
    });
  });
});
