/**
 * ByteSync Editor - PWA Update Manager
 * PWA güncelleme kontrolü ve bildirimi
 */

class PWAUpdateManager {
    private updateAvailable: boolean = false;
    private registration: ServiceWorkerRegistration | null = null;

    constructor() {
        this.init();
    }

    async init(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('./sw.js');
                
                // Service Worker mesajlarını dinle
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                        this.showUpdateNotification();
                    }
                });

                // Güncelleme kontrolü
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration?.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    }
                });

                // Sayfa yüklendiğinde güncelleme kontrolü
                this.checkForUpdates();
            } catch (error) {
                // Service Worker kayıt hatası - sessizce geç
                console.warn('Service Worker kayıt hatası:', error);
            }
        }
    }

    async checkForUpdates(): Promise<void> {
        if (this.registration) {
            try {
                await this.registration.update();
            } catch (error) {
                // Güncelleme kontrolü hatası - sessizce geç
                console.warn('Güncelleme kontrolü hatası:', error);
            }
        }
    }

    showUpdateNotification(): void {
        if (this.updateAvailable) return; // Zaten gösterilmiş
        
        this.updateAvailable = true;
        
        // Güncelleme bildirimi oluştur
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-notification">
                <div class="update-content">
                    <div class="update-icon">🔄</div>
                    <div class="update-text">
                        <h3>Yeni Güncelleme Mevcut!</h3>
                        <p>ByteSync Editor'ün yeni bir sürümü mevcut. Güncellemek için sayfayı yenileyin.</p>
                    </div>
                    <div class="update-actions">
                        <button id="update-now-btn" class="update-btn primary">Şimdi Güncelle</button>
                        <button id="update-later-btn" class="update-btn secondary">Daha Sonra</button>
                    </div>
                </div>
            </div>
        `;

        // Stil ekle (sadece bir kez)
        if (!document.getElementById('pwa-update-styles')) {
            const style = document.createElement('style');
            style.id = 'pwa-update-styles';
            style.textContent = `
                #pwa-update-notification {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    z-index: 10000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    animation: slideDown 0.3s ease-out;
                }
                
                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                
                @keyframes slideUp {
                    from { transform: translateY(0); }
                    to { transform: translateY(-100%); }
                }
                
                .update-notification {
                    padding: 16px 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .update-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .update-icon {
                    font-size: 24px;
                    animation: spin 2s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .update-text {
                    flex: 1;
                }
                
                .update-text h3 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .update-text p {
                    margin: 0;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .update-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .update-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .update-btn.primary {
                    background: #4CAF50;
                    color: white;
                }
                
                .update-btn.primary:hover {
                    background: #45a049;
                    transform: translateY(-1px);
                }
                
                .update-btn.secondary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                }
                
                .update-btn.secondary:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                @media (max-width: 768px) {
                    .update-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 12px;
                    }
                    
                    .update-actions {
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Event listener'ları ekle
        const updateNowBtn = document.getElementById('update-now-btn');
        const updateLaterBtn = document.getElementById('update-later-btn');
        
        if (updateNowBtn) {
            updateNowBtn.addEventListener('click', () => {
                this.performUpdate();
            });
        }

        if (updateLaterBtn) {
            updateLaterBtn.addEventListener('click', () => {
                this.hideUpdateNotification();
            });
        }

        // 10 saniye sonra otomatik gizle
        setTimeout(() => {
            if (this.updateAvailable) {
                this.hideUpdateNotification();
            }
        }, 10000);
    }

    hideUpdateNotification(): void {
        const notification = document.getElementById('pwa-update-notification');
        if (notification) {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
                this.updateAvailable = false;
            }, 300);
        }
    }

    async performUpdate(): Promise<void> {
        try {
            // Service Worker'ı yenile
            if (this.registration && this.registration.waiting) {
                this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Hard refresh yap
            window.location.reload();
        } catch (error) {
            // Hata durumunda normal refresh
            window.location.reload();
        }
    }
}

// Export
export { PWAUpdateManager };

