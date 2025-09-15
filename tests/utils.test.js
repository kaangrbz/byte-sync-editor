import {
  getMaxLengthForType,
  isValidValue,
  parseValue,
  convertValue,
  getSmartCopyData
} from '../src/utils.js';

describe('ByteSync Editor - Utility Functions', () => {
  
  describe('getMaxLengthForType', () => {
    test('should return correct max length for each type', () => {
      expect(getMaxLengthForType('ascii')).toBe(1);
      expect(getMaxLengthForType('hex')).toBe(2);
      expect(getMaxLengthForType('decimal')).toBe(3);
      expect(getMaxLengthForType('binary')).toBe(8);
      expect(getMaxLengthForType('unknown')).toBe(1); // default
    });
  });

  describe('isValidValue', () => {
    describe('hex validation', () => {
      test('should accept valid hex values', () => {
        expect(isValidValue('00', 'hex')).toBe(true);
        expect(isValidValue('FF', 'hex')).toBe(true);
        expect(isValidValue('a5', 'hex')).toBe(true);
        expect(isValidValue('1', 'hex')).toBe(true);
      });

      test('should reject invalid hex values', () => {
        expect(isValidValue('', 'hex')).toBe(false);
        expect(isValidValue('GG', 'hex')).toBe(false);
        expect(isValidValue('123', 'hex')).toBe(false);
        expect(isValidValue('0x', 'hex')).toBe(false);
      });
    });

    describe('decimal validation', () => {
      test('should accept valid decimal values', () => {
        expect(isValidValue('0', 'decimal')).toBe(true);
        expect(isValidValue('255', 'decimal')).toBe(true);
        expect(isValidValue('128', 'decimal')).toBe(true);
      });

      test('should reject invalid decimal values', () => {
        expect(isValidValue('', 'decimal')).toBe(false);
        expect(isValidValue('256', 'decimal')).toBe(false);
        expect(isValidValue('abc', 'decimal')).toBe(false);
        expect(isValidValue('1234', 'decimal')).toBe(false);
      });
    });

    describe('binary validation', () => {
      test('should accept valid binary values', () => {
        expect(isValidValue('00000000', 'binary')).toBe(true);
        expect(isValidValue('11111111', 'binary')).toBe(true);
        expect(isValidValue('10101010', 'binary')).toBe(true);
        expect(isValidValue('1', 'binary')).toBe(true);
      });

      test('should reject invalid binary values', () => {
        expect(isValidValue('', 'binary')).toBe(false);
        expect(isValidValue('2', 'binary')).toBe(false);
        expect(isValidValue('111111111', 'binary')).toBe(false);
        expect(isValidValue('abc', 'binary')).toBe(false);
      });
    });

    describe('ascii validation', () => {
      test('should accept valid ascii values', () => {
        expect(isValidValue('A', 'ascii')).toBe(true);
        expect(isValidValue('z', 'ascii')).toBe(true);
        expect(isValidValue(' ', 'ascii')).toBe(true);
        expect(isValidValue('!', 'ascii')).toBe(true);
      });

      test('should reject invalid ascii values', () => {
        expect(isValidValue('', 'ascii')).toBe(false);
        expect(isValidValue('AB', 'ascii')).toBe(false);
        expect(isValidValue('', 'ascii')).toBe(false);
      });
    });
  });

  describe('parseValue', () => {
    test('should parse hex values correctly', () => {
      expect(parseValue('00', 'hex')).toBe(0);
      expect(parseValue('FF', 'hex')).toBe(255);
      expect(parseValue('a5', 'hex')).toBe(165);
    });

    test('should parse decimal values correctly', () => {
      expect(parseValue('0', 'decimal')).toBe(0);
      expect(parseValue('255', 'decimal')).toBe(255);
      expect(parseValue('128', 'decimal')).toBe(128);
    });

    test('should parse binary values correctly', () => {
      expect(parseValue('00000000', 'binary')).toBe(0);
      expect(parseValue('11111111', 'binary')).toBe(255);
      expect(parseValue('10101010', 'binary')).toBe(170);
    });

    test('should parse ascii values correctly', () => {
      expect(parseValue('A', 'ascii')).toBe(65);
      expect(parseValue('a', 'ascii')).toBe(97);
      expect(parseValue(' ', 'ascii')).toBe(32);
    });
  });

  describe('convertValue', () => {
    test('should convert to hex correctly', () => {
      expect(convertValue(0, 'hex')).toBe('00');
      expect(convertValue(255, 'hex')).toBe('FF');
      expect(convertValue(165, 'hex')).toBe('A5');
    });

    test('should convert to decimal correctly', () => {
      expect(convertValue(0, 'decimal')).toBe('0');
      expect(convertValue(255, 'decimal')).toBe('255');
      expect(convertValue(128, 'decimal')).toBe('128');
    });

    test('should convert to binary correctly', () => {
      expect(convertValue(0, 'binary')).toBe('00000000');
      expect(convertValue(255, 'binary')).toBe('11111111');
      expect(convertValue(170, 'binary')).toBe('10101010');
    });

    test('should convert to ascii correctly', () => {
      expect(convertValue(65, 'ascii')).toBe('A');
      expect(convertValue(97, 'ascii')).toBe('a');
      expect(convertValue(32, 'ascii')).toBe(' ');
      expect(convertValue(13, 'ascii')).toBe('CR');
      expect(convertValue(10, 'ascii')).toBe('LF');
      expect(convertValue(0, 'ascii')).toBe(''); // 0 için boş
    });

    test('should handle invalid input', () => {
      expect(convertValue(NaN, 'hex')).toBe('');
      expect(convertValue(undefined, 'decimal')).toBe('');
    });
  });

  describe('getSmartCopyData', () => {
    test('should trim trailing zeros for hex data', () => {
      const data = new Uint8Array([0x44, 0x65, 0x6E, 0x65, 0x6D, 0x65, 0x00, 0x00, 0x00]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual(['44', '65', '6E', '65', '6D', '65']);
    });

    test('should trim trailing zeros for decimal data', () => {
      const data = new Uint8Array([68, 101, 110, 101, 109, 101, 0, 0, 0]);
      const result = getSmartCopyData(data, 'decimal');
      expect(result).toEqual(['68', '101', '110', '101', '109', '101']);
    });

    test('should trim trailing zeros for binary data', () => {
      const data = new Uint8Array([0b01000100, 0b01100101, 0b00000000, 0b00000000]);
      const result = getSmartCopyData(data, 'binary');
      expect(result).toEqual(['01000100', '01100101']);
    });

    test('should trim trailing empty strings for ascii data', () => {
      const data = new Uint8Array([68, 101, 110, 101, 109, 101, 0, 0, 0]);
      const result = getSmartCopyData(data, 'ascii');
      expect(result).toEqual(['D', 'e', 'n', 'e', 'm', 'e']);
    });

    test('should return all data if no trailing zeros', () => {
      const data = new Uint8Array([68, 101, 110, 101, 109, 101]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual(['44', '65', '6E', '65', '6D', '65']);
    });

    test('should return all data if all zeros', () => {
      const data = new Uint8Array([0, 0, 0, 0]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual(['00', '00', '00', '00']);
    });

    test('should handle empty data', () => {
      const data = new Uint8Array([]);
      const result = getSmartCopyData(data, 'hex');
      expect(result).toEqual([]);
    });
  });
});
