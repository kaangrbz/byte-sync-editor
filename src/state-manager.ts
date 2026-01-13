/**
 * ByteSync Editor - State Manager
 * Global state yönetimi ve event emitter sistemi
 */

type StateListener = (state: AppState) => void;
type DataListener = (data: Uint8Array) => void;

interface AppState {
    data: Uint8Array;
    activeIndex: number;
    allSelected: boolean;
    touchedIndices: Set<number>;
}

class StateManager {
    private state: AppState;
    private listeners: Set<StateListener> = new Set();
    private dataListeners: Set<DataListener> = new Set();
    private onExpandCallback: ((oldSize: number, newSize: number) => void) | null = null;
    private onPositionUpdateCallback: (() => void) | null = null;

    constructor() {
        this.state = {
            data: new Uint8Array(256),
            activeIndex: -1,
            allSelected: false,
            touchedIndices: new Set<number>()
        };
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
        
        // Eski verileri kopyala
        for (let i = 0; i < Math.min(oldSize, newSize); i++) {
            newData[i] = oldData[i];
        }
        
        // Yeni alanları 0 ile doldur
        for (let i = oldSize; i < newSize; i++) {
            newData[i] = 0;
        }
        
        console.log(`Data array genişletildi: ${oldSize} → ${newSize} bytes`);
        
        this.state.data = newData;
        
        // Callback'leri çağır
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
        // Son 10 byte'ı kontrol et
        const lastBytes = this.state.data.slice(-10);
        const hasData = lastBytes.some(byte => byte !== 0);
        
        if (hasData && this.state.data.length < 1024) { // Maksimum 1024 byte
            const newSize = this.state.data.length * 2;
            this.expandDataArray(newSize);
            return true;
        }
        return false;
    }

    // Set byte at index
    setByte(index: number, value: number): void {
        if (index >= 0 && index < this.state.data.length) {
            this.state.data[index] = value;
            this.state.touchedIndices.add(index);
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

    // Clear all data
    clearAllData(): void {
        this.state.data.fill(0);
        this.state.touchedIndices.clear();
        this.state.activeIndex = -1;
        this.state.allSelected = false;
        
        // Array'i minimum boyuta düşür (256)
        if (this.state.data.length > 256) {
            this.state.data = new Uint8Array(256);
        }
        
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

