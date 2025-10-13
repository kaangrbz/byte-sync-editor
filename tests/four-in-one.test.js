/**
 * 4 in 1 Mode Tests
 * Tests for the 4 in 1 multi-format view functionality
 */

const { parseTextToBytes, formatBytesToText, getDelimiter } = require('../src/utils');

describe('ByteSync Editor - 4 in 1 Mode', () => {
    describe('parseTextToBytes', () => {
        it('should parse ASCII text to bytes', () => {
            const text = 'Hello';
            const bytes = parseTextToBytes(text, 'ascii');
            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('should parse hex text to bytes with space delimiter', () => {
            const text = '48 65 6C 6C 6F';
            const bytes = parseTextToBytes(text, 'hex', ' ');
            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('should parse hex text to bytes with comma delimiter', () => {
            const text = '48,65,6C,6C,6F';
            const bytes = parseTextToBytes(text, 'hex', ',');
            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('should parse hex text to bytes with no delimiter', () => {
            const text = '48656C6C6F';
            const bytes = parseTextToBytes(text, 'hex', '');
            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('should parse decimal text to bytes', () => {
            const text = '72 101 108 108 111';
            const bytes = parseTextToBytes(text, 'decimal', ' ');
            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('should parse binary text to bytes', () => {
            const text = '01001000 01100101 01101100 01101100 01101111';
            const bytes = parseTextToBytes(text, 'binary', ' ');
            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('should handle empty text', () => {
            const bytes = parseTextToBytes('', 'ascii');
            expect(bytes).toEqual([]);
        });

        it('should handle invalid hex values', () => {
            const text = '48 XX 6C 6C 6F';
            const bytes = parseTextToBytes(text, 'hex', ' ');
            expect(bytes).toEqual([72, 108, 108, 111]); // XX is skipped
        });

        it('should handle invalid decimal values', () => {
            const text = '72 999 108 108 111';
            const bytes = parseTextToBytes(text, 'decimal', ' ');
            expect(bytes).toEqual([72, 108, 108, 111]); // 999 is skipped
        });

        it('should handle invalid binary values', () => {
            const text = '01001000 999 01101100 01101100 01101111';
            const bytes = parseTextToBytes(text, 'binary', ' ');
            expect(bytes).toEqual([72, 108, 108, 111]); // 999 is skipped
        });
    });

    describe('formatBytesToText', () => {
        it('should format bytes to ASCII text', () => {
            const bytes = [72, 101, 108, 108, 111];
            const text = formatBytesToText(bytes, 'ascii');
            expect(text).toBe('Hello');
        });

        it('should format bytes to hex text with space delimiter', () => {
            const bytes = [72, 101, 108, 108, 111];
            const text = formatBytesToText(bytes, 'hex', ' ');
            expect(text).toBe('48 65 6C 6C 6F');
        });

        it('should format bytes to hex text with comma delimiter', () => {
            const bytes = [72, 101, 108, 108, 111];
            const text = formatBytesToText(bytes, 'hex', ',');
            expect(text).toBe('48,65,6C,6C,6F');
        });

        it('should format bytes to hex text with no delimiter', () => {
            const bytes = [72, 101, 108, 108, 111];
            const text = formatBytesToText(bytes, 'hex', '');
            expect(text).toBe('48656C6C6F');
        });

        it('should format bytes to decimal text', () => {
            const bytes = [72, 101, 108, 108, 111];
            const text = formatBytesToText(bytes, 'decimal', ' ');
            expect(text).toBe('72 101 108 108 111');
        });

        it('should format bytes to binary text', () => {
            const bytes = [72, 101, 108, 108, 111];
            const text = formatBytesToText(bytes, 'binary', ' ');
            expect(text).toBe('01001000 01100101 01101100 01101100 01101111');
        });

        it('should handle special ASCII characters', () => {
            const bytes = [13, 10, 0, 32, 65];
            const text = formatBytesToText(bytes, 'ascii');
            expect(text).toBe('\r\n A'); // CR, LF, empty, space, A - gerçek satır sonu karakterleri
        });

        it('should handle empty bytes array', () => {
            const text = formatBytesToText([], 'ascii');
            expect(text).toBe('');
        });
    });

    describe('getDelimiter', () => {
        it('should return empty string for none option', () => {
            expect(getDelimiter('none')).toBe('');
        });

        it('should return comma for comma option', () => {
            expect(getDelimiter('comma')).toBe(',');
        });

        it('should return space for space option', () => {
            expect(getDelimiter('space')).toBe(' ');
        });

        it('should return custom delimiter for custom option', () => {
            expect(getDelimiter('custom', '|')).toBe('|');
        });

        it('should return space for unknown option', () => {
            expect(getDelimiter('unknown')).toBe(' ');
        });
    });

    describe('Integration tests', () => {
        it('should maintain data integrity across format conversions', () => {
            const originalBytes = [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100];
            
            // Convert to different formats
            const asciiText = formatBytesToText(originalBytes, 'ascii');
            const hexText = formatBytesToText(originalBytes, 'hex', ' ');
            const decimalText = formatBytesToText(originalBytes, 'decimal', ' ');
            const binaryText = formatBytesToText(originalBytes, 'binary', ' ');
            
            // Parse back to bytes
            const asciiBytes = parseTextToBytes(asciiText, 'ascii');
            const hexBytes = parseTextToBytes(hexText, 'hex', ' ');
            const decimalBytes = parseTextToBytes(decimalText, 'decimal', ' ');
            const binaryBytes = parseTextToBytes(binaryText, 'binary', ' ');
            
            // All should match original
            expect(asciiBytes).toEqual(originalBytes);
            expect(hexBytes).toEqual(originalBytes);
            expect(decimalBytes).toEqual(originalBytes);
            expect(binaryBytes).toEqual(originalBytes);
        });

        it('should handle different delimiters correctly', () => {
            const bytes = [1, 2, 3, 4, 5];
            
            const spaceDelimited = formatBytesToText(bytes, 'hex', ' ');
            const commaDelimited = formatBytesToText(bytes, 'hex', ',');
            const pipeDelimited = formatBytesToText(bytes, 'hex', '|');
            
            expect(spaceDelimited).toBe('01 02 03 04 05');
            expect(commaDelimited).toBe('01,02,03,04,05');
            expect(pipeDelimited).toBe('01|02|03|04|05');
        });

        it('should handle edge cases', () => {
            // Single byte
            const singleByte = [255];
            expect(formatBytesToText(singleByte, 'hex')).toBe('FF');
            expect(parseTextToBytes('FF', 'hex')).toEqual([255]);
            
            // Zero bytes
            const zeroBytes = [0, 0, 0];
            expect(formatBytesToText(zeroBytes, 'hex', ' ')).toBe('00 00 00');
            expect(parseTextToBytes('00 00 00', 'hex', ' ')).toEqual([0, 0, 0]);
            
            // Maximum values
            const maxBytes = [255, 255, 255];
            expect(formatBytesToText(maxBytes, 'hex', ' ')).toBe('FF FF FF');
            expect(parseTextToBytes('FF FF FF', 'hex', ' ')).toEqual([255, 255, 255]);
        });
    });
});
