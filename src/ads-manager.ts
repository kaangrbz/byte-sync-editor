/**
 * ByteSync Editor - Google AdSense Manager
 * Reklam yönetimi ve yerleşim kontrolü
 */

import type { AdSenseConfig } from './types/index.js';
import { CookieConsent } from './components/cookie-consent.js';

export class AdsManager {
    private config: AdSenseConfig | null = null;
    private cookieConsent: CookieConsent;
    private scriptLoaded: boolean = false;
    private adUnitsCreated: Set<string> = new Set();

    constructor() {
        this.cookieConsent = new CookieConsent(() => {
            // Consent verildiğinde AdSense script'ini yükle
            this.loadAdSenseScript();
        });
    }

    /**
     * AdSense yapılandırmasını ayarla
     */
    setConfig(config: AdSenseConfig): void {
        this.config = config;
    }

    /**
     * AdSense'i başlat
     */
    async initialize(): Promise<void> {
        // Cookie consent kontrolü
        if (!this.cookieConsent.hasConsent()) {
            this.cookieConsent.showBanner();
            return; // Consent verilene kadar bekle
        }

        // Consent varsa script'i yükle
        await this.loadAdSenseScript();
    }

    /**
     * AdSense script'ini yükle
     */
    private async loadAdSenseScript(): Promise<void> {
        if (this.scriptLoaded) {
            return; // Script zaten yüklenmiş
        }

        if (!this.config) {
            console.warn('AdSense config bulunamadı');
            return;
        }

        // Script'i dinamik olarak yükle
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.publisherId}`;
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                this.scriptLoaded = true;
                console.log('AdSense script yüklendi');
                resolve();
            };
            script.onerror = () => {
                console.error('AdSense script yüklenemedi');
                reject(new Error('AdSense script yüklenemedi'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Reklam birimi oluştur
     */
    createAdUnit(placement: 'header' | 'sidebar' | 'footer' | 'inContent'): void {
        if (!this.config) {
            console.warn('AdSense config bulunamadı');
            return;
        }

        const adUnitId = this.config.adUnits[placement];
        if (!adUnitId) {
            console.warn(`${placement} için ad unit ID bulunamadı`);
            return;
        }

        if (this.adUnitsCreated.has(placement)) {
            return; // Zaten oluşturulmuş
        }

        // Container oluştur
        const container = document.createElement('div');
        container.className = `ads-container ads-${placement}`;
        container.id = `ads-${placement}`;

        // AdSense ad unit oluştur
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-client', this.config.publisherId);
        adUnit.setAttribute('data-ad-slot', adUnitId);
        adUnit.setAttribute('data-ad-format', 'auto');
        adUnit.setAttribute('data-full-width-responsive', 'true');

        container.appendChild(adUnit);

        // Container'ı sayfaya ekle
        this.insertAdContainer(placement, container);

        // AdSense script'i yüklendiyse push yap
        if (this.scriptLoaded && window.google?.ads?.adsbygoogle) {
            try {
                (window.google.ads.adsbygoogle as unknown[]).push({});
                this.adUnitsCreated.add(placement);
            } catch (e) {
                console.error('AdSense push hatası:', e);
            }
        } else {
            // Script yüklenene kadar bekle
            this.waitForScriptAndPush(adUnit, placement);
        }
    }

    /**
     * Script yüklenene kadar bekle ve push yap
     */
    private waitForScriptAndPush(adUnit: HTMLElement, placement: string): void {
        const checkInterval = setInterval(() => {
            if (this.scriptLoaded && window.google?.ads?.adsbygoogle) {
                clearInterval(checkInterval);
                try {
                    (window.google.ads.adsbygoogle as unknown[]).push({});
                    this.adUnitsCreated.add(placement);
                } catch (e) {
                    console.error('AdSense push hatası:', e);
                }
            }
        }, 100);

        // 10 saniye sonra timeout
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    /**
     * Reklam container'ını sayfaya ekle
     */
    private insertAdContainer(placement: string, container: HTMLElement): void {
        switch (placement) {
            case 'header':
                // Header'a ekle (sayfanın en üstüne)
                const header = document.querySelector('h1')?.parentElement;
                if (header) {
                    header.insertBefore(container, header.firstChild);
                }
                break;

            case 'sidebar':
                // Sidebar'a ekle (yan panel)
                const mainContent = document.querySelector('.max-w-4xl');
                if (mainContent) {
                    const sidebar = document.createElement('div');
                    sidebar.className = 'ads-sidebar';
                    sidebar.appendChild(container);
                    mainContent.parentElement?.insertBefore(sidebar, mainContent.nextSibling);
                }
                break;

            case 'footer':
                // Footer'a ekle (sayfanın en altına)
                document.body.appendChild(container);
                break;

            case 'inContent':
                // İçerik arasına ekle (tab content'lerin arasına)
                const tabContent = document.querySelector('.tab-content.active');
                if (tabContent) {
                    tabContent.appendChild(container);
                }
                break;
        }

        // Stil ekle
        this.addAdStyles();
    }

    /**
     * Reklam stillerini ekle
     */
    private addAdStyles(): void {
        if (document.getElementById('ads-styles')) {
            return; // Stil zaten eklenmiş
        }

        const style = document.createElement('style');
        style.id = 'ads-styles';
        style.textContent = `
            .ads-container {
                margin: 1rem 0;
                text-align: center;
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ads-header {
                margin-bottom: 2rem;
            }

            .ads-footer {
                margin-top: 2rem;
            }

            .ads-sidebar {
                position: fixed;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                width: 160px;
            }

            @media (max-width: 1024px) {
                .ads-sidebar {
                    display: none;
                }
            }

            .adsbygoogle {
                display: block;
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Tüm reklam birimlerini oluştur
     */
    createAllAdUnits(): void {
        if (!this.config) {
            return;
        }

        const placements: Array<'header' | 'sidebar' | 'footer' | 'inContent'> = 
            ['header', 'sidebar', 'footer', 'inContent'];

        placements.forEach(placement => {
            if (this.config!.adUnits[placement]) {
                this.createAdUnit(placement);
            }
        });
    }
}

