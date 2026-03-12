/**
 * ByteSync Editor - Ayarlar (tek kaynak, localStorage ile kalıcı)
 * Varsayılan: sonraki hücreye geç açık; INSERT modu ve odakta metni seç kapalı.
 */

const STORAGE_KEY = 'bytesync-settings';

export type TextEncoding = 'utf-8' | 'iso-8859-9';

export interface AppSettings {
    /** Değer tamamlanınca sonraki hücreye otomatik geç */
    autoAdvance: boolean;
    /** Sonrasında veri varken yeni byte ekleyip sonrakileri kaydır (INSERT modu) */
    insertMode: boolean;
    /** Hücreye odaklanınca metni otomatik seç */
    selectOnFocus: boolean;
    /** Metin ↔ byte dönüşümünde kullanılan karakter kodlaması */
    encoding: TextEncoding;
}

const DEFAULTS: AppSettings = {
    autoAdvance: true,
    insertMode: false,
    selectOnFocus: false,
    encoding: 'utf-8',
};

let cache: AppSettings | null = null;

function isValidEncoding(value: unknown): value is TextEncoding {
    return value === 'utf-8' || value === 'iso-8859-9';
}

function loadFromStorage(): AppSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<AppSettings>;

            return {
                autoAdvance: typeof parsed.autoAdvance === 'boolean' ? parsed.autoAdvance : DEFAULTS.autoAdvance,
                insertMode: typeof parsed.insertMode === 'boolean' ? parsed.insertMode : DEFAULTS.insertMode,
                selectOnFocus: typeof parsed.selectOnFocus === 'boolean' ? parsed.selectOnFocus : DEFAULTS.selectOnFocus,
                encoding: isValidEncoding(parsed.encoding) ? parsed.encoding : DEFAULTS.encoding,
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
        encoding: isValidEncoding(partial.encoding) ? partial.encoding : current.encoding,
    };
    saveToStorage(cache);
}

export function getDefaultSettings(): AppSettings {
    return { ...DEFAULTS };
}
