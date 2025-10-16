// Bildirim sistemi helper'ı
const NotificationHelper = {
    // Bildirim tipleri
    types: {
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
    },
    
    // Bildirim göster
    show: (message, type = 'info', duration = 3000) => {
        // Mevcut bildirimi kaldır
        const existingNotification = document.getElementById('app-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notificationType = NotificationHelper.types[type] || NotificationHelper.types.info;
        
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
    },
    
    // Özel bildirimler
    showExpansion: (oldSize, newSize) => {
        NotificationHelper.show(`Array genişletildi: ${oldSize} → ${newSize} bytes`, 'info');
    },
    
    showSuccess: (message) => {
        NotificationHelper.show(message, 'success');
    },
    
    showWarning: (message) => {
        NotificationHelper.show(message, 'warning');
    },
    
    showError: (message) => {
        NotificationHelper.show(message, 'error');
    },
    
    showInfo: (message) => {
        NotificationHelper.show(message, 'info');
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationHelper;
}
