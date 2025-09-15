import { isValidValue, parseValue } from '../src/utils.js';

describe('ByteSync Editor - Paste Operations', () => {
  
  describe('Zero Value Handling', () => {
    test('should accept zero values for all formats', () => {
      // Hex zeros
      expect(isValidValue('0', 'hex')).toBe(true);
      expect(isValidValue('00', 'hex')).toBe(true);
      
      // Decimal zeros
      expect(isValidValue('0', 'decimal')).toBe(true);
      
      // Binary zeros
      expect(isValidValue('0', 'binary')).toBe(true);
      expect(isValidValue('00000000', 'binary')).toBe(true);
    });

    test('should parse zero values correctly', () => {
      expect(parseValue('0', 'hex')).toBe(0);
      expect(parseValue('00', 'hex')).toBe(0);
      expect(parseValue('0', 'decimal')).toBe(0);
      expect(parseValue('0', 'binary')).toBe(0);
      expect(parseValue('00000000', 'binary')).toBe(0);
    });
  });

  describe('Paste Value Processing', () => {
    test('should handle hex paste with zeros', () => {
      const hexString = '44 65 6E 65 6D 65 00 00 00';
      const values = hexString.split(' ').filter(val => val.length > 0);
      
      expect(values).toEqual(['44', '65', '6E', '65', '6D', '65', '00', '00', '00']);
      
      // All values should be valid
      values.forEach(value => {
        expect(isValidValue(value, 'hex')).toBe(true);
      });
      
      // Parse correctly
      const parsedValues = values.map(val => parseValue(val, 'hex'));
      expect(parsedValues).toEqual([68, 101, 110, 101, 109, 101, 0, 0, 0]);
    });

    test('should handle decimal paste with zeros', () => {
      const decimalString = '68 101 110 101 109 101 0 0 0';
      const values = decimalString.split(' ').filter(val => val.length > 0);
      
      expect(values).toEqual(['68', '101', '110', '101', '109', '101', '0', '0', '0']);
      
      // All values should be valid
      values.forEach(value => {
        expect(isValidValue(value, 'decimal')).toBe(true);
      });
      
      // Parse correctly
      const parsedValues = values.map(val => parseValue(val, 'decimal'));
      expect(parsedValues).toEqual([68, 101, 110, 101, 109, 101, 0, 0, 0]);
    });

    test('should handle binary paste with zeros', () => {
      const binaryString = '01000100 01100101 00000000 00000000';
      const values = binaryString.split(' ').filter(val => val.length > 0);
      
      expect(values).toEqual(['01000100', '01100101', '00000000', '00000000']);
      
      // All values should be valid
      values.forEach(value => {
        expect(isValidValue(value, 'binary')).toBe(true);
      });
      
      // Parse correctly
      const parsedValues = values.map(val => parseValue(val, 'binary'));
      expect(parsedValues).toEqual([68, 101, 0, 0]);
    });

    test('should handle comma-separated decimal values', () => {
      const decimalString = '68,101,110,101,109,101,0,0,0';
      const values = decimalString.split(',').filter(val => val.length > 0);
      
      expect(values).toEqual(['68', '101', '110', '101', '109', '101', '0', '0', '0']);
      
      // All values should be valid
      values.forEach(value => {
        expect(isValidValue(value, 'decimal')).toBe(true);
      });
    });

    test('should handle mixed separators in decimal', () => {
      const decimalString = '68, 101, 110 101 109, 101 0 0 0';
      const values = decimalString.split(/[,\s]+/).filter(val => val.length > 0);
      
      expect(values).toEqual(['68', '101', '110', '101', '109', '101', '0', '0', '0']);
    });
  });

  describe('Invalid Value Handling', () => {
    test('should identify invalid hex values', () => {
      expect(isValidValue('GG', 'hex')).toBe(false);
      expect(isValidValue('123', 'hex')).toBe(false);
      expect(isValidValue('0x', 'hex')).toBe(false);
      expect(isValidValue('', 'hex')).toBe(false);
    });

    test('should identify invalid decimal values', () => {
      expect(isValidValue('256', 'decimal')).toBe(false);
      expect(isValidValue('abc', 'decimal')).toBe(false);
      expect(isValidValue('1234', 'decimal')).toBe(false);
      expect(isValidValue('', 'decimal')).toBe(false);
    });

    test('should identify invalid binary values', () => {
      expect(isValidValue('2', 'binary')).toBe(false);
      expect(isValidValue('111111111', 'binary')).toBe(false);
      expect(isValidValue('abc', 'binary')).toBe(false);
      expect(isValidValue('', 'binary')).toBe(false);
    });

    test('should identify invalid ascii values', () => {
      expect(isValidValue('AB', 'ascii')).toBe(false);
      expect(isValidValue('', 'ascii')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty paste', () => {
      const emptyString = '';
      const values = emptyString.split(' ').filter(val => val.length > 0);
      expect(values).toEqual([]);
    });

    test('should handle whitespace-only paste', () => {
      const whitespaceString = '   \t\n  ';
      const values = whitespaceString.split(/\s+/).filter(val => val.length > 0);
      expect(values).toEqual([]);
    });

    test('should handle single value paste', () => {
      const singleValue = 'FF';
      const values = singleValue.split(' ').filter(val => val.length > 0);
      expect(values).toEqual(['FF']);
      expect(isValidValue(values[0], 'hex')).toBe(true);
    });

    test('should handle maximum valid values', () => {
      expect(isValidValue('FF', 'hex')).toBe(true);
      expect(isValidValue('255', 'decimal')).toBe(true);
      expect(isValidValue('11111111', 'binary')).toBe(true);
    });
  });
});
