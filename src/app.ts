/**
 * ByteSync Editor - Main TypeScript File
 * Modüler yapı - tüm modüller buradan başlatılır
 */

// App Configuration - will be loaded dynamically from manifest.json
interface AppConfig {
    version: string;
    name: string;
}

let APP_CONFIG: AppConfig = {
    version: '1.42.6', // fallback version
    name: 'ByteSync Editor'
};

// Function to load app config from manifest.json
async function loadAppConfig(): Promise<AppConfig> {
    try {
        const response = await fetch('./manifest.json');
        const manifest = await response.json();
        
        APP_CONFIG = {
            version: manifest.version || '1.42.6',
            name: manifest.name || 'ByteSync Editor'
        };
        
        console.log('App config loaded:', APP_CONFIG);
        return APP_CONFIG;
    } catch (error) {
        console.warn('Could not load manifest.json, using fallback config:', error);
        return APP_CONFIG;
    }
}

// Import modüller
import { 
    formatBytesToText
} from './utils.js';

// Import state manager
import stateManager from './state-manager.js';

// Import grid manager
import {
    initializeGrids,
    updatePositionIndicator,
    clearAllCells,
    selectAllCells
} from './grid-manager.js';

// Import tab manager
import {
    initializeTabs,
    switchTab
} from './tab-manager.js';

// Import 4-in-1 mode
import {
    initializeFourInOneMode
} from './modes/four-in-one-mode.js';

// Import context menu
import {
    initializeContextMenu
} from './components/context-menu.js';

// Import ASCII table
import {
    initializeAsciiTable
} from './components/ascii-table.js';

// Import PWA update manager
import { PWAUpdateManager } from './pwa-update-manager.js';

// Import feedback form
import { FeedbackForm } from './components/feedback-form.js';

// Import docklight PTP parser
import {
    initializeDocklightPTPMode
} from './docklight-ptp-parser.js';

// Handle URL mode parameters
const handleUrlMode = (): void => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode) {
        // Wait for DOM to be ready
        setTimeout(() => {
            const tabButton = document.querySelector(`[data-tab="${mode}"]`);
            if (tabButton) {
                (tabButton as HTMLElement).click();
            }
        }, 100);
    }
};

// Function to update version in HTML
function updateVersionInHTML(): void {
    const versionElement = document.getElementById('app-title');
    if (versionElement) {
        versionElement.textContent = `${APP_CONFIG.name} v${APP_CONFIG.version}`;
    }
}

// Initialize the app
window.onload = async (): Promise<void> => {
    // Load app config
    await loadAppConfig();
    
    // Update version in HTML
    updateVersionInHTML();
    
    // Handle URL mode parameters
    handleUrlMode();
    
    // Populate ASCII reference table
    initializeAsciiTable();
    
    // DOM elementlerini bul
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const hexGrid = document.getElementById('hex-grid');
    const asciiGrid = document.getElementById('ascii-grid');
    const decimalGrid = document.getElementById('decimal-grid');
    const binaryGrid = document.getElementById('binary-grid');
    const copyButtons = document.querySelectorAll('.copy-button');
    const clearButtons = document.querySelectorAll('.clear-button');
    
    // DOM elementlerini kontrol et
    if (!hexGrid || !asciiGrid || !decimalGrid || !binaryGrid) {
        alert('Grid elementleri bulunamadı!');
        return;
    }
    
    // Initialize theme system
    if (window.ThemeManager) {
        (window as any).themeManager = new window.ThemeManager();
    }
    
    // Initialize state manager callbacks
    stateManager.setOnExpand((oldSize: number, newSize: number) => {
        if (window.NotificationHelper) {
            window.NotificationHelper.showExpansion(oldSize, newSize);
        }
    });
    
    stateManager.setOnPositionUpdate(() => {
        updatePositionIndicator();
    });
    
    // Initialize grids
    initializeGrids(hexGrid, asciiGrid, decimalGrid, binaryGrid);
    
    // Initialize position indicator
    updatePositionIndicator();
    
    // Initialize tabs
    initializeTabs(tabButtons as NodeListOf<HTMLElement>, tabContents as NodeListOf<HTMLElement>);
    
    // Initialize 4-in-1 mode
    initializeFourInOneMode();
    
    // Initialize Docklight PTP mode
    initializeDocklightPTPMode();
    
    // Initialize context menu
    initializeContextMenu();
    
    // Copy all data from a specific format
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = (button as HTMLElement).dataset.type || 'hex';
            const data = stateManager.getData();
            const textToCopy = formatBytesToText(Array.from(data), type as any, ' ');
            
            // Use the clipboard API for modern browsers
            navigator.clipboard.writeText(textToCopy).then(() => {
                if (window.NotificationHelper) {
                    window.NotificationHelper.showSuccess('İçerik panoya kopyalandı!');
                }
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    });

    // Clear all cells event listeners
    clearButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearAllCells();
            // Show feedback
            const originalText = button.textContent;
            const originalBg = (button as HTMLElement).style.backgroundColor;
            button.textContent = 'Cleared!';
            (button as HTMLElement).style.backgroundColor = 'var(--theme-success)';
            setTimeout(() => {
                button.textContent = originalText;
                (button as HTMLElement).style.backgroundColor = originalBg;
            }, 1500);
        });
    });
    
    // Global klavye kısayolları (document seviyesinde)
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        // Command/Ctrl + 1,2,3,4,5,6 - Mod değiştirme (Mac: ⌘, Windows: Ctrl)
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
            let targetTab: string | null = null;
            // Command + sayı tuşları ile tab değiştirme
            switch (e.code) {
                case 'Digit1':
                    targetTab = 'ascii';
                    break;
                case 'Digit2':
                    targetTab = 'hex';
                    break;
                case 'Digit3':
                    targetTab = 'decimal';
                    break;
                case 'Digit4':
                    targetTab = 'binary';
                    break;
                case 'Digit5':
                    targetTab = 'four-in-one';
                    break;
                case 'Digit6':
                    targetTab = 'docklight-ptp';
                    break;
            }
            
            if (targetTab) {
                e.preventDefault();
                switchTab(targetTab);
                return;
            }
        }

        // Ctrl+A (veya Cmd+A) - Tümünü seç (global işlem)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllCells();
            return;
        }

        // Delete tuşu - Tüm seçili ise temizle (global işlem)
        if ((e.key === 'Delete' || e.key === 'Backspace') && stateManager.getAllSelected()) {
            e.preventDefault();
            clearAllCells();
            return;
        }

        // F5 tuşu - Sayfayı yenile
        if (e.key === 'F5') {
            e.preventDefault();
            window.location.reload();
            return;
        }
    });
    
    // PWA güncelleme yöneticisini başlat
    new PWAUpdateManager();
    
    // Initialize feedback form
    new FeedbackForm(APP_CONFIG);
    
    console.log('ByteSync Editor initialized');
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load app config from manifest.json
    await loadAppConfig();
    
    // Update version in HTML
    updateVersionInHTML();
});
