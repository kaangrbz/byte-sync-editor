/**
 * ByteSync Editor - Tema Yönetimi
 * Light ve Dark tema desteği ile localStorage entegrasyonu
 */

import type { ThemeConfig, ThemeColors } from './types/index.js';

type ThemeName = 'light' | 'dark';

class ThemeManager {
    private currentTheme: ThemeName;
    private themes: Record<ThemeName, ThemeConfig>;

    constructor() {
        this.currentTheme = (this.getStoredTheme() as ThemeName) || 'dark';
        this.themes = {
            light: {
                name: 'Light',
                icon: '☀️',
                colors: {
                    primary: '#3b82f6',
                    primaryHover: '#2563eb',
                    secondary: '#6b7280',
                    secondaryHover: '#4b5563',
                    background: '#ffffff',
                    surface: '#f9fafb',
                    surfaceHover: '#f3f4f6',
                    text: '#111827',
                    textSecondary: '#6b7280',
                    border: '#e5e7eb',
                    borderFocus: '#3b82f6',
                    success: '#10b981',
                    successHover: '#059669',
                    danger: '#ef4444',
                    dangerHover: '#dc2626',
                    warning: '#f59e0b',
                    warningHover: '#d97706',
                    input: '#ffffff',
                    inputFocus: '#f0f9ff',
                    zeroValue: '#9ca3af'
                }
            },
            dark: {
                name: 'Dark',
                icon: '🌙',
                colors: {
                    primary: '#6366f1',
                    primaryHover: '#4f46e5',
                    secondary: '#6b7280',
                    secondaryHover: '#4b5563',
                    background: '#1a1a1a',
                    surface: '#1f2937',
                    surfaceHover: '#374151',
                    text: '#f9fafb',
                    textSecondary: '#d1d5db',
                    border: '#374151',
                    borderFocus: '#6366f1',
                    success: '#10b981',
                    successHover: '#059669',
                    danger: '#ef4444',
                    dangerHover: '#dc2626',
                    warning: '#f59e0b',
                    warningHover: '#d97706',
                    input: '#2b2b2b',
                    inputFocus: '#4b4b4b',
                    zeroValue: '#7d7d7d'
                }
            }
        };
        
        this.init();
    }

    init(): void {
        this.applyTheme(this.currentTheme);
        this.createThemeButton();
        this.bindEvents();
    }

    getStoredTheme(): string | null {
        try {
            const stored = localStorage.getItem('bytesync-theme');
            // Eğer tema kaydedilmemişse dark döndür
            return stored || 'dark';
        } catch (e) {
            console.warn('localStorage erişilemiyor:', e);
            return 'dark';
        }
    }

    setStoredTheme(theme: string): void {
        try {
            localStorage.setItem('bytesync-theme', theme);
        } catch (e) {
            console.warn('localStorage yazılamıyor:', e);
        }
    }

    applyTheme(themeName: ThemeName): void {
        if (!this.themes[themeName]) {
            console.warn(`Bilinmeyen tema: ${themeName}`);
            return;
        }

        this.currentTheme = themeName;
        this.setStoredTheme(themeName);
        
        const theme = this.themes[themeName];
        const root = document.documentElement;
        
        // CSS custom properties ile tema renklerini hemen uygula (hızlı)
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });

        // Body ve html class'ını güncelle
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
        document.documentElement.classList.add(`theme-${themeName}`);
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        // Tema butonunu güncelle
        this.updateThemeButton();
        
        // Tüm input hücrelerini güncelle
        this.updateInputCells();
    }

    updateInputCells(): void {
        const inputs = document.querySelectorAll<HTMLInputElement>('.input-cell');
        inputs.forEach(input => {
            const value = parseInt(input.value, 10);
            if (value === 0) {
                input.classList.add('zero-value');
            } else {
                input.classList.remove('zero-value');
            }
        });
    }

    createThemeButton(): void {
        // Mevcut tema butonunu kaldır
        const existingButton = document.getElementById('theme-toggle');
        if (existingButton) {
            existingButton.remove();
        }

        // Tersine çevir: mevcut tema değil, geçiş yapılacak tema gösterilsin
        const nextTheme: ThemeName = this.currentTheme === 'dark' ? 'light' : 'dark';
        const nextThemeData = this.themes[nextTheme];
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle-btn';
        button.innerHTML = `
            <span class="theme-icon">${nextThemeData.icon}</span>
            <span class="theme-text">${nextThemeData.name}</span>
        `;
        
        // Başlık kısmına ekle
        const header = document.querySelector('h1')?.parentElement;
        if (header) {
            header.appendChild(button);
        }
    }

    updateThemeButton(): void {
        const button = document.getElementById('theme-toggle');
        if (button) {
            // Tersine çevir: mevcut tema değil, geçiş yapılacak tema gösterilsin
            const nextTheme: ThemeName = this.currentTheme === 'dark' ? 'light' : 'dark';
            const nextThemeData = this.themes[nextTheme];
            button.innerHTML = `
                <span class="theme-icon">${nextThemeData.icon}</span>
                <span class="theme-text">${nextThemeData.name}</span>
            `;
        }
    }

    bindEvents(): void {
        document.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('#theme-toggle')) {
                this.toggleTheme();
            }
        });
    }

    toggleTheme(): void {
        const newTheme: ThemeName = this.currentTheme === 'dark' ? 'light' : 'dark';
        console.log(`Tema değiştiriliyor: ${this.currentTheme} -> ${newTheme}`);
        this.applyTheme(newTheme);
        
        // Smooth transition efekti
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    getCurrentTheme(): ThemeName {
        return this.currentTheme;
    }

    getThemeColors(): ThemeColors {
        return this.themes[this.currentTheme].colors;
    }
}

// Global olarak erişilebilir yap
declare global {
    interface Window {
        ThemeManager: typeof ThemeManager;
    }
}

window.ThemeManager = ThemeManager;

export default ThemeManager;

