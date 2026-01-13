import {
  analyzeData,
  calculateEntropy,
  getByteFrequency,
  detectPatterns
} from '../src/utils.js';

describe('Data Analysis Fonksiyonları', () => {
  
  describe('calculateEntropy', () => {
    test('boş array için 0 döndürmeli', () => {
      expect(calculateEntropy([])).toBe(0);
    });

    test('tek elemanlı array için 0 döndürmeli', () => {
      expect(calculateEntropy([65])).toBe(0);
    });

    test('aynı elemanlardan oluşan array için 0 döndürmeli', () => {
      expect(calculateEntropy([65, 65, 65, 65])).toBe(0);
    });

    test('farklı elemanlardan oluşan array için pozitif entropy döndürmeli', () => {
      const entropy = calculateEntropy([65, 66, 67, 68]);
      expect(entropy).toBeGreaterThan(0);
    });

    test('maksimum entropy için tüm byte değerleri farklı olmalı', () => {
      const allBytes = Array.from({ length: 256 }, (_, i) => i);
      const entropy = calculateEntropy(allBytes);
      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThanOrEqual(8); // 8 bit = maksimum entropy
    });

    test('Shannon entropy formülünü doğru hesaplamalı', () => {
      // 2 farklı byte, eşit dağılım: entropy = -2 * (0.5 * log2(0.5)) = 1
      const data = [65, 66, 65, 66];
      const entropy = calculateEntropy(data);
      expect(entropy).toBeCloseTo(1, 1);
    });

    test('Uint8Array ile çalışmalı', () => {
      const data = new Uint8Array([65, 66, 67, 68]);
      const entropy = calculateEntropy(Array.from(data));
      expect(entropy).toBeGreaterThan(0);
    });
  });

  describe('getByteFrequency', () => {
    test('boş array için boş object döndürmeli', () => {
      const frequency = getByteFrequency([]);
      expect(frequency).toEqual({});
    });

    test('tek elemanlı array için doğru frequency döndürmeli', () => {
      const frequency = getByteFrequency([65]);
      expect(frequency[65]).toBe(1);
      expect(Object.keys(frequency).length).toBe(1);
    });

    test('çoklu elemanlar için doğru frequency döndürmeli', () => {
      const frequency = getByteFrequency([65, 66, 65, 67, 65]);
      expect(frequency[65]).toBe(3);
      expect(frequency[66]).toBe(1);
      expect(frequency[67]).toBe(1);
    });

    test('tüm byte değerleri için frequency hesaplamalı', () => {
      const data = [0, 255, 128, 0, 255];
      const frequency = getByteFrequency(data);
      expect(frequency[0]).toBe(2);
      expect(frequency[255]).toBe(2);
      expect(frequency[128]).toBe(1);
    });

    test('Uint8Array ile çalışmalı', () => {
      const data = new Uint8Array([65, 66, 65]);
      const frequency = getByteFrequency(Array.from(data));
      expect(frequency[65]).toBe(2);
      expect(frequency[66]).toBe(1);
    });
  });

  describe('detectPatterns', () => {
    test('boş array için sıfır pattern döndürmeli', () => {
      const patterns = detectPatterns([]);
      expect(patterns.repeats).toBe(0);
      expect(patterns.sequences).toBe(0);
      expect(patterns.asciiChars).toBe(0);
      expect(patterns.controlChars).toBe(0);
    });

    test('tekrar eden pattern\'leri tespit etmeli', () => {
      const data = [65, 65, 66, 66, 67, 67];
      const patterns = detectPatterns(data);
      expect(patterns.repeats).toBe(3); // 3 çift tekrar
    });

    test('sequence pattern\'lerini tespit etmeli', () => {
      const data = [65, 66, 67, 68]; // Artan sequence
      const patterns = detectPatterns(data);
      expect(patterns.sequences).toBeGreaterThan(0);
    });

    test('azalan sequence pattern\'lerini tespit etmeli', () => {
      const data = [68, 67, 66, 65]; // Azalan sequence
      const patterns = detectPatterns(data);
      expect(patterns.sequences).toBeGreaterThan(0);
    });

    test('ASCII karakterlerini saymalı', () => {
      const data = [65, 66, 67, 32, 33]; // A, B, C, space, !
      const patterns = detectPatterns(data);
      expect(patterns.asciiChars).toBe(5);
    });

    test('kontrol karakterlerini saymalı', () => {
      const data = [0, 9, 10, 13, 127]; // NUL, TAB, LF, CR, DEL
      const patterns = detectPatterns(data);
      expect(patterns.controlChars).toBe(5);
    });

    test('ASCII ve kontrol karakterlerini birlikte saymalı', () => {
      const data = [65, 0, 66, 10, 67]; // A, NUL, B, LF, C
      const patterns = detectPatterns(data);
      expect(patterns.asciiChars).toBe(3);
      expect(patterns.controlChars).toBe(2);
    });

    test('genişletilmiş ASCII karakterlerini ASCII olarak saymamalı', () => {
      const data = [128, 200, 255]; // Genişletilmiş ASCII
      const patterns = detectPatterns(data);
      expect(patterns.asciiChars).toBe(0);
      expect(patterns.controlChars).toBe(0);
    });

    test('karmaşık pattern\'leri tespit etmeli', () => {
      const data = [65, 65, 66, 67, 68, 65, 65]; // Tekrarlar ve sequence
      const patterns = detectPatterns(data);
      expect(patterns.repeats).toBeGreaterThan(0);
      expect(patterns.sequences).toBeGreaterThan(0);
    });

    test('Uint8Array ile çalışmalı', () => {
      const data = new Uint8Array([65, 66, 65]);
      const patterns = detectPatterns(Array.from(data));
      // [65, 66, 65] -> 65-66 (farklı), 66-65 (farklı) -> 0 repeat
      // Repeat sadece ardışık aynı değerler için sayılır
      expect(patterns.repeats).toBe(0);
    });
  });

  describe('analyzeData', () => {
    test('boş data için doğru analiz döndürmeli', () => {
      const data = new Uint8Array([]);
      const analysis = analyzeData(data);
      
      expect(analysis.totalBytes).toBe(0);
      expect(analysis.nonZeroBytes).toBe(0);
      expect(analysis.uniqueBytes).toBe(0);
      expect(analysis.entropy).toBe('0.00');
      expect(analysis.mostFrequent).toEqual([]);
      expect(analysis.patterns).toBeDefined();
    });

    test('basit data için doğru analiz döndürmeli', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const analysis = analyzeData(data);
      
      expect(analysis.totalBytes).toBe(5);
      expect(analysis.nonZeroBytes).toBe(5);
      expect(analysis.uniqueBytes).toBe(4); // H, e, l, o
      expect(parseFloat(analysis.entropy)).toBeGreaterThan(0);
      expect(analysis.mostFrequent.length).toBeLessThanOrEqual(3);
      expect(analysis.patterns).toBeDefined();
    });

    test('zero içeren data için doğru nonZeroBytes saymalı', () => {
      const data = new Uint8Array([72, 0, 101, 0, 108]);
      const analysis = analyzeData(data);
      
      expect(analysis.totalBytes).toBe(5);
      expect(analysis.nonZeroBytes).toBe(3);
    });

    test('uniqueBytes sayısını doğru hesaplamalı', () => {
      const data = new Uint8Array([65, 66, 65, 67, 65]); // 3 unique: A, B, C
      const analysis = analyzeData(data);
      
      expect(analysis.uniqueBytes).toBe(3);
    });

    test('entropy string formatında olmalı', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]);
      const analysis = analyzeData(data);
      
      expect(typeof analysis.entropy).toBe('string');
      expect(analysis.entropy).toMatch(/^\d+\.\d{2}$/); // "X.XX" formatı
    });

    test('mostFrequent en fazla 3 eleman içermeli', () => {
      const data = new Uint8Array([65, 65, 66, 66, 67, 67, 68, 68, 69, 69]);
      const analysis = analyzeData(data);
      
      expect(analysis.mostFrequent.length).toBeLessThanOrEqual(3);
    });

    test('mostFrequent formatı doğru olmalı', () => {
      const data = new Uint8Array([65, 65, 66]);
      const analysis = analyzeData(data);
      
      if (analysis.mostFrequent.length > 0) {
        analysis.mostFrequent.forEach(item => {
          expect(typeof item).toBe('string');
          expect(item).toMatch(/^0x[0-9A-F]{2} \(\d+\)$/); // "0xXX (count)" formatı
        });
      }
    });

    test('patterns objesi doğru yapıda olmalı', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]);
      const analysis = analyzeData(data);
      
      expect(analysis.patterns).toBeDefined();
      expect(analysis.patterns).toHaveProperty('repeats');
      expect(analysis.patterns).toHaveProperty('sequences');
      expect(analysis.patterns).toHaveProperty('asciiChars');
      expect(analysis.patterns).toHaveProperty('controlChars');
    });

    test('karmaşık data için kapsamlı analiz döndürmeli', () => {
      const data = new Uint8Array([
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, // "Hello World!"
        0, 0, 0, // Trailing zeros
        65, 65, 65, // Repeats
        1, 2, 3, 4, 5 // Sequence
      ]);
      const analysis = analyzeData(data);
      
      // Toplam: 12 + 3 + 3 + 5 = 23 byte
      expect(analysis.totalBytes).toBe(23);
      expect(analysis.nonZeroBytes).toBe(20); // 23 - 3 zero = 20
      expect(analysis.uniqueBytes).toBeGreaterThan(0);
      expect(parseFloat(analysis.entropy)).toBeGreaterThan(0);
      expect(analysis.patterns.repeats).toBeGreaterThan(0);
      expect(analysis.patterns.sequences).toBeGreaterThan(0);
    });

    test('tüm 256 byte değeri için analiz yapabilmeli', () => {
      const allBytes = Array.from({ length: 256 }, (_, i) => i);
      const data = new Uint8Array(allBytes);
      const analysis = analyzeData(data);
      
      expect(analysis.totalBytes).toBe(256);
      expect(analysis.uniqueBytes).toBe(256);
      expect(parseFloat(analysis.entropy)).toBeGreaterThan(0);
    });
  });
});

