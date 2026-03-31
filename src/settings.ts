/**
 * ByteSync Editor - Ayarlar (tek kaynak, localStorage ile kalıcı)
 * Varsayılan: sonraki hücreye geç açık; INSERT modu ve odakta metni seç kapalı.
 */

const STORAGE_KEY = 'bytesync-settings';

export type ConversionMode = 'character' | 'byte';

export interface AppSettings {
    /** Değer tamamlanınca sonraki hücreye otomatik geç */
    autoAdvance: boolean;
    /** Sonrasında veri varken yeni byte ekleyip sonrakileri kaydır (INSERT modu) */
    insertMode: boolean;
    /** Hücreye odaklanınca metni otomatik seç */
    selectOnFocus: boolean;
    /** Dönüşüm modu: karakter bazlı (varsayılan) veya legacy byte */
    conversionMode: ConversionMode;
}

const DEFAULTS: AppSettings = {
    autoAdvance: true,
    insertMode: false,
    selectOnFocus: false,
    conversionMode: 'character',
};

let cache: AppSettings | null = null;

function loadFromStorage(): AppSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<AppSettings>;
            return {
                autoAdvance: typeof parsed.autoAdvance === 'boolean' ? parsed.autoAdvance : DEFAULTS.autoAdvance,
                insertMode: typeof parsed.insertMode === 'boolean' ? parsed.insertMode : DEFAULTS.insertMode,
                selectOnFocus: typeof parsed.selectOnFocus === 'boolean' ? parsed.selectOnFocus : DEFAULTS.selectOnFocus,
                conversionMode: parsed.conversionMode === 'byte' ? 'byte' : 'character',
            };
        }
    } catch {
        // ignore
    }
    return { ...DEFAULTS };
}

function saveToStorage(s: AppSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
        // ignore
    }
}

export function getSettings(): AppSettings {
    if (!cache) {
        cache = loadFromStorage();
    }
    return { ...cache };
}

export function setSettings(partial: Partial<AppSettings>): void {
    const current = getSettings();
    cache = {
        autoAdvance: partial.autoAdvance ?? current.autoAdvance,
        insertMode: partial.insertMode ?? current.insertMode,
        selectOnFocus: partial.selectOnFocus ?? current.selectOnFocus,
        conversionMode: partial.conversionMode ?? current.conversionMode,
    };
    saveToStorage(cache);
}

export function getDefaultSettings(): AppSettings {
    return { ...DEFAULTS };
}
