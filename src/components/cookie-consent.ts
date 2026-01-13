/**
 * ByteSync Editor - Cookie Consent Component
 * GDPR uyumlu cookie consent banner
 */

import type { CookieConsentState } from '../types/index.js';

const CONSENT_STORAGE_KEY = 'bytesync-cookie-consent';
const CONSENT_VERSION = '1.0';

export class CookieConsent {
    private bannerElement: HTMLElement | null = null;
    private onAcceptCallback?: () => void;

    constructor(onAccept?: () => void) {
        this.onAcceptCallback = onAccept;
    }

    /**
     * Cookie consent durumunu kontrol et
     */
    hasConsent(): boolean {
        const consent = this.getStoredConsent();
        return consent?.accepted === true && consent?.version === CONSENT_VERSION;
    }

    /**
     * localStorage'dan consent durumunu al
     */
    private getStoredConsent(): CookieConsentState | null {
        try {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as CookieConsentState;
            }
        } catch (e) {
            console.warn('Cookie consent bilgisi okunamadı:', e);
        }
        return null;
    }

    /**
     * Consent durumunu kaydet
     */
    private saveConsent(accepted: boolean): void {
        try {
            const consent: CookieConsentState = {
                accepted,
                timestamp: Date.now(),
                version: CONSENT_VERSION
            };
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
        } catch (e) {
            console.warn('Cookie consent bilgisi kaydedilemedi:', e);
        }
    }

    /**
     * Banner'ı göster (eğer consent verilmemişse)
     */
    showBanner(): void {
        if (this.hasConsent()) {
            return; // Zaten consent verilmiş
        }

        if (this.bannerElement) {
            return; // Banner zaten gösteriliyor
        }

        this.createBanner();
    }

    /**
     * Banner'ı oluştur
     */
    private createBanner(): void {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h3>🍪 Çerez Kullanımı</h3>
                    <p>Bu web sitesi, deneyiminizi iyileştirmek ve reklamları göstermek için çerezler kullanır. 
                    Devam ederek çerez kullanımını kabul etmiş olursunuz.</p>
                </div>
                <div class="cookie-consent-buttons">
                    <button id="cookie-consent-accept" class="cookie-consent-btn cookie-consent-accept">
                        Kabul Et
                    </button>
                    <button id="cookie-consent-reject" class="cookie-consent-btn cookie-consent-reject">
                        Reddet
                    </button>
                </div>
            </div>
        `;

        // Stil ekle
        this.addStyles();

        // Event listener'ları ekle
        banner.querySelector('#cookie-consent-accept')?.addEventListener('click', () => {
            this.accept();
        });

        banner.querySelector('#cookie-consent-reject')?.addEventListener('click', () => {
            this.reject();
        });

        document.body.appendChild(banner);
        this.bannerElement = banner;

        // Animasyon için
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }

    /**
     * CSS stillerini ekle
     */
    private addStyles(): void {
        if (document.getElementById('cookie-consent-styles')) {
            return; // Stil zaten eklenmiş
        }

        const style = document.createElement('style');
        style.id = 'cookie-consent-styles';
        style.textContent = `
            .cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--theme-surface, #1f2937);
                border-top: 2px solid var(--theme-border, #374151);
                padding: 1.5rem;
                z-index: 10000;
                box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
                transform: translateY(100%);
                transition: transform 0.3s ease;
            }

            .cookie-consent-banner.show {
                transform: translateY(0);
            }

            .cookie-consent-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2rem;
            }

            .cookie-consent-text {
                flex: 1;
            }

            .cookie-consent-text h3 {
                margin: 0 0 0.5rem 0;
                color: var(--theme-text, #f9fafb);
                font-size: 1.1rem;
            }

            .cookie-consent-text p {
                margin: 0;
                color: var(--theme-textSecondary, #d1d5db);
                font-size: 0.9rem;
                line-height: 1.5;
            }

            .cookie-consent-buttons {
                display: flex;
                gap: 1rem;
            }

            .cookie-consent-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.5rem;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .cookie-consent-accept {
                background: var(--theme-primary, #3b82f6);
                color: white;
            }

            .cookie-consent-accept:hover {
                background: var(--theme-primaryHover, #2563eb);
            }

            .cookie-consent-reject {
                background: var(--theme-secondary, #6b7280);
                color: white;
            }

            .cookie-consent-reject:hover {
                background: var(--theme-secondaryHover, #4b5563);
            }

            @media (max-width: 768px) {
                .cookie-consent-content {
                    flex-direction: column;
                    text-align: center;
                }

                .cookie-consent-buttons {
                    width: 100%;
                }

                .cookie-consent-btn {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Consent'i kabul et
     */
    private accept(): void {
        this.saveConsent(true);
        this.hideBanner();
        if (this.onAcceptCallback) {
            this.onAcceptCallback();
        }
    }

    /**
     * Consent'i reddet
     */
    private reject(): void {
        this.saveConsent(false);
        this.hideBanner();
    }

    /**
     * Banner'ı gizle
     */
    private hideBanner(): void {
        if (this.bannerElement) {
            this.bannerElement.classList.remove('show');
            setTimeout(() => {
                if (this.bannerElement && this.bannerElement.parentNode) {
                    this.bannerElement.parentNode.removeChild(this.bannerElement);
                }
                this.bannerElement = null;
            }, 300);
        }
    }
}

