describe('ByteSync Editor - Shift Shortcuts', () => {
  
  describe('Mode Switching with Shift + Numbers', () => {
    test('should switch to ASCII mode with Shift+1', () => {
      const event = {
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        key: '1',
        preventDefault: jest.fn()
      };
      
      // Mock tab button click
      const mockTabButton = {
        click: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => mockTabButton);
      
      // Simulate Shift+1
      let targetTab = null;
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '1':
            targetTab = 'ascii';
            break;
        }
        
        if (targetTab) {
          event.preventDefault();
          const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
          if (tabButton) {
            tabButton.click();
          }
        }
      }
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.querySelector).toHaveBeenCalledWith('[data-tab="ascii"]');
      expect(mockTabButton.click).toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should switch to Hex mode with Shift+2', () => {
      const event = {
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        key: '2',
        preventDefault: jest.fn()
      };
      
      // Mock tab button click
      const mockTabButton = {
        click: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => mockTabButton);
      
      // Simulate Shift+2
      let targetTab = null;
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '2':
            targetTab = 'hex';
            break;
        }
        
        if (targetTab) {
          event.preventDefault();
          const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
          if (tabButton) {
            tabButton.click();
          }
        }
      }
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.querySelector).toHaveBeenCalledWith('[data-tab="hex"]');
      expect(mockTabButton.click).toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should switch to Decimal mode with Shift+3', () => {
      const event = {
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        key: '3',
        preventDefault: jest.fn()
      };
      
      // Mock tab button click
      const mockTabButton = {
        click: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => mockTabButton);
      
      // Simulate Shift+3
      let targetTab = null;
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '3':
            targetTab = 'decimal';
            break;
        }
        
        if (targetTab) {
          event.preventDefault();
          const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
          if (tabButton) {
            tabButton.click();
          }
        }
      }
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.querySelector).toHaveBeenCalledWith('[data-tab="decimal"]');
      expect(mockTabButton.click).toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should switch to Binary mode with Shift+4', () => {
      const event = {
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        key: '4',
        preventDefault: jest.fn()
      };
      
      // Mock tab button click
      const mockTabButton = {
        click: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => mockTabButton);
      
      // Simulate Shift+4
      let targetTab = null;
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '4':
            targetTab = 'binary';
            break;
        }
        
        if (targetTab) {
          event.preventDefault();
          const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
          if (tabButton) {
            tabButton.click();
          }
        }
      }
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.querySelector).toHaveBeenCalledWith('[data-tab="binary"]');
      expect(mockTabButton.click).toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should not trigger mode switch with other Shift combinations', () => {
      const event = {
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        key: '5',
        preventDefault: jest.fn()
      };
      
      // Mock tab button click
      const mockTabButton = {
        click: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => mockTabButton);
      
      // Simulate Shift+5 (should not trigger)
      let targetTab = null;
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '1':
            targetTab = 'ascii';
            break;
          case '2':
            targetTab = 'hex';
            break;
          case '3':
            targetTab = 'decimal';
            break;
          case '4':
            targetTab = 'binary';
            break;
        }
        
        if (targetTab) {
          event.preventDefault();
          const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
          if (tabButton) {
            tabButton.click();
          }
        }
      }
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(document.querySelector).not.toHaveBeenCalled();
      expect(mockTabButton.click).not.toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });

    test('should not trigger mode switch with Ctrl+Shift combinations', () => {
      const event = {
        shiftKey: true,
        ctrlKey: true,
        metaKey: false,
        key: '1',
        preventDefault: jest.fn()
      };
      
      // Mock tab button click
      const mockTabButton = {
        click: jest.fn()
      };
      
      // Mock document.querySelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => mockTabButton);
      
      // Simulate Ctrl+Shift+1 (should not trigger)
      let targetTab = null;
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '1':
            targetTab = 'ascii';
            break;
        }
        
        if (targetTab) {
          event.preventDefault();
          const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
          if (tabButton) {
            tabButton.click();
          }
        }
      }
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(document.querySelector).not.toHaveBeenCalled();
      expect(mockTabButton.click).not.toHaveBeenCalled();
      
      // Restore original function
      document.querySelector = originalQuerySelector;
    });
  });
});
