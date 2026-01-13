/**
 * ByteSync Editor - Notification Helper
 * Bildirim sistemi helper'ı
 */

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationTypeConfig {
    icon: string;
    bg: string;
    color: string;
}

class NotificationHelper {
    // Bildirim tipleri
    private types: Record<NotificationType, NotificationTypeConfig> = {
        success: {
            icon: '✅',
            bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white'
        },
        info: {
            icon: '📈',
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
        },
        warning: {
            icon: '⚠️',
            bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white'
        },
        error: {
            icon: '❌',
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white'
        }
    };

    // Bildirim göster
    show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
        // Mevcut bildirimi kaldır
        const existingNotification = document.getElementById('app-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notificationType = this.types[type] || this.types.info;

        // Yeni bildirim oluştur
        const notification = document.createElement('div');
        notification.id = 'app-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${notificationType.bg};
                color: ${notificationType.color};
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                animation: slideInRight 0.3s ease-out;
                max-width: 300px;
                word-wrap: break-word;
            ">
                ${notificationType.icon} ${message}
            </div>
        `;

        // CSS animasyonu ekle (sadece bir kez)
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Belirtilen süre sonra kaldır
        setTimeout(() => {
            if (notification) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, duration);
    }

    // Özel bildirimler
    showExpansion(oldSize: number, newSize: number): void {
        this.show(`Array genişletildi: ${oldSize} → ${newSize} bytes`, 'info');
    }

    showSuccess(message: string): void {
        this.show(message, 'success');
    }

    showWarning(message: string): void {
        this.show(message, 'warning');
    }

    showError(message: string): void {
        this.show(message, 'error');
    }

    showInfo(message: string): void {
        this.show(message, 'info');
    }
}

// Singleton instance
const notificationHelperInstance = new NotificationHelper();

// Global olarak erişilebilir yap
declare global {
    interface Window {
        NotificationHelper: NotificationHelper;
    }
}

window.NotificationHelper = notificationHelperInstance;

export default notificationHelperInstance;

