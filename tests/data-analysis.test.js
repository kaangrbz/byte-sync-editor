/**
 * Data Analysis Tests
 * Tests for data analysis functionality
 */

const { analyzeData, calculateEntropy, getByteFrequency, detectPatterns } = require('../src/utils');

describe('ByteSync Editor - Data Analysis', () => {
    describe('calculateEntropy', () => {
        it('should calculate entropy for uniform distribution', () => {
            const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
            const entropy = calculateEntropy(data);
            expect(entropy).toBeCloseTo(3.0, 1); // 8 different values = 3 bits
        });

        it('should calculate entropy for repeated data', () => {
            const data = new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1]);
            const entropy = calculateEntropy(data);
            expect(entropy).toBeCloseTo(0.0, 1); // All same = 0 entropy
        });

        it('should handle empty data', () => {
            const data = new Uint8Array([]);
            const entropy = calculateEntropy(data);
            expect(entropy).toBe(0);
        });

        it('should calculate entropy for mixed data', () => {
            const data = new Uint8Array([1, 1, 2, 2, 3, 3, 4, 4]);
            const entropy = calculateEntropy(data);
            expect(entropy).toBeCloseTo(2.0, 1); // 4 different values = 2 bits
        });
    });

    describe('getByteFrequency', () => {
        it('should count byte frequencies correctly', () => {
            const data = new Uint8Array([1, 1, 2, 3, 2, 1]);
            const frequency = getByteFrequency(data);
            expect(frequency[1]).toBe(3);
            expect(frequency[2]).toBe(2);
            expect(frequency[3]).toBe(1);
        });

        it('should handle empty data', () => {
            const data = new Uint8Array([]);
            const frequency = getByteFrequency(data);
            expect(Object.keys(frequency)).toHaveLength(0);
        });

        it('should handle single byte', () => {
            const data = new Uint8Array([42]);
            const frequency = getByteFrequency(data);
            expect(frequency[42]).toBe(1);
        });
    });

    describe('detectPatterns', () => {
        it('should detect repeating patterns', () => {
            const data = new Uint8Array([1, 1, 2, 2, 3, 3]);
            const patterns = detectPatterns(data);
            expect(patterns.repeats).toBe(3);
        });

        it('should detect sequences', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const patterns = detectPatterns(data);
            expect(patterns.sequences).toBe(3); // 1,2,3 and 2,3,4 and 3,4,5
        });

        it('should count ASCII characters', () => {
            const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
            const patterns = detectPatterns(data);
            expect(patterns.asciiChars).toBe(5);
        });

        it('should count control characters', () => {
            const data = new Uint8Array([0, 13, 10, 127, 32]); // NUL, CR, LF, DEL, SPACE
            const patterns = detectPatterns(data);
            expect(patterns.controlChars).toBe(4); // 0, 13, 10, 127
        });

        it('should handle empty data', () => {
            const data = new Uint8Array([]);
            const patterns = detectPatterns(data);
            expect(patterns.repeats).toBe(0);
            expect(patterns.sequences).toBe(0);
            expect(patterns.asciiChars).toBe(0);
            expect(patterns.controlChars).toBe(0);
        });
    });

    describe('analyzeData', () => {
        it('should provide complete analysis', () => {
            const data = new Uint8Array([72, 101, 108, 108, 111, 0, 0, 0]); // "Hello" + padding
            const analysis = analyzeData(data);
            
            expect(analysis.totalBytes).toBe(8);
            expect(analysis.nonZeroBytes).toBe(5);
            expect(analysis.uniqueBytes).toBe(5); // H, e, l, l, o (including 0)
            expect(analysis.entropy).toBe('2.16'); // Actual calculated value
            expect(analysis.mostFrequent).toHaveLength(3);
            expect(analysis.patterns.asciiChars).toBe(5);
            expect(analysis.patterns.controlChars).toBe(3);
        });

        it('should handle all zeros', () => {
            const data = new Uint8Array([0, 0, 0, 0]);
            const analysis = analyzeData(data);
            
            expect(analysis.totalBytes).toBe(4);
            expect(analysis.nonZeroBytes).toBe(0);
            expect(analysis.uniqueBytes).toBe(1);
            expect(analysis.entropy).toBe('0.00');
            expect(analysis.patterns.asciiChars).toBe(0);
            expect(analysis.patterns.controlChars).toBe(4);
        });

        it('should handle single byte', () => {
            const data = new Uint8Array([65]); // 'A'
            const analysis = analyzeData(data);
            
            expect(analysis.totalBytes).toBe(1);
            expect(analysis.nonZeroBytes).toBe(1);
            expect(analysis.uniqueBytes).toBe(1);
            expect(analysis.entropy).toBe('0.00');
            expect(analysis.patterns.asciiChars).toBe(1);
        });

        it('should handle empty data', () => {
            const data = new Uint8Array([]);
            const analysis = analyzeData(data);
            
            expect(analysis.totalBytes).toBe(0);
            expect(analysis.nonZeroBytes).toBe(0);
            expect(analysis.uniqueBytes).toBe(0);
            expect(analysis.entropy).toBe('0.00');
            expect(analysis.mostFrequent).toHaveLength(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle maximum byte values', () => {
            const data = new Uint8Array([255, 255, 0, 0]);
            const analysis = analyzeData(data);
            
            expect(analysis.uniqueBytes).toBe(2);
            expect(analysis.mostFrequent[0]).toBe('0x00 (2)'); // 0 appears twice, 255 appears twice
        });

        it('should handle mixed ASCII and control characters', () => {
            const data = new Uint8Array([72, 0, 101, 13, 108, 10, 111]); // "H\0e\rl\no"
            const patterns = detectPatterns(data);
            
            expect(patterns.asciiChars).toBe(4); // H, e, l, o
            expect(patterns.controlChars).toBe(3); // 0, 13, 10
        });

        it('should detect complex sequences', () => {
            const data = new Uint8Array([1, 2, 3, 5, 6, 7, 9, 10, 11]);
            const patterns = detectPatterns(data);
            
            expect(patterns.sequences).toBe(3); // 1,2,3 and 5,6,7 and 9,10,11 (6,7,9 is not consecutive)
        });
    });
});
