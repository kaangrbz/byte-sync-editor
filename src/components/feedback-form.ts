/**
 * ByteSync Editor - Feedback Form
 * GitHub issue oluşturma ve feedback yönetimi
 */

interface AppConfig {
    version: string;
    name: string;
}

interface FormData {
    type: string;
    title: string;
    description: string;
    email?: string;
}

class FeedbackForm {
    private form: HTMLElement | null;
    private previewModal: HTMLElement | null;
    private previewContent: HTMLElement | null;
    private githubRepo: string;
    private appVersion: string;

    constructor(appConfig: AppConfig) {
        this.form = document.getElementById('feedback-form');
        this.previewModal = document.getElementById('preview-modal');
        this.previewContent = document.getElementById('preview-content');
        this.githubRepo = 'kaangrbz/byte-sync-editor';
        this.appVersion = appConfig.version;
        
        this.init();
    }
    
    init(): void {
        if (!this.form) return;
        
        // Form submit event
        (this.form as HTMLFormElement).addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Önizleme butonu
        const previewBtn = document.getElementById('preview-feedback');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }
        
        // Modal kapatma butonları
        const closeBtns = ['close-preview', 'close-preview-btn'];
        closeBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.hidePreview());
            }
        });
        
        // Modal dışına tıklama ile kapatma
        if (this.previewModal) {
            this.previewModal.addEventListener('click', (e) => {
                if (e.target === this.previewModal) {
                    this.hidePreview();
                }
            });
        }
        
        // GitHub'da oluştur butonu
        const createIssueBtn = document.getElementById('create-issue-btn');
        if (createIssueBtn) {
            createIssueBtn.addEventListener('click', () => this.createGitHubIssue());
        }
    }
    
    handleSubmit(e: Event): void {
        e.preventDefault();
        this.createGitHubIssue();
    }
    
    showPreview(): void {
        const formData = this.getFormData();
        if (!formData || !this.previewContent || !this.previewModal) return;
        
        const preview = this.generatePreview(formData);
        this.previewContent.innerHTML = preview;
        this.previewModal.classList.remove('hidden');
        this.previewModal.classList.add('flex');
    }
    
    hidePreview(): void {
        if (!this.previewModal) return;
        this.previewModal.classList.add('hidden');
        this.previewModal.classList.remove('flex');
    }
    
    getFormData(): FormData | null {
        if (!this.form) return null;
        
        const formData = new FormData(this.form as HTMLFormElement);
        const data: FormData = {
            type: formData.get('type') as string || '',
            title: formData.get('title') as string || '',
            description: formData.get('description') as string || '',
            email: formData.get('email') as string || undefined
        };
        
        // Validation
        if (!data.type || !data.title || !data.description) {
            alert('Please fill in all required fields.');
            return null;
        }
        
        return data;
    }
    
    generatePreview(data: FormData): string {
        const typeEmojis: Record<string, string> = {
            'bug': '🐛',
            'feature': '💡',
            'improvement': '⚡',
            'question': '❓',
            'other': '💬'
        };
        
        const typeLabels: Record<string, string> = {
            'bug': 'Bug Report',
            'feature': 'Feature Request',
            'improvement': 'Improvement Suggestion',
            'question': 'Question',
            'other': 'Other'
        };
        
        const emoji = typeEmojis[data.type] || '💬';
        const label = typeLabels[data.type] || 'Feedback';
        
        return `
            <div class="border rounded-lg p-4" style="border-color: var(--theme-border);">
                <div class="flex items-center mb-3">
                    <span class="text-2xl mr-2">${emoji}</span>
                    <h3 class="text-lg font-bold">${data.title}</h3>
                    <span class="ml-auto px-2 py-1 text-xs rounded" style="background-color: var(--theme-primary); color: white;">${label}</span>
                </div>
                <div class="prose max-w-none">
                    <p class="whitespace-pre-wrap">${data.description}</p>
                </div>
                ${data.email ? `<div class="mt-3 text-sm" style="color: var(--theme-textSecondary);">Contact: ${data.email}</div>` : ''}
            </div>
        `;
    }
    
    createGitHubIssue(): void {
        const formData = this.getFormData();
        if (!formData) return;
        
        const typeEmojis: Record<string, string> = {
            'bug': '🐛',
            'feature': '💡',
            'improvement': '⚡',
            'question': '❓',
            'other': '💬'
        };
        
        const emoji = typeEmojis[formData.type] || '💬';
        
        // GitHub issue URL'si oluştur
        const title = encodeURIComponent(`${emoji} ${formData.title}`);
        const body = this.generateIssueBody(formData);
        const labels = this.getLabelsForType(formData.type);
        
        const githubUrl = `https://github.com/${this.githubRepo}/issues/new?title=${title}&body=${encodeURIComponent(body)}&labels=${labels}`;
        
        // Open in new tab
        window.open(githubUrl, '_blank');
        
        // Show success message
        this.showSuccessMessage();
    }
    
    generateIssueBody(data: FormData): string {
        const typeLabels: Record<string, string> = {
            'bug': 'Bug Report',
            'feature': 'Feature Request',
            'improvement': 'Improvement Suggestion',
            'question': 'Question',
            'other': 'Feedback'
        };
        
        const label = typeLabels[data.type] || 'Feedback';
        
        let body = `## ${label}\n\n`;
        body += `**Description:**\n${data.description}\n\n`;
        
        if (data.email) {
            body += `**Contact:** ${data.email}\n\n`;
        }
        
        body += `---\n`;
        body += `**ByteSync Editor v${this.appVersion}**\n`;
        body += `**Submission Date:** ${new Date().toLocaleString('en-US')}\n`;
        
        if (data.type === 'bug') {
            body += `\n**Additional information for bug report:**\n`;
            body += `- App Version: ${this.appVersion}\n`;
            body += `- Operating System: ${navigator.platform}\n`;
            body += `- Browser: ${navigator.userAgent}\n`;
            body += `- Steps to reproduce:\n`;
            body += `  1. \n`;
            body += `  2. \n`;
            body += `  3. \n`;
            body += `\n**Expected behavior:**\n\n`;
            body += `**Actual behavior:**\n\n`;
        }
        
        return body;
    }
    
    getLabelsForType(type: string): string {
        const labelMap: Record<string, string> = {
            'bug': 'bug',
            'feature': 'enhancement',
            'improvement': 'enhancement',
            'question': 'question',
            'other': 'feedback'
        };
        
        return labelMap[type] || 'feedback';
    }
    
    showSuccessMessage(): void {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-all duration-300';
        notification.style.backgroundColor = 'var(--theme-success)';
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="text-xl mr-2">✅</span>
                <span>Opening GitHub page...</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Export
export { FeedbackForm };
export type { AppConfig, FormData };

