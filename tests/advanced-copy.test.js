/**
 * Advanced Copy Format Tests
 * Tests for the new advanced copy format functionality
 */

const { getCopyDataInFormat } = require('../src/utils');

describe('ByteSync Editor - Advanced Copy Formats', () => {
    // Mock data for testing
    const mockData = [0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00, 0x00, 0x00]; // "Hello" + padding zeros
    
    beforeEach(() => {
        // Mock the data array
        global.data = new Uint8Array(mockData);
    });

    describe('getCopyDataInFormat', () => {
        it('should format data as hex string', () => {
            const result = getCopyDataInFormat(mockData, 'hex');
            expect(result).toBe('48 65 6C 6C 6F');
        });

        it('should format data as C array', () => {
            const result = getCopyDataInFormat(mockData, 'c-array');
            expect(result).toBe('uint8_t data[] = { 0x48, 0x65, 0x6C, 0x6C, 0x6F };');
        });

        it('should format data as Python bytes', () => {
            const result = getCopyDataInFormat(mockData, 'python');
            expect(result).toBe('data = bytes([0x48, 0x65, 0x6C, 0x6C, 0x6F])');
        });

        it('should format data as JavaScript Uint8Array', () => {
            const result = getCopyDataInFormat(mockData, 'javascript');
            expect(result).toBe('const data = new Uint8Array([72, 101, 108, 108, 111]);');
        });

        it('should format data as Base64', () => {
            const result = getCopyDataInFormat(mockData, 'base64');
            expect(result).toBe('SGVsbG8=');
        });

        it('should format data as ASCII text', () => {
            const result = getCopyDataInFormat(mockData, 'ascii');
            expect(result).toBe('Hello');
        });

        it('should handle empty data', () => {
            const emptyData = new Uint8Array(0);
            const result = getCopyDataInFormat(emptyData, 'hex');
            expect(result).toBe('');
        });

        it('should handle all zeros data', () => {
            const zeroData = new Uint8Array([0, 0, 0, 0]);
            const result = getCopyDataInFormat(zeroData, 'hex');
            expect(result).toBe('00 00 00 00');
        });

        it('should default to hex format for unknown format', () => {
            const result = getCopyDataInFormat(mockData, 'unknown');
            expect(result).toBe('48 65 6C 6C 6F');
        });
    });

    describe('Special characters handling', () => {
        it('should handle CR and LF characters in C array', () => {
            const crlfData = new Uint8Array([0x0D, 0x0A, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
            const result = getCopyDataInFormat(crlfData, 'c-array');
            expect(result).toBe('uint8_t data[] = { 0x0D, 0x0A, 0x48, 0x65, 0x6C, 0x6C, 0x6F };');
        });

        it('should handle CR and LF characters in Python bytes', () => {
            const crlfData = new Uint8Array([0x0D, 0x0A, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
            const result = getCopyDataInFormat(crlfData, 'python');
            expect(result).toBe('data = bytes([0x0D, 0x0A, 0x48, 0x65, 0x6C, 0x6C, 0x6F])');
        });

        it('should handle CR and LF characters in JavaScript Uint8Array', () => {
            const crlfData = new Uint8Array([0x0D, 0x0A, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
            const result = getCopyDataInFormat(crlfData, 'javascript');
            expect(result).toBe('const data = new Uint8Array([13, 10, 72, 101, 108, 108, 111]);');
        });
    });

    describe('Edge cases', () => {
        it('should handle single byte data', () => {
            const singleByteData = new Uint8Array([0x41]);
            const result = getCopyDataInFormat(singleByteData, 'hex');
            expect(result).toBe('41');
        });

        it('should handle maximum byte value (255)', () => {
            const maxByteData = new Uint8Array([0xFF, 0x00, 0x80]);
            const result = getCopyDataInFormat(maxByteData, 'c-array');
            expect(result).toBe('uint8_t data[] = { 0xFF, 0x00, 0x80 };');
        });

        it('should handle minimum byte value (0)', () => {
            const minByteData = new Uint8Array([0x00, 0x01, 0x00]);
            const result = getCopyDataInFormat(minByteData, 'python');
            expect(result).toBe('data = bytes([0x00, 0x01])');
        });
    });
});
