/**
 * ByteSync Editor - Tab Manager
 * Tab değiştirme ve yönetimi
 */

import stateManager from './state-manager.js';
import { clearAllSelection, recreateAllGrids } from './grid-manager.js';
import { getDefaultTabId } from './tabs-config.js';

type TabChangeCallback = (tabName: string) => void;

let tabButtons: NodeListOf<HTMLElement> | null = null;
let tabContents: NodeListOf<HTMLElement> | null = null;
let onTabChangeCallback: TabChangeCallback | null = null;

// Tab değiştirme
const switchTab = (tabName: string): void => {
    if (!tabButtons || !tabContents) return;
    
    // Remove active class from all tabs and buttons
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        (btn as HTMLElement).style.backgroundColor = 'var(--theme-secondary)';
        (btn as HTMLElement).style.color = 'var(--theme-text)';
    });
    tabContents.forEach(content => content.classList.remove('active'));

    // Find and activate the target tab button
    const targetButton = Array.from(tabButtons).find(btn => btn.dataset.tab === tabName);
    if (targetButton) {
        targetButton.classList.add('active');
        (targetButton as HTMLElement).style.backgroundColor = 'var(--theme-primary)';
        (targetButton as HTMLElement).style.color = 'white';
    }

    // Activate the target tab content
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Save active tab to localStorage
    try {
        localStorage.setItem('bytesync-active-tab', tabName);
    } catch (err) {
        console.warn('localStorage yazılamıyor:', err);
    }

    // Clear all selection when switching tabs
    clearAllSelection();

    // Sadece aktif tab için hücreler üretilsin; sekme değişince o sekmeye ait grid oluştur
    recreateAllGrids();

    // Re-apply highlight to the current active cell
    const activeIndex = stateManager.getActiveIndex();
    if (activeIndex !== -1) {
        const activeInput = document.querySelector(`#${tabName}-tab [data-index="${activeIndex}"]`) as HTMLElement;
        if (activeInput) {
            activeInput.focus();
        }
    } else {
        const data = stateManager.getData();
        const isGridEmpty = Array.from(data).every(value => value === 0);
        if (isGridEmpty) {
            const firstInput = document.querySelector(`#${tabName}-tab [data-index="0"]`) as HTMLElement;
            if (firstInput) {
                firstInput.focus();
            }
        }
    }
    
    // Callback
    if (onTabChangeCallback) {
        onTabChangeCallback(tabName);
    }
};

// Aktif tab'ı al
const getActiveTab = (): HTMLElement | null => {
    return document.querySelector('.tab-content.active');
};

// Aktif tab adını al
const getActiveTabName = (): string | null => {
    const activeButton = document.querySelector('.tab-button.active') as HTMLElement;
    return activeButton?.dataset.tab || null;
};

// Tab'ları başlat
const initializeTabs = (
    buttons: NodeListOf<HTMLElement>,
    contents: NodeListOf<HTMLElement>
): void => {
    tabButtons = buttons;
    tabContents = contents;
    
    // Tab button event listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            if (targetTab) {
                switchTab(targetTab);
            }
        });
    });
    
    // Load and set active tab from localStorage (varsayılan: tabs-config'den)
    try {
        const defaultTab = getDefaultTabId();
        const savedTab = localStorage.getItem('bytesync-active-tab') || defaultTab;
        const tabButton = document.querySelector(`[data-tab="${savedTab}"]`) as HTMLElement;
        if (tabButton) {
            tabButton.classList.add('active');
            tabButton.style.backgroundColor = 'var(--theme-primary)';
            tabButton.style.color = 'white';
            switchTab(savedTab);
        } else {
            const fallbackButton = document.querySelector(`[data-tab="${defaultTab}"]`) as HTMLElement;
            if (fallbackButton) {
                fallbackButton.classList.add('active');
                fallbackButton.style.backgroundColor = 'var(--theme-primary)';
                fallbackButton.style.color = 'white';
                switchTab(defaultTab);
            }
        }
    } catch (err) {
        console.warn('localStorage okunamıyor:', err);
        const defaultTab = getDefaultTabId();
        const fallbackButton = document.querySelector(`[data-tab="${defaultTab}"]`) as HTMLElement;
        if (fallbackButton) {
            fallbackButton.classList.add('active');
            fallbackButton.style.backgroundColor = 'var(--theme-primary)';
            fallbackButton.style.color = 'white';
            switchTab(defaultTab);
        }
    }
};

// Callback setter
const setOnTabChange = (callback: TabChangeCallback): void => {
    onTabChangeCallback = callback;
};

// Export
export {
    initializeTabs,
    switchTab,
    getActiveTab,
    getActiveTabName,
    setOnTabChange
};

