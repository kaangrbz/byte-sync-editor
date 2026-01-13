/**
 * ByteSync Editor - Context Menu
 * Sağ tık menüsü ve aksiyon yönetimi
 */

import stateManager from '../state-manager.js';
import { formatBytesToText } from '../utils.js';
import { 
    getActiveType, 
    getActiveInput, 
    updateAllViews, 
    clearAllCells, 
    selectAllCells, 
    pasteToAllSelected,
    focusNextInput
} from '../grid-manager.js';
import { handleFourInOneInput } from '../modes/four-in-one-mode.js';

// Context menu oluşturma
const createContextMenu = (x: number, y: number): void => {
    // Mevcut context menu'yu kaldır
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';

    // Menü öğeleri
    const menuItems = [
        // Kopyalama/Yapıştırma grubu
        { text: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
        { text: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
        { text: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
        { separator: true },
        
        // Seçim grubu
        { text: 'Select All', action: 'selectAll', shortcut: 'Ctrl+A' },
        { text: 'Clear', action: 'clear', shortcut: 'Delete' },
        { separator: true },
        
        // Özel karakterler grubu
        { text: 'Add CR (\\r)', action: 'addCR', shortcut: 'Cmd+Enter' },
        { text: 'Add LF (\\n)', action: 'addLF', shortcut: 'Cmd+Shift+Enter' },
        { text: 'Reset (0)', action: 'reset', shortcut: 'Space' },
        { separator: true },
        
        // Sistem grubu
        { text: 'Refresh', action: 'refresh', shortcut: 'F5' }
    ];

    menuItems.forEach(item => {
        if ('separator' in item && item.separator) {
            const separator = document.createElement('div');
            separator.className = 'context-menu-separator';
            menu.appendChild(separator);
        } else if ('action' in item) {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `
                <span>${item.text}</span>
                <span style="margin-left: auto; font-size: 0.75rem; color: var(--theme-textSecondary);">${item.shortcut}</span>
            `;
            
            menuItem.addEventListener('click', () => {
                handleContextMenuAction(item.action);
                menu.remove();
            });
            
            menu.appendChild(menuItem);
        }
    });

    document.body.appendChild(menu);
    
    // Menü dışına tıklandığında kapat
    const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
};

// Context menu aksiyonları
const handleContextMenuAction = (action: string): void => {
    const data = stateManager.getData();
    const activeIndex = stateManager.getActiveIndex();
    const allSelected = stateManager.getAllSelected();
    
    switch (action) {
        case 'copy':
            if (allSelected) {
                // Tüm grid'i kopyala
                const type = getActiveType() || 'hex';
                const textToCopy = formatBytesToText(data, type, ' ');
                navigator.clipboard.writeText(textToCopy);
            } else if (activeIndex !== -1) {
                // Aktif hücreyi kopyala
                const activeInput = getActiveInput(activeIndex);
                if (activeInput) {
                    (activeInput as HTMLInputElement).select();
                    document.execCommand('copy');
                }
            }
            break;
        case 'paste':
            // 4-in-1 modunda mıyız kontrol et
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'four-in-one-tab') {
                // Aktif textarea'yı bul
                const activeTextarea = document.activeElement;
                if (activeTextarea && activeTextarea.tagName === 'TEXTAREA' && activeTab.contains(activeTextarea)) {
                    // Clipboard'dan metni al ve paste yap
                    navigator.clipboard.readText().then(text => {
                        // Textarea'nın formatını ID'den çıkar
                        const textareaId = activeTextarea.id;
                        const formatMatch = textareaId.match(/four-in-one-(ascii|hex|decimal|binary)/);
                        if (formatMatch) {
                            const format = formatMatch[1];
                            // Mevcut değeri al ve paste edilen metni ekle
                            const currentValue = (activeTextarea as HTMLTextAreaElement).value;
                            const selectionStart = (activeTextarea as HTMLTextAreaElement).selectionStart;
                            const selectionEnd = (activeTextarea as HTMLTextAreaElement).selectionEnd;
                            const newValue = currentValue.substring(0, selectionStart) + text + currentValue.substring(selectionEnd);
                            // handleFourInOneInput ile işle
                            handleFourInOneInput(format, newValue);
                        }
                    });
                    break;
                }
            }
            
            // Mevcut grid paste mantığı
            if (allSelected) {
                // Tüm grid'e paste yap
                navigator.clipboard.readText().then(text => {
                    pasteToAllSelected(text);
                });
            } else if (activeIndex !== -1) {
                // Aktif hücreye paste yap
                navigator.clipboard.readText().then(text => {
                    const activeInput = getActiveInput(activeIndex);
                    if (activeInput) {
                        const event = new ClipboardEvent('paste', {
                            clipboardData: new DataTransfer()
                        });
                        event.clipboardData?.setData('text/plain', text);
                        (activeInput as HTMLElement).dispatchEvent(event);
                    }
                });
            }
            break;
        case 'cut':
            if (allSelected) {
                // Tüm grid'i kes
                const type = getActiveType() || 'hex';
                const textToCopy = formatBytesToText(data, type, ' ');
                navigator.clipboard.writeText(textToCopy);
                clearAllCells();
            } else if (activeIndex !== -1) {
                // Aktif hücreyi kes
                const activeInput = getActiveInput(activeIndex);
                if (activeInput) {
                    (activeInput as HTMLInputElement).select();
                    document.execCommand('copy');
                    stateManager.setByte(activeIndex, 0);
                    updateAllViews();
                }
            }
            break;
        case 'selectAll':
            selectAllCells();
            break;
        case 'clear':
            if (allSelected) {
                clearAllCells();
            } else if (activeIndex !== -1) {
                stateManager.setByte(activeIndex, 0);
                updateAllViews();
                // Clear single cell - focus on current cell
                const currentInput = document.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
                if (currentInput) {
                    currentInput.focus();
                    (currentInput as HTMLInputElement).select();
                }
            }
            break;
        case 'addCR':
            if (activeIndex !== -1) {
                stateManager.setByte(activeIndex, 13); // CR character
                updateAllViews();
                // Move to next input
                setTimeout(() => {
                    const input = document.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
                    if (input) {
                        focusNextInput(activeIndex, input.dataset.type || '');
                    }
                }, 10);
            }
            break;
        case 'addLF':
            if (activeIndex !== -1) {
                stateManager.setByte(activeIndex, 10); // LF character
                updateAllViews();
                // Move to next input
                setTimeout(() => {
                    const input = document.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
                    if (input) {
                        focusNextInput(activeIndex, input.dataset.type || '');
                    }
                }, 10);
            }
            break;
        case 'reset':
            if (activeIndex !== -1) {
                stateManager.setByte(activeIndex, 0); // Reset to 0
                updateAllViews();
                // Focus on current cell
                const currentInput = document.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
                if (currentInput) {
                    currentInput.focus();
                    (currentInput as HTMLInputElement).select();
                }
            }
            break;
        case 'refresh':
            // Sayfayı yenile
            window.location.reload();
            break;
    }
};

// Context menu'yu başlat
const initializeContextMenu = (): void => {
    // Context menu event listener (sağ tık) - MacOS uyumlu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        createContextMenu(e.clientX, e.clientY);
    });
    
    // MacOS için alternatif: Ctrl+Click
    document.addEventListener('mousedown', (e) => {
        if (e.ctrlKey && e.button === 0) { // Ctrl + sol tık
            e.preventDefault();
            e.stopPropagation();
            createContextMenu(e.clientX, e.clientY);
        }
    });
};

// Export
export {
    createContextMenu,
    handleContextMenuAction,
    initializeContextMenu
};

