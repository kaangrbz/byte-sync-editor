/**
 * ByteSync Editor - Grid Manager (v2 — sifirdan yazim)
 *
 * Tek yonlu veri akisi:  user input → parse → stateManager.setByte → syncView (state→DOM)
 *
 * Katmanlar:
 *   1. FORMAT CONFIG   — format sabitleri
 *   2. DOM HELPERS      — grid ref'leri, aktif tab/input erisimleri
 *   3. GRID LIFECYCLE   — createGrid, recreateAllGrids, initializeGrids
 *   4. RENDER           — syncView  (state → DOM, her zaman tum hucreler)
 *   5. INPUT HANDLING   — beforeInput, input, blur, paste
 *   6. NAVIGATION       — focusCell, handleKeydown
 *   7. SELECTION        — selectAllCells, clearAllSelection, clearAllCells
 *   8. PUBLIC API       — export (dis modullerle uyumlu)
 */

import stateManager from './state-manager.js';
import { parseTextToBytes, formatBytesToText } from './utils.js';
import type { GridFormat } from './types/index.js';
import { getSettings } from './settings.js';

const enc = () => getSettings().encoding;

// ─── 1. FORMAT CONFIG ──────────────────────────────────────────────────────────

const FORMAT: Record<GridFormat, {
  maxLen: number;
  validate: (char: string, current: string) => boolean;
  isComplete: (val: string) => boolean;
  className: string;
}> = {
  ascii: {
    maxLen: 1,
    validate: () => true,
    isComplete: (v) => v.length === 1,
    className: 'ascii-cell',
  },
  hex: {
    maxLen: 2,
    validate: (c, cur) => /^[0-9a-fA-F]$/.test(c) && cur.length < 2,
    isComplete: (v) => /^[0-9a-fA-F]{2}$/.test(v),
    className: 'hex-cell',
  },
  decimal: {
    maxLen: 3,
    validate: (c, cur) => /^\d$/.test(c) && cur.length < 3,
    isComplete: (v) => {
      if (!/^\d{3}$/.test(v)) return false;
      const n = parseInt(v, 10);
      return n >= 0 && n <= 255;
    },
    className: 'decimal-cell',
  },
  binary: {
    maxLen: 8,
    validate: (c, cur) => /^[01]$/.test(c) && cur.length < 8,
    isComplete: (v) => /^[01]{8}$/.test(v),
    className: 'binary-cell',
  },
};

// ─── 2. DOM HELPERS ─────────────────────────────────────────────────────────────

let hexGrid: HTMLElement | null = null;
let asciiGrid: HTMLElement | null = null;
let decimalGrid: HTMLElement | null = null;
let binaryGrid: HTMLElement | null = null;

// Global temizleme sonrasi bir sonraki paste'in her zaman index 0'dan baslamasi icin bayrak
let wasClearedForPaste: boolean = false;

const GRID_MAP: Record<string, () => HTMLElement | null> = {
  hex: () => hexGrid,
  ascii: () => asciiGrid,
  decimal: () => decimalGrid,
  binary: () => binaryGrid,
};

const BYTE_GRID_TABS: readonly string[] = ['hex', 'ascii', 'decimal', 'binary'];

const getActiveTab = (): HTMLElement | null =>
  document.querySelector('.tab-content.active');

const getActiveByteGridTabName = (): string | null => {
  const id = getActiveTab()?.id ?? '';
  const name = id.replace(/-tab$/, '');
  return BYTE_GRID_TABS.includes(name) ? name : null;
};

const getActiveInput = (index: number): HTMLInputElement | null =>
  getActiveTab()?.querySelector(`[data-index="${index}"]`) as HTMLInputElement | null;

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(v, max));

// ─── 3. GRID LIFECYCLE ─────────────────────────────────────────────────────────

function createGrid(container: HTMLElement, type: GridFormat): void {
  container.innerHTML = '';
  const inputCount = stateManager.getInputCount();
  const data = stateManager.getData();
  if (inputCount > data.length) {
    stateManager.expandDataArray(Math.max(data.length * 2, inputCount));
  }
  const cfg = FORMAT[type];
  for (let i = 0; i < inputCount; i++) {
    const el = document.createElement('input');
    el.type = 'text';
    el.className = `input-cell ${cfg.className}`;
    el.dataset.index = String(i);
    el.dataset.type = type;
    el.setAttribute('aria-label', `Byte ${i}, ${type}`);
    el.value = '';

    el.addEventListener('focus', handleFocus);
    el.addEventListener('blur', handleBlur);
    el.addEventListener('beforeinput', handleBeforeInput);
    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', handleKeydown);
    el.addEventListener('paste', handlePaste);

    container.appendChild(el);
  }
}

function clearAllGridContainers(): void {
  if (hexGrid) hexGrid.innerHTML = '';
  if (asciiGrid) asciiGrid.innerHTML = '';
  if (decimalGrid) decimalGrid.innerHTML = '';
  if (binaryGrid) binaryGrid.innerHTML = '';
}

const recreateAllGrids = (): void => {
  if (!hexGrid || !asciiGrid || !decimalGrid || !binaryGrid) return;
  const activeName = getActiveByteGridTabName();
  clearAllGridContainers();
  if (activeName) {
    const gridEl = GRID_MAP[activeName]?.();
    if (gridEl) createGrid(gridEl, activeName as GridFormat);
  }
  syncView();
};

const initializeGrids = (
  hex: HTMLElement | null,
  ascii: HTMLElement | null,
  decimal: HTMLElement | null,
  binary: HTMLElement | null,
): void => {
  hexGrid = hex;
  asciiGrid = ascii;
  decimalGrid = decimal;
  binaryGrid = binary;
  if (hexGrid && asciiGrid && decimalGrid && binaryGrid) {
    recreateAllGrids();
  }
};

// ─── 4. RENDER — syncView ──────────────────────────────────────────────────────

/**
 * State → DOM tek yonlu render.
 * focusIdx verilirse o hucreye focus atilir.
 */
function syncView(focusIdx?: number): void {
  const data = stateManager.getData();
  const touched = stateManager.getTouchedIndices();
  const activeIdx = focusIdx ?? stateManager.getActiveIndex();

  const allInputs = document.querySelectorAll('.input-cell') as NodeListOf<HTMLInputElement>;
  allInputs.forEach((el) => {
    const i = parseInt(el.dataset.index || '0', 10);
    const type = (el.dataset.type || 'hex') as GridFormat;
    const byte = data[i];

    el.classList.remove('highlight', 'cr-character', 'lf-character');

    if (byte === undefined || byte === null) { el.value = ''; return; }
    if (byte === 0 && !touched.has(i)) { el.value = ''; return; }

    if (type === 'ascii') {
      el.value = formatBytesToText([byte], 'ascii', '', enc());
    } else {
      const txt = formatBytesToText([byte], type, '');
      el.value = type === 'hex' ? txt.toUpperCase() : txt;
    }

    if (byte === 13) el.classList.add('cr-character');
    else if (byte === 10) el.classList.add('lf-character');
  });

  // Highlight
  if (activeIdx >= 0) {
    const hlEl = getActiveInput(activeIdx);
    if (hlEl) hlEl.classList.add('highlight');
  }

  // Focus
  if (focusIdx !== undefined && focusIdx >= 0) {
    const target = getActiveInput(focusIdx);
    if (target) {
      target.focus();
      if (getSettings().selectOnFocus) target.select();
    }
  }

  updatePositionIndicator();
}

// ─── Position Indicator ────────────────────────────────────────────────────────

const updatePositionIndicator = (): void => {
  const total = stateManager.getDataSize();
  const idx = stateManager.getActiveIndex();
  const pos = idx >= 0 ? idx + 1 : 0;
  const txt = `${pos} / ${total}`;

  const container = document.getElementById('position-indicator');
  if (!container) {
    return;
  }

  const input = container.querySelector<HTMLInputElement>('#position-input') ||
    container.querySelector<HTMLInputElement>('input');
  const totalEl = container.querySelector<HTMLSpanElement>('#position-total');

  if (input) {
    input.value = String(pos);
  }

  if (totalEl) {
    totalEl.textContent = String(total);
  }

  if (!input && !totalEl) {
    container.textContent = txt;
  }
};

// ─── 5. INPUT HANDLING ─────────────────────────────────────────────────────────

function handleFocus(e: Event): void {
  const el = e.target as HTMLInputElement;
  if (stateManager.getAllSelected()) clearAllSelection();
  const idx = parseInt(el.dataset.index || '0', 10);
  stateManager.setActiveIndex(idx);

  // Onceki highlight'i kaldir, yenisini ekle
  document.querySelectorAll('.input-cell.highlight').forEach((h) => h.classList.remove('highlight'));
  el.classList.add('highlight');
  updatePositionIndicator();

  if (getSettings().selectOnFocus) el.select();
}

function handleBlur(e: Event): void {
  const el = e.target as HTMLInputElement;
  const idx = parseInt(el.dataset.index || '0', 10);
  const type = (el.dataset.type || 'hex') as GridFormat;
  const raw = type === 'ascii' ? el.value : el.value.trim();

  if (raw.length === 0) {
    stateManager.setByte(idx, 0);
    return;
  }
  const bytes = parseTextToBytes(raw, type, enc());
  if (bytes.length === 1) {
    stateManager.setByte(idx, bytes[0]);
    return;
  }
  // Gecersiz — state'teki degeri geri yukle
  const cur = stateManager.getByte(idx);
  const restored = formatBytesToText([cur], type, '', enc());
  el.value = type === 'hex' ? restored.toUpperCase() : restored;
}

function handleBeforeInput(e: InputEvent): void {
  const el = e.target as HTMLInputElement;
  const type = el.dataset.type as GridFormat;
  const char = e.data || '';
  if (!char) return; // silme islemlerine izin ver

  const selStart = el.selectionStart || 0;
  const selEnd = el.selectionEnd || 0;
  const before = el.value.slice(0, selStart);
  const after = el.value.slice(selEnd);

  if (!FORMAT[type].validate(char, before)) { e.preventDefault(); return; }

  // Decimal 0-255 aralik kontrolu
  if (type === 'decimal') {
    const next = before + char + after;
    const n = parseInt(next, 10);
    if (isNaN(n) || n < 0 || n > 255) { e.preventDefault(); return; }
  }
}

function handleInput(e: Event): void {
  const el = e.target as HTMLInputElement;
  const idx = parseInt(el.dataset.index || '0', 10);
  const type = el.dataset.type as GridFormat;
  const value = el.value;

  if (value.length === 0) {
    stateManager.setByte(idx, 0);
    const sizeChanged = stateManager.getInputCount() !== document.querySelectorAll('.input-cell').length;
    if (sizeChanged) {
      recreateAllGrids();
      focusCell(Math.min(idx, stateManager.getInputCount() - 1));
    } else {
      syncView(idx);
    }
    return;
  }

  const bytes = parseTextToBytes(value, type, enc());
  if (bytes.length === 0) { el.value = ''; return; }

  const countBefore = stateManager.getInputCount();
  const settings = getSettings();
  const hasDataAfter = stateManager.getDataSize() > idx + 1;

  // INSERT modu
  if (settings.insertMode && hasDataAfter) {
    stateManager.insertByteAt(idx, bytes[0]);
    recreateAllGrids();
    const next = type === 'ascii' ? idx + bytes.length : idx;
    focusCell(next);
    return;
  }

  // Normal overwrite
  stateManager.setByte(idx, bytes[0]);

  const countAfter = stateManager.getInputCount();
  if (countAfter !== countBefore) recreateAllGrids();
  else syncView(idx);

  // Auto-advance: max uzunluga ulasinca sonraki hucreye gec
  if (settings.autoAdvance && FORMAT[type].isComplete(value)) {
    setTimeout(() => focusCell(idx + 1), 30);
  }
}

function handlePaste(e: ClipboardEvent): void {
  e.preventDefault();
  const text = e.clipboardData?.getData('text/plain') || '';
  if (!text) return;

  if (stateManager.getAllSelected()) {
    pasteToAllSelected(text);
    return;
  }

  const el = e.target as HTMLInputElement;
  const rawStartIdx = parseInt(el.dataset.index || '0', 10);
  console.log('[GRID] handlePaste start. rawStartIdx=', rawStartIdx, 'wasClearedForPaste=', wasClearedForPaste);
  // Ekran yeni temizlendiyse, paste her zaman 0. index'ten baslasin
  const startIdx = wasClearedForPaste ? 0 : rawStartIdx;
  wasClearedForPaste = false;

  const type = (el.dataset.type || 'hex') as GridFormat;
  let bytes = parseTextToBytes(text, type, enc());
  console.log('[GRID] handlePaste parsed bytes=', bytes, 'length=', bytes.length, 'startIdx=', startIdx);

  for (let i = 0; i < bytes.length; i++) {
    const gi = startIdx + i;
    if (gi >= stateManager.getData().length) {
      stateManager.expandDataArray(Math.max(stateManager.getData().length * 2, gi + 1));
    }
    stateManager.setByte(gi, bytes[i]);
  }
  recreateAllGrids();
  focusCell(startIdx + bytes.length);
}

// ─── 6. NAVIGATION — focusCell + handleKeydown ─────────────────────────────────

function focusCell(index: number): void {
  const count = stateManager.getInputCount();
  const clamped = clamp(index, 0, count - 1);
  const el = getActiveInput(clamped);
  if (el) {
    el.focus();
  }
}

function handleKeydown(e: KeyboardEvent): void {
  // Ctrl/Cmd kombinasyonlari document seviyesine birak
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code.startsWith('Digit')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && stateManager.getAllSelected()) return;

  // Cmd+Enter → CR
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const idx = parseInt((e.target as HTMLElement).dataset.index || '0', 10);
    stateManager.setByte(idx, 13);
    syncView();
    setTimeout(() => focusCell(idx + 1), 10);
    return;
  }
  // Cmd+Shift+Enter → LF
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
    e.preventDefault();
    const idx = parseInt((e.target as HTMLElement).dataset.index || '0', 10);
    stateManager.setByte(idx, 10);
    syncView();
    setTimeout(() => focusCell(idx + 1), 10);
    return;
  }

  if (stateManager.getAllSelected()) return;

  const el = e.target as HTMLInputElement;
  const idx = parseInt(el.dataset.index || '0', 10);
  const isEmpty = el.value === '';
  const type = el.dataset.type as string;

  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      if (idx === stateManager.getInputCount() - 1) {
        stateManager.insertByteAt(stateManager.getDataSize(), 0);
        recreateAllGrids();
        setTimeout(() => focusCell(stateManager.getInputCount() - 1), 10);
      } else {
        focusCell(idx + 1);
      }
      return;

    case 'Backspace':
      if (!isEmpty) return; // native siler, handleInput tetiklenir
      e.preventDefault();
      if (idx > 0) {
        // Kendinden sonra veri yoksa hucreyi kaldir
        if (idx < stateManager.getDataSize() && stateManager.getDataSize() > 1) {
          stateManager.removeByteAt(idx);
          recreateAllGrids();
        }
        setTimeout(() => focusCell(idx - 1), 10);
      }
      return;

    case 'Delete':
      if (!isEmpty) return; // native siler
      e.preventDefault();
      if (idx < stateManager.getDataSize() && stateManager.getDataSize() > 1) {
        stateManager.removeByteAt(idx);
        recreateAllGrids();
      }
      if (idx > 0) setTimeout(() => focusCell(idx - 1), 10);
      return;

    case ' ':
      if (type === 'ascii') return; // bosluk karakteri olarak yazilir
      e.preventDefault();
      stateManager.insertByteAt(idx, 0);
      recreateAllGrids();
      setTimeout(() => focusCell(idx), 10);
      return;

    case 'ArrowLeft':
      e.preventDefault();
      focusCell(idx - 1);
      return;

    case 'ArrowRight':
      e.preventDefault();
      if (idx === stateManager.getInputCount() - 1) {
        stateManager.insertByteAt(stateManager.getDataSize(), 0);
        recreateAllGrids();
        setTimeout(() => focusCell(idx + 1), 10);
      } else {
        focusCell(idx + 1);
      }
      return;

    case 'ArrowUp':
      e.preventDefault();
      focusCell(0);
      return;

    case 'ArrowDown':
      e.preventDefault();
      focusCell(stateManager.getInputCount() - 1);
      return;
  }
}

// ─── 7. SELECTION ──────────────────────────────────────────────────────────────

const selectAllCells = (): void => {
  stateManager.setAllSelected(true);
  document.querySelectorAll('.input-cell').forEach((el) => el.classList.add('all-selected'));
};

const clearAllSelection = (): void => {
  stateManager.setAllSelected(false);
  document.querySelectorAll('.input-cell').forEach((el) => el.classList.remove('all-selected'));
};

const clearAllCells = (): void => {
  console.log('[GRID] clearAllCells called. dataSize=', stateManager.getDataSize());
  stateManager.clearAllData();
  clearAllSelection();
  recreateAllGrids();
  wasClearedForPaste = true;
  setTimeout(() => focusCell(0), 50);
};

function pasteToAllSelected(text: string): void {
  const type = (getActiveTab()?.querySelector('.input-cell') as HTMLElement)?.dataset.type || 'hex';
  console.log('[GRID] pasteToAllSelected called. type=', type, 'rawText=', text);
  let bytes = parseTextToBytes(text, type as GridFormat, enc());
  console.log('[GRID] pasteToAllSelected parsed bytes=', bytes, 'length=', bytes.length);
  stateManager.clearAllData();
  wasClearedForPaste = true;
  for (let i = 0; i < bytes.length; i++) {
    if (i >= stateManager.getData().length) {
      stateManager.expandDataArray(Math.max(stateManager.getData().length * 2, i + 1));
    }
    stateManager.setByte(i, bytes[i]);
  }
  clearAllSelection();
  recreateAllGrids();
  console.log('[GRID] pasteToAllSelected finished. dataSize=', stateManager.getDataSize());
}

// ─── Jump to index ─────────────────────────────────────────────────────────────

const jumpToIndex = (index: number): void => {
  const count = stateManager.getInputCount();
  const clamped = clamp(index, 0, count - 1);
  focusCell(clamped);
  const el = getActiveInput(clamped);
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
};

// ─── 8. PUBLIC API ─────────────────────────────────────────────────────────────

export {
  initializeGrids,
  recreateAllGrids,
  syncView as updateAllViews,
  updatePositionIndicator,
  clearAllCells,
  selectAllCells,
  clearAllSelection,
  jumpToIndex,
};
