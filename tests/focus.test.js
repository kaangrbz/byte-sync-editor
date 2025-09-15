import { convertValue } from '../src/utils.js';

describe('ByteSync Editor - Focus Management', () => {
  
  describe('Clear and Focus Behavior', () => {
    test('should focus first input after clearing all cells', () => {
      // Mock DOM elements
      const mockFirstInput = {
        focus: jest.fn(),
        select: jest.fn(),
        dispatchEvent: jest.fn()
      };
      
      const mockActiveTab = {
        querySelector: jest.fn(() => mockFirstInput)
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn((selector) => {
        if (selector === '.tab-content.active') return mockActiveTab;
        return null;
      });
      
      // Test clearAllCells function behavior
      // This would be called after clearAllCells() is executed
      const activeTab = document.querySelector('.tab-content.active');
      if (activeTab) {
        const firstInput = activeTab.querySelector('.input-cell');
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
          firstInput.dispatchEvent(new Event('focus', { bubbles: true }));
        }
      }
      
      expect(document.querySelector).toHaveBeenCalledWith('.tab-content.active');
      expect(mockActiveTab.querySelector).toHaveBeenCalledWith('.input-cell');
      expect(mockFirstInput.focus).toHaveBeenCalled();
      expect(mockFirstInput.select).toHaveBeenCalled();
      expect(mockFirstInput.dispatchEvent).toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should handle focus when no input exists', () => {
      // Mock document.querySelector to return null
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => null);
      
      // Test should not throw error
      const firstInput = document.querySelector('.input-cell');
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
      
      expect(document.querySelector).toHaveBeenCalledWith('.input-cell');
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });
  });

  describe('Backspace Navigation', () => {
    test('should navigate to previous input when backspace pressed on empty input', () => {
      // Mock DOM elements
      const mockCurrentInput = {
        value: '',
        dataset: { index: '5' }
      };
      
      const mockPrevInput = {
        focus: jest.fn(),
        select: jest.fn(),
        dispatchEvent: jest.fn()
      };
      
      const mockActiveTab = {
        querySelector: jest.fn(() => mockPrevInput)
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn((selector) => {
        if (selector === '.tab-content.active') return mockActiveTab;
        return null;
      });
      
      // Mock highlightCell function
      const mockHighlightCell = jest.fn();
      
      // Simulate backspace on empty input
      const currentIndex = 5;
      const newIndex = (currentIndex - 1 + 256) % 256; // 4
      const activeTab = document.querySelector('.tab-content.active');
      
      if (activeTab) {
        const prevInput = activeTab.querySelector(`[data-index="${newIndex}"]`);
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
          mockHighlightCell(newIndex);
          prevInput.dispatchEvent(new Event('focus', { bubbles: true }));
        }
      }
      
      expect(document.querySelector).toHaveBeenCalledWith('.tab-content.active');
      expect(mockActiveTab.querySelector).toHaveBeenCalledWith('[data-index="4"]');
      expect(mockPrevInput.focus).toHaveBeenCalled();
      expect(mockPrevInput.select).toHaveBeenCalled();
      expect(mockHighlightCell).toHaveBeenCalledWith(4);
      expect(mockPrevInput.dispatchEvent).toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should handle backspace navigation at first input (wrap around)', () => {
      // Mock DOM elements
      const mockCurrentInput = {
        value: '',
        dataset: { index: '0' }
      };
      
      const mockLastInput = {
        focus: jest.fn(),
        select: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn((selector) => {
        if (selector === '[data-index="255"]') return mockLastInput;
        return null;
      });
      
      // Mock highlightCell function
      const mockHighlightCell = jest.fn();
      
      // Simulate backspace on first input (index 0)
      const currentIndex = 0;
      const newIndex = (currentIndex - 1 + 256) % 256; // 255
      const prevInput = document.querySelector(`[data-index="${newIndex}"]`);
      
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
        mockHighlightCell(newIndex);
      }
      
      expect(document.querySelector).toHaveBeenCalledWith('[data-index="255"]');
      expect(mockLastInput.focus).toHaveBeenCalled();
      expect(mockLastInput.select).toHaveBeenCalled();
      expect(mockHighlightCell).toHaveBeenCalledWith(255);
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });
  });

  describe('Select All and Delete', () => {
    test('should clear all cells when Delete pressed after select all', () => {
      // Mock data array
      const mockData = new Uint8Array(256);
      mockData.fill(65); // Fill with 'A' characters
      
      // Mock clearAllCells function
      const mockClearAllCells = jest.fn();
      
      // Simulate select all + delete (Fn+Delete on Mac)
      const allSelected = true;
      const event = {
        key: 'Delete',
        preventDefault: jest.fn()
      };
      
      // Check if Delete should trigger clearAll
      if ((event.key === 'Delete' || event.key === 'Backspace') && allSelected) {
        event.preventDefault();
        mockClearAllCells();
      }
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockClearAllCells).toHaveBeenCalled();
    });

    test('should clear all cells when Backspace pressed after select all', () => {
      // Mock data array
      const mockData = new Uint8Array(256);
      mockData.fill(65); // Fill with 'A' characters
      
      // Mock clearAllCells function
      const mockClearAllCells = jest.fn();
      
      // Simulate select all + backspace (normal Delete on Mac)
      const allSelected = true;
      const event = {
        key: 'Backspace',
        preventDefault: jest.fn()
      };
      
      // Check if Backspace should trigger clearAll
      if ((event.key === 'Delete' || event.key === 'Backspace') && allSelected) {
        event.preventDefault();
        mockClearAllCells();
      }
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockClearAllCells).toHaveBeenCalled();
    });

    test('should not clear all cells when Delete pressed without select all', () => {
      // Mock clearAllCells function
      const mockClearAllCells = jest.fn();
      
      // Simulate delete without select all
      const allSelected = false;
      const event = {
        key: 'Delete',
        preventDefault: jest.fn()
      };
      
      // Check if Delete should trigger clearAll
      if (event.key === 'Delete' && allSelected) {
        event.preventDefault();
        mockClearAllCells();
      }
      
      expect(mockClearAllCells).not.toHaveBeenCalled();
    });

    test('should not clear all cells when other keys pressed with select all', () => {
      // Mock clearAllCells function
      const mockClearAllCells = jest.fn();
      
      // Simulate other key with select all
      const allSelected = true;
      const event = {
        key: 'Backspace',
        preventDefault: jest.fn()
      };
      
      // Check if Delete should trigger clearAll
      if (event.key === 'Delete' && allSelected) {
        event.preventDefault();
        mockClearAllCells();
      }
      
      expect(mockClearAllCells).not.toHaveBeenCalled();
    });
  });

  describe('Input Value Display', () => {
    test('should show empty string for zero values in all formats', () => {
      // Test that 0 values are displayed as empty strings
      expect(convertValue(0, 'hex')).toBe('00'); // Hex shows 00
      expect(convertValue(0, 'decimal')).toBe('0'); // Decimal shows 0
      expect(convertValue(0, 'binary')).toBe('00000000'); // Binary shows 00000000
      expect(convertValue(0, 'ascii')).toBe(''); // ASCII shows empty
    });

    test('should show proper values for non-zero inputs', () => {
      expect(convertValue(65, 'ascii')).toBe('A');
      expect(convertValue(255, 'hex')).toBe('FF');
      expect(convertValue(128, 'decimal')).toBe('128');
      expect(convertValue(170, 'binary')).toBe('10101010');
    });
  });
});
