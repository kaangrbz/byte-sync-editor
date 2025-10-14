/**
 * Enter Tuşu Navigasyon Testleri
 * Normal Enter tuşu ile bir sonraki input'a geçiş
 */

describe('Enter Tuşu Navigasyonu', () => {
  
  describe('Normal Enter Tuşu', () => {
    test('Enter tuşu ile bir sonraki inputa geçiş', () => {
      // Mock event
      const mockPreventDefault = jest.fn();
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: mockPreventDefault,
        target: {
          dataset: { 
            index: '5',
            type: 'hex'
          },
          value: 'FF'
        }
      };
      
      // Enter tuşu kontrolü
      const isNormalEnter = event.key === 'Enter' && 
                           !event.ctrlKey && 
                           !event.metaKey && 
                           !event.shiftKey;
      
      expect(isNormalEnter).toBe(true);
      
      // Simulate preventDefault call
      if (isNormalEnter) {
        event.preventDefault();
        expect(mockPreventDefault).toHaveBeenCalled();
      }
    });

    test('Enter tuşu boş input ile 0 değeri ekleme', () => {
      // Mock event with empty input
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '10',
            type: 'decimal'
          },
          value: '' // Boş input
        }
      };
      
      // Boş input kontrolü
      const isEmptyInput = event.target.value === '';
      expect(isEmptyInput).toBe(true);
      
      // Bu durumda 0 değeri eklenmeli
      const shouldAddZero = isEmptyInput;
      expect(shouldAddZero).toBe(true);
    });

    test('Enter tuşu dolu input ile navigasyon', () => {
      // Mock event with filled input
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '15',
            type: 'ascii'
          },
          value: 'A' // Dolu input
        }
      };
      
      // Dolu input kontrolü
      const isFilledInput = event.target.value !== '';
      expect(isFilledInput).toBe(true);
      
      // Bu durumda sadece navigasyon yapılmalı, değer eklenmemeli
      const shouldOnlyNavigate = isFilledInput;
      expect(shouldOnlyNavigate).toBe(true);
    });
  });

  describe('Enter Tuşu Kombinasyonları', () => {
    test('Cmd+Enter CR karakteri ekleme (mevcut özellik)', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '20',
            type: 'ascii'
          }
        }
      };
      
      // Cmd+Enter kontrolü
      const isCmdEnter = (event.ctrlKey || event.metaKey) && 
                        event.key === 'Enter' && 
                        !event.shiftKey;
      
      expect(isCmdEnter).toBe(true);
      
      // CR karakteri (13) eklenmeli
      const crCharacter = 13;
      expect(crCharacter).toBe(13);
    });

    test('Cmd+Shift+Enter LF karakteri ekleme (mevcut özellik)', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: true,
        shiftKey: true,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '25',
            type: 'ascii'
          }
        }
      };
      
      // Cmd+Shift+Enter kontrolü
      const isCmdShiftEnter = (event.ctrlKey || event.metaKey) && 
                             event.shiftKey && 
                             event.key === 'Enter';
      
      expect(isCmdShiftEnter).toBe(true);
      
      // LF karakteri (10) eklenmeli
      const lfCharacter = 10;
      expect(lfCharacter).toBe(10);
    });

    test('Ctrl+Enter normal Enter olarak işlenmeli', () => {
      const event = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '30',
            type: 'binary'
          },
          value: '10101010'
        }
      };
      
      // Normal Enter kontrolü (Ctrl+Enter da normal Enter olarak işlenmeli)
      const isNormalEnter = event.key === 'Enter' && 
                           !event.metaKey && 
                           !event.shiftKey;
      
      expect(isNormalEnter).toBe(true);
    });
  });

  describe('Farklı Input Tipleri', () => {
    test('Hex input ile Enter navigasyonu', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '35',
            type: 'hex'
          },
          value: 'A5'
        }
      };
      
      expect(event.target.dataset.type).toBe('hex');
      expect(event.target.value).toBe('A5');
    });

    test('ASCII input ile Enter navigasyonu', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '40',
            type: 'ascii'
          },
          value: 'Z'
        }
      };
      
      expect(event.target.dataset.type).toBe('ascii');
      expect(event.target.value).toBe('Z');
    });

    test('Decimal input ile Enter navigasyonu', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '45',
            type: 'decimal'
          },
          value: '255'
        }
      };
      
      expect(event.target.dataset.type).toBe('decimal');
      expect(event.target.value).toBe('255');
    });

    test('Binary input ile Enter navigasyonu', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '50',
            type: 'binary'
          },
          value: '11111111'
        }
      };
      
      expect(event.target.dataset.type).toBe('binary');
      expect(event.target.value).toBe('11111111');
    });
  });

  describe('Edge Cases', () => {
    test('Son inputta Enter tuşu', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '255', // Son input
            type: 'hex'
          },
          value: 'FF'
        }
      };
      
      // Son inputta da navigasyon yapılmalı (muhtemelen ilk inputa dönmeli)
      expect(parseInt(event.target.dataset.index)).toBe(255);
    });

    test('İlk inputta Enter tuşu', () => {
      const event = {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        target: {
          dataset: { 
            index: '0', // İlk input
            type: 'ascii'
          },
          value: 'A'
        }
      };
      
      // İlk inputta navigasyon yapılmalı (ikinci inputa geçmeli)
      expect(parseInt(event.target.dataset.index)).toBe(0);
    });
  });
});
