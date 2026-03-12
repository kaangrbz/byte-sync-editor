/**
 * ByteSync Editor - State Manager
 * Global state yönetimi ve event emitter sistemi.
 *
 * Tek byte dizisi mantığı (referans: komut editörü _current_data):
 * - Gerçek "komut verisi" getEffectiveData() ile alınır: sadece dolu byte'lar, sondaki boş yok.
 * - Kaydet / kopyala / gönder hep getEffectiveData() kullanmalı.
 * - data + touchedIndices grid için; getDataSize() = efektif uzunluk, getInputCount() = getDataSize() + 1 (son boş hücre).
 */

type StateListener = (state: AppState) => void;
type DataListener = (data: Uint8Array) => void;

interface AppState {
    data: Uint8Array;
    activeIndex: number;
    allSelected: boolean;
    touchedIndices: Set<number>;
}

const SHOW_EXPLICIT_ZEROS_KEY = 'bytesync-show-explicit-zeros';

class StateManager {
    private state: AppState;
    private listeners: Set<StateListener> = new Set();
    private dataListeners: Set<DataListener> = new Set();
    private onExpandCallback: ((oldSize: number, newSize: number) => void) | null = null;
    private onPositionUpdateCallback: (() => void) | null = null;
    private showExplicitZeros: boolean = false;

    constructor() {
        this.state = {
            data: new Uint8Array(256),
            activeIndex: -1,
            allSelected: false,
            touchedIndices: new Set<number>()
        };
        try {
            const stored = localStorage.getItem(SHOW_EXPLICIT_ZEROS_KEY);
            this.showExplicitZeros = stored === 'true';
        } catch {
            // ignore
        }
    }

    getShowExplicitZeros(): boolean {
        return this.showExplicitZeros;
    }

    setShowExplicitZeros(value: boolean): void {
        if (this.showExplicitZeros === value) return;
        this.showExplicitZeros = value;
        try {
            localStorage.setItem(SHOW_EXPLICIT_ZEROS_KEY, String(value));
        } catch {
            // ignore
        }
        if (!value) {
            const toRemove: number[] = [];
            this.state.touchedIndices.forEach((i) => {
                if (this.state.data[i] === 0) toRemove.push(i);
            });
            toRemove.forEach((i) => this.state.touchedIndices.delete(i));
        }
        this.notifyDataListeners();
        this.notifyListeners();
    }

    // State getters
    getState(): AppState {
        return {
            data: this.state.data.slice(),
            activeIndex: this.state.activeIndex,
            allSelected: this.state.allSelected,
            touchedIndices: new Set(this.state.touchedIndices)
        };
    }

    getData(): Uint8Array {
        return this.state.data;
    }

    /**
     * Komut editörü tek kaynak mantığı (referans: _current_data).
     * Sadece dolu byte'lar; sondaki boş hücreler dahil değil.
     * Kaydet / kopyala / gönder hep bu diziyi kullanmalı.
     */
    getEffectiveData(): Uint8Array {
        const size = this.getDataSize();
        return this.state.data.slice(0, size);
    }

    getActiveIndex(): number {
        return this.state.activeIndex;
    }

    getAllSelected(): boolean {
        return this.state.allSelected;
    }

    getTouchedIndices(): Set<number> {
        return new Set(this.state.touchedIndices);
    }

    // State setters
    setData(data: Uint8Array): void {
        this.state.data = data;
        this.notifyDataListeners();
        this.notifyListeners();
    }

    /** Dosyadan yüklenen veriyi state'e yazar ve tüm index'leri touched yapar (grid tam gösterilir). */
    loadData(data: Uint8Array): void {
        if (data.length > this.state.data.length) {
            this.expandDataArray(data.length);
        }
        const len = data.length;
        for (let i = 0; i < len; i++) {
            this.state.data[i] = data[i];
        }
        this.state.touchedIndices.clear();
        for (let i = 0; i < len; i++) {
            this.state.touchedIndices.add(i);
        }
        this.state.activeIndex = -1;
        this.state.allSelected = false;
        this.notifyDataListeners();
        this.notifyListeners();
    }

    setActiveIndex(index: number): void {
        this.state.activeIndex = index;
        this.notifyListeners();
    }

    setAllSelected(selected: boolean): void {
        this.state.allSelected = selected;
        this.notifyListeners();
    }

    addTouchedIndex(index: number): void {
        this.state.touchedIndices.add(index);
        this.notifyListeners();
    }

    clearTouchedIndices(): void {
        this.state.touchedIndices.clear();
        this.notifyListeners();
    }

    // Data size calculations
    getDataSize(): number {
        if (this.state.touchedIndices.size === 0) {
            return 1; // Hiç veri girilmemişse minimum 1
        }
        // En yüksek index'i bul ve +1 ekle (1-based)
        const maxIndex = Math.max(...Array.from(this.state.touchedIndices));
        return maxIndex + 1;
    }

    getInputCount(): number {
        return this.getDataSize() + 1;
    }

    // Data array expansion
    expandDataArray(newSize: number): void {
        const oldData = this.state.data;
        const oldSize = oldData.length;
        const newData = new Uint8Array(newSize);

        for (let i = 0; i < Math.min(oldSize, newSize); i++) {
            newData[i] = oldData[i];
        }

        for (let i = oldSize; i < newSize; i++) {
            newData[i] = 0;
        }

        this.state.data = newData;

        if (this.onExpandCallback) {
            this.onExpandCallback(oldSize, newSize);
        }

        if (this.onPositionUpdateCallback) {
            this.onPositionUpdateCallback();
        }

        this.notifyDataListeners();
        this.notifyListeners();
    }

    checkAndExpandIfNeeded(): boolean {
        const lastBytes = this.state.data.slice(-10);
        const hasData = lastBytes.some(byte => byte !== 0);

        if (!hasData) {
            return false;
        }

        const newSize = this.state.data.length * 2;
        this.expandDataArray(newSize);

        return true;
    }

    // Set byte at index
    setByte(index: number, value: number): void {
        if (index >= 0 && index < this.state.data.length) {
            this.state.data[index] = value;
            if (value === 0) {
                if (this.showExplicitZeros) {
                    this.state.touchedIndices.add(index);
                } else {
                    this.state.touchedIndices.delete(index);
                }
            } else {
                this.state.touchedIndices.add(index);
            }
            this.notifyDataListeners();
            this.notifyListeners();
        }
    }

    // Get byte at index
    getByte(index: number): number {
        if (index >= 0 && index < this.state.data.length) {
            return this.state.data[index];
        }
        return 0;
    }

    /** Verilen index'e byte ekler, o index ve sonrakileri bir sağa kaydırır (Space ile boş hücre ekleme) */
    insertByteAt(index: number, value: number = 0): void {
        const data = this.state.data;
        const len = data.length;
        if (index < 0) return;
        const newSize = len + 1;
        const newData = new Uint8Array(newSize);
        for (let i = 0; i < index && i < len; i++) newData[i] = data[i];
        newData[index] = value;
        for (let i = index; i < len; i++) newData[i + 1] = data[i];
        this.state.data = newData;
        const newTouched = new Set<number>();
        this.state.touchedIndices.forEach((i) => {
            if (i >= index) newTouched.add(i + 1);
            else newTouched.add(i);
        });
        if (value !== 0) newTouched.add(index);
        this.state.touchedIndices = newTouched;
        this.notifyDataListeners();
        this.notifyListeners();
    }

    /** Verilen index'teki byte'ı kaldırır, sağdakileri bir sola kaydırır, son pozisyonu 0 yapar (boş hücrede Backspace/Delete) */
    removeByteAt(index: number): void {
        const data = this.state.data;
        const len = data.length;
        if (index < 0 || index >= len) return;
        if (this.getDataSize() <= 1) return;

        for (let i = index; i < len - 1; i++) {
            data[i] = data[i + 1];
        }
        data[len - 1] = 0;

        const newTouched = new Set<number>();
        this.state.touchedIndices.forEach((i) => {
            if (i === index) return;
            if (i === len - 1) return;
            if (i > index) newTouched.add(i - 1);
            else newTouched.add(i);
        });
        this.state.touchedIndices = newTouched;
        this.notifyDataListeners();
        this.notifyListeners();
    }

    // Clear all data
    clearAllData(): void {
        this.state.data.fill(0);
        this.state.touchedIndices.clear();
        this.state.activeIndex = -1;
        this.state.allSelected = false;

        this.notifyDataListeners();
        this.notifyListeners();
    }

    // Reset to initial state
    reset(): void {
        this.state = {
            data: new Uint8Array(256),
            activeIndex: -1,
            allSelected: false,
            touchedIndices: new Set<number>()
        };
        this.notifyDataListeners();
        this.notifyListeners();
    }

    // Event listeners
    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    subscribeToData(listener: DataListener): () => void {
        this.dataListeners.add(listener);
        return () => {
            this.dataListeners.delete(listener);
        };
    }

    // Callback setters
    setOnExpand(callback: (oldSize: number, newSize: number) => void): void {
        this.onExpandCallback = callback;
    }

    setOnPositionUpdate(callback: () => void): void {
        this.onPositionUpdateCallback = callback;
    }

    private notifyListeners(): void {
        const state = this.getState();
        this.listeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    private notifyDataListeners(): void {
        const data = this.state.data.slice();
        this.dataListeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Data listener error:', error);
            }
        });
    }
}

// Singleton instance
const stateManager = new StateManager();

// Export singleton instance
export default stateManager;

// Export class for testing
export { StateManager };

// Export types
export type { AppState, StateListener, DataListener };

