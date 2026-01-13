/**
 * ByteSync Editor - TypeScript Tip Tanımları
 */

// Grid format tipleri
export type GridFormat = 'ascii' | 'hex' | 'decimal' | 'binary';

// Delimiter seçenekleri
export type DelimiterOption = 'none' | 'comma' | 'space' | 'custom';

// PTP data yapıları
export interface PTPBlock {
  id: string;
  name: string;
  data: Uint8Array;
}

export interface PTPParsedData {
  sendBlocks: PTPBlock[];
  receiveBlocks: PTPBlock[];
}

// File dialog seçenekleri
export interface FileDialogOptions {
  title?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: string[];
}

// File dialog sonucu
export interface FileDialogResult {
  canceled: boolean;
  filePaths?: string[];
  fileContent?: string;
  fileName?: string;
  error?: string;
}

// AdSense yapılandırması
export interface AdSenseConfig {
  publisherId: string;
  adUnits: {
    header?: string;
    sidebar?: string;
    footer?: string;
    inContent?: string;
  };
}

// Cookie consent durumu
export interface CookieConsentState {
  accepted: boolean;
  timestamp: number;
  version: string;
}

// Google AdSense API tipleri (global window objesi için)
declare global {
  interface Window {
    google?: {
      ads?: {
        adsbygoogle?: unknown[];
      };
    };
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description?: string;
        accept?: Record<string, string[]>;
      }>;
      excludeAcceptAllOption?: boolean;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

// Electron API tipleri (kaldırılacak ama şimdilik tanımlı)
export interface ElectronAPI {
  openDevTools?: () => void;
  isDeveloperMode?: () => boolean;
  showOpenDialog?: (options: FileDialogOptions) => Promise<FileDialogResult>;
}

// Data analiz sonuçları
export interface DataAnalysisResult {
  totalBytes: number;
  nonZeroBytes: number;
  uniqueBytes: number;
  entropy: string;
  mostFrequent: string[];
  patterns: {
    repeats: number;
    sequences: number;
    asciiChars: number;
    controlChars: number;
  };
}

// Tema renkleri
export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  border: string;
  borderFocus: string;
  success: string;
  successHover: string;
  danger: string;
  dangerHover: string;
  warning: string;
  warningHover: string;
  input: string;
  inputFocus: string;
  zeroValue: string;
}

// Tema yapılandırması
export interface ThemeConfig {
  name: string;
  icon: string;
  colors: ThemeColors;
}

// Notification helper tipleri
export interface NotificationOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

