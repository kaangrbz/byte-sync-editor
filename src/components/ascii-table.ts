/**
 * ByteSync Editor - ASCII Table
 * ASCII/HEX/DECIMAL referans tablosu
 */

import { formatBytesToText } from '../utils.js';

// Helper function to get ASCII display for invisible characters
const getInvisibleAsciiDisplay = (value: number): string => {
    // Kontrol karakterleri için özel isimler
    const controlCharNames: Record<number, string> = {
        0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
        8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
        16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
        24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
        127: 'DEL'
    };
    
    // Kontrol karakteri ise özel isim göster
    if (controlCharNames[value]) {
        return `<span style="font-weight: bold; font-size: 0.9em; color: #666; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">${controlCharNames[value]}</span>`;
    }
    
    // Tüm diğer karakterler formatBytesToText ile UTF-8 decoding yapılarak gösterilir
    const asciiChar = formatBytesToText([value], 'ascii', '');
    return `<span style="font-weight: bold; font-size: 1.1em;">${asciiChar}</span>`;
};

// Helper function to get ASCII display
const getAsciiDisplay = (value: number): string => {
    return getInvisibleAsciiDisplay(value);
};

// Helper function to create a cell group (DEC, HEX, ASCII)
const createCellGroup = (value: number): HTMLElement[] => {
    const cells: HTMLElement[] = [];
    
    // CR/LF class belirleme
    let crlfClass = '';
    if (value === 13) {
        crlfClass = 'cr-character';
    } else if (value === 10) {
        crlfClass = 'lf-character';
    }
    
    // DECIMAL cell
    const decCell = document.createElement('td');
    decCell.className = `px-4 py-3 border text-center decimal-cell table-cell ${crlfClass}`;
    decCell.style.borderColor = 'var(--theme-border)';
    decCell.style.color = 'var(--theme-text)';
    decCell.style.fontWeight = 'bold';
    decCell.style.fontSize = '1em';
    decCell.textContent = value.toString();
    cells.push(decCell);
    
    // HEX cell
    const hexCell = document.createElement('td');
    hexCell.className = `px-4 py-3 border text-center table-cell ${crlfClass}`;
    hexCell.style.borderColor = 'var(--theme-border)';
    hexCell.style.color = 'var(--theme-text)';
    hexCell.style.fontWeight = 'bold';
    hexCell.style.fontSize = '0.95em';
    hexCell.textContent = formatBytesToText([value], 'hex', '');
    cells.push(hexCell);
    
    // ASCII cell
    const asciiCell = document.createElement('td');
    asciiCell.className = `px-4 py-3 border text-center table-cell ${crlfClass}`;
    asciiCell.style.borderColor = 'var(--theme-border)';
    asciiCell.style.color = 'var(--theme-text)';
    asciiCell.innerHTML = getAsciiDisplay(value);
    cells.push(asciiCell);
    
    return cells;
};

// Populate ASCII/HEX/DECIMAL reference table
const populateAsciiTable = (): void => {
    const tableBody = document.getElementById('ascii-table-body');
    if (!tableBody) return;
    
    // Her satırda 4 grup değer göster (0-63 satır, her satır 4 değer)
    const rowCount = 64;
    for (let row = 0; row < rowCount; row++) {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--theme-border)';
        
        // Zebra striping
        if (row % 2 === 0) {
            tr.style.backgroundColor = 'var(--theme-surface)';
        } else {
            tr.style.backgroundColor = 'var(--theme-background)';
        }
        
        // Her satırda 4 değer: row, row+64, row+128, row+192
        for (let col = 0; col < 4; col++) {
            const value = row + (col * 64);
            if (value < 256) {
                const cells = createCellGroup(value);
                cells.forEach(cell => tr.appendChild(cell));
            }
        }
        
        tableBody.appendChild(tr);
    }
};

// Initialize ASCII table
const initializeAsciiTable = (): void => {
    populateAsciiTable();
};

// Export
export {
    populateAsciiTable,
    initializeAsciiTable,
    getInvisibleAsciiDisplay
};

