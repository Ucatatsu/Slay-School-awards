// Toast Notification System

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    show(options) {
        const {
            type = 'info', // success, error, warning, info
            title = '',
            message = '',
            details = '',
            duration = 5000,
            closable = true
        } = options;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const icon = icons[type] || icons.info;

        // Build toast HTML
        let html = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
                ${details ? `<div class="toast-details">${details}</div>` : ''}
            </div>
        `;

        if (closable) {
            html += `<button class="toast-close">×</button>`;
        }

        toast.innerHTML = html;

        // Add to container
        this.container.appendChild(toast);

        // Close button handler
        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.hide(toast));
        }

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    hide(toast) {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(title, message, details = '') {
        return this.show({ type: 'success', title, message, details });
    }

    error(title, message, details = '') {
        return this.show({ type: 'error', title, message, details, duration: 7000 });
    }

    warning(title, message, details = '') {
        return this.show({ type: 'warning', title, message, details });
    }

    info(title, message, details = '') {
        return this.show({ type: 'info', title, message, details });
    }
}

// Create global instance
window.toast = new ToastManager();

// Export for modules
export default window.toast;
