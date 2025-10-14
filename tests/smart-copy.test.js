import { getSmartCopyData } from '../src/utils.js';

describe('ByteSync Editor - Smart Copy Operations', () => {
  
  describe('Hex Smart Copy', () => {
    test('should trim trailing zeros from hex data', () => {
      const data = new Uint8Array([0x44, 0x65, 0x6E, 0x65, 0x6D, 0x65, 0x00, 0x00, 0x00]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual(['44', '65', '6E', '65', '6D', '65']);
    });

    test('should handle data with no trailing zeros', () => {
      const data = new Uint8Array([0x44, 0x65, 0x6E, 0x65, 0x6D, 0x65]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual(['44', '65', '6E', '65', '6D', '65']);
    });

    test('should handle all zeros', () => {
      const data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual(['00', '00', '00', '00']);
    });
  });

  describe('Decimal Smart Copy', () => {
    test('should trim trailing zeros from decimal data', () => {
      const data = new Uint8Array([68, 101, 110, 101, 109, 101, 0, 0, 0]);
      const result = getSmartCopyData(data, 'decimal');
      expect(result).toEqual(['68', '101', '110', '101', '109', '101']);
    });
  });

  describe('Binary Smart Copy', () => {
    test('should trim trailing zeros from binary data', () => {
      const data = new Uint8Array([0b01000100, 0b01100101, 0b00000000, 0b00000000]);
      const result = getSmartCopyData(data, 'binary');
      expect(result).toEqual(['01000100', '01100101']);
    });
  });

  describe('ASCII Smart Copy', () => {
    test('should trim trailing empty strings from ascii data', () => {
      const data = new Uint8Array([68, 101, 110, 101, 109, 101, 0, 0, 0]);
      const result = getSmartCopyData(data, 'ascii');
      expect(result).toEqual(['D', 'e', 'n', 'e', 'm', 'e', '[NULL]', '[NULL]', '[NULL]']);
    });
  });
});
