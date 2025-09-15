/**
 * Export/Import Functions Tests
 */

import {
    exportToJSON,
    exportToCSV,
    exportToBase64,
    exportToURLEncoded,
    importFromJSON,
    importFromBase64,
    importFromURLEncoded,
    getTemplateData
} from '../src/utils.js';

describe('ByteSync Editor - Export/Import Functions', () => {
    const mockData = new Uint8Array([72, 101, 108, 108, 111, 0, 255, 128]);
    const emptyData = new Uint8Array(8).fill(0);
    const singleByteData = new Uint8Array([65]);

    describe('exportToJSON', () => {
        test('should export data as JSON with metadata', () => {
            const result = exportToJSON(mockData);
            const parsed = JSON.parse(result);
            
            expect(parsed.version).toBe('1.0.0');
            expect(parsed.data).toEqual([72, 101, 108, 108, 111, 0, 255, 128]);
            expect(parsed.metadata.totalBytes).toBe(8);
            expect(parsed.metadata.nonZeroBytes).toBe(7);
            expect(parsed.timestamp).toBeDefined();
        });

        test('should handle empty data', () => {
            const result = exportToJSON(emptyData);
            const parsed = JSON.parse(result);
            
            expect(parsed.data).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
            expect(parsed.metadata.nonZeroBytes).toBe(0);
        });
    });

    describe('exportToCSV', () => {
        test('should export data as CSV with headers', () => {
            const result = exportToCSV(mockData);
            const lines = result.split('\n');
            
            expect(lines[0]).toBe('Index,Hex,Decimal,Binary,ASCII');
            expect(lines[1]).toBe('0,48,72,01001000,H');
            expect(lines[2]).toBe('1,65,101,01100101,e');
            expect(lines[3]).toBe('2,6C,108,01101100,l');
            expect(lines[4]).toBe('3,6C,108,01101100,l');
            expect(lines[5]).toBe('4,6F,111,01101111,o');
            expect(lines[6]).toBe('5,00,0,00000000,');
            expect(lines[7]).toBe('6,FF,255,11111111,');
            expect(lines[8]).toBe('7,80,128,10000000,');
        });

        test('should handle single byte data', () => {
            const result = exportToCSV(singleByteData);
            const lines = result.split('\n');
            
            expect(lines[0]).toBe('Index,Hex,Decimal,Binary,ASCII');
            expect(lines[1]).toBe('0,41,65,01000001,A');
        });
    });

    describe('exportToBase64', () => {
        test('should export data as Base64', () => {
            const result = exportToBase64(mockData);
            expect(result).toBe('SGVsbG8A/4A=');
        });

        test('should handle empty data', () => {
            const result = exportToBase64(emptyData);
            expect(result).toBe('AAAAAAAAAAA=');
        });

        test('should handle single byte', () => {
            const result = exportToBase64(singleByteData);
            expect(result).toBe('QQ==');
        });
    });

    describe('exportToURLEncoded', () => {
        test('should export data as URL encoded', () => {
            const result = exportToURLEncoded(mockData);
            expect(result).toBe('Hello%00%C3%BF%C2%80');
        });

        test('should handle special characters', () => {
            const specialData = new Uint8Array([32, 33, 34, 35]); // space, !, ", #
            const result = exportToURLEncoded(specialData);
            expect(result).toBe('%20!%22%23');
        });
    });

    describe('importFromJSON', () => {
        test('should import data from JSON', () => {
            const jsonString = JSON.stringify({
                version: '1.0.0',
                data: [72, 101, 108, 108, 111],
                metadata: { totalBytes: 5, nonZeroBytes: 5 }
            });
            
            const result = importFromJSON(jsonString);
            expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
        });

        test('should throw error for invalid JSON', () => {
            expect(() => importFromJSON('invalid json')).toThrow('Failed to parse JSON');
        });

        test('should throw error for missing data field', () => {
            const jsonString = JSON.stringify({ version: '1.0.0' });
            expect(() => importFromJSON(jsonString)).toThrow('Invalid JSON format');
        });
    });

    describe('importFromBase64', () => {
        test('should import data from Base64', () => {
            const result = importFromBase64('SGVsbG8A/4A=');
            expect(result).toEqual(mockData);
        });

        test('should handle empty Base64', () => {
            const result = importFromBase64('AAAAAAAAAAA=');
            expect(result).toEqual(emptyData);
        });

        test('should throw error for invalid Base64', () => {
            expect(() => importFromBase64('invalid base64!')).toThrow('Failed to decode Base64');
        });
    });

    describe('importFromURLEncoded', () => {
        test('should import data from URL encoded', () => {
            const result = importFromURLEncoded('Hello%00%C3%BF%C2%80');
            expect(result).toEqual(mockData);
        });

        test('should handle special characters', () => {
            const result = importFromURLEncoded('%20!%22%23');
            expect(result).toEqual(new Uint8Array([32, 33, 34, 35]));
        });

        test('should throw error for invalid URL encoding', () => {
            expect(() => importFromURLEncoded('%GG')).toThrow('Failed to decode URL');
        });
    });

    describe('getTemplateData', () => {
        test('should return empty template', () => {
            const result = getTemplateData('empty');
            expect(result.length).toBe(256);
            expect(Array.from(result).every(byte => byte === 0)).toBe(true);
        });

        test('should return hello world template', () => {
            const result = getTemplateData('hello');
            expect(result.length).toBe(256);
            const helloText = 'Hello, World!';
            for (let i = 0; i < helloText.length; i++) {
                expect(result[i]).toBe(helloText.charCodeAt(i));
            }
            // Rest should be zeros
            for (let i = helloText.length; i < 256; i++) {
                expect(result[i]).toBe(0);
            }
        });

        test('should return numbers sequence template', () => {
            const result = getTemplateData('numbers');
            expect(result.length).toBe(256);
            for (let i = 0; i < 256; i++) {
                expect(result[i]).toBe(i);
            }
        });

        test('should return random template', () => {
            const result = getTemplateData('random');
            expect(result.length).toBe(256);
            // All values should be between 0-255
            expect(Array.from(result).every(byte => byte >= 0 && byte <= 255)).toBe(true);
        });

        test('should return empty template for unknown template', () => {
            const result = getTemplateData('unknown');
            expect(result.length).toBe(256);
            expect(Array.from(result).every(byte => byte === 0)).toBe(true);
        });
    });

    describe('Round-trip tests', () => {
        test('JSON export and import should be consistent', () => {
            const exported = exportToJSON(mockData);
            const imported = importFromJSON(exported);
            expect(imported).toEqual(mockData);
        });

        test('Base64 export and import should be consistent', () => {
            const exported = exportToBase64(mockData);
            const imported = importFromBase64(exported);
            expect(imported).toEqual(mockData);
        });

        test('URL encoded export and import should be consistent', () => {
            const exported = exportToURLEncoded(mockData);
            const imported = importFromURLEncoded(exported);
            expect(imported).toEqual(mockData);
        });
    });
});
