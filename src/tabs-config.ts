/**
 * ByteSync Editor - Sekme yapılandırması (tek kaynak)
 * Tab butonları, kısayol paneli ve Cmd+1..6 eşlemesi bu objeden türetilir.
 */

export interface TabItem {
    id: string;
    label: string;
    subLabel: string;
    title: string;
    shortcut: number;
}

export const TABS: TabItem[] = [
    { id: 'four-in-one', label: '4 in 1', subLabel: 'All in one', title: 'Tüm formatlar birlikte', shortcut: 1 },
    { id: 'ascii', label: 'ASCII', subLabel: 'Karakterler', title: 'ASCII karakterleri', shortcut: 2 },
    { id: 'hex', label: 'Hex', subLabel: '0x00-0xFF', title: 'Hexadecimal format', shortcut: 3 },
    { id: 'decimal', label: 'Decimal', subLabel: '0-255', title: 'Decimal sayılar', shortcut: 4 },
    { id: 'binary', label: 'Binary', subLabel: '8-bit', title: 'Binary format', shortcut: 5 },
    { id: 'docklight-ptp', label: 'PTP', subLabel: 'Docklight', title: 'Docklight PTP dosyası', shortcut: 6 },
];

export function getModifierKey(): string {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl';
}

/**
 * Tab butonlarını container'a render eder (HTML'e çevirir).
 */
export function renderTabButtons(container: HTMLElement | null): void {
    if (!container) return;
    const mod = getModifierKey();
    container.innerHTML = '';
    TABS.forEach((tab, i) => {
        const active = i === 0;
        const btn = document.createElement('button');
        btn.className = 'tab-button px-6 py-2 rounded-lg transition-colors duration-200' + (active ? ' active' : '');
        btn.dataset.tab = tab.id;
        btn.title = `${tab.title} (${mod}+${tab.shortcut})`;
        btn.setAttribute('style', active
            ? 'background-color: var(--theme-primary); color: white;'
            : 'background-color: var(--theme-secondary); color: var(--theme-text);');
        btn.innerHTML = `
            <div class="text-sm font-medium">${escapeHtml(tab.label)}</div>
            <div class="text-xs opacity-70">${escapeHtml(tab.subLabel)}</div>
            <div class="text-xs opacity-70"><code>${escapeHtml(mod)}</code>+<code>${tab.shortcut}</code></div>
        `;
        container.appendChild(btn);
    });
}

/**
 * Klavye kısayolları panelindeki "Navigation & Editing" sekme listesini doldurur.
 */
export function renderKeyboardShortcutsTabs(container: HTMLElement | null): void {
    if (!container) return;
    const mod = getModifierKey();
    container.innerHTML = '';
    TABS.forEach((tab) => {
        const div = document.createElement('div');
        div.innerHTML = `<kbd class="px-1 py-0.5 rounded text-xs border">${escapeHtml(mod)} + ${tab.shortcut}</kbd> ${escapeHtml(tab.label)} Mode`;
        container.appendChild(div);
    });
}

function escapeHtml(text: string): string {
    const span = document.createElement('span');
    span.textContent = text;
    return span.innerHTML;
}

/** Varsayılan (ilk) sekme id */
export function getDefaultTabId(): string {
    return TABS[0]?.id ?? 'four-in-one';
}

/** Cmd+Digit ile sekme id döndürür; yoksa null */
export function getTabIdByShortcut(digit: number): string | null {
    const tab = TABS.find((t) => t.shortcut === digit);
    return tab?.id ?? null;
}
