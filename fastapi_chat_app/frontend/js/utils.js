// 工具函数

// 显示提示消息
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `
        <i class="fa ${icon} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 格式化时间
export function formatTime(date) {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now - msgDate;

    if (diff < 60000) {
        return '刚刚';
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    } else {
        return msgDate.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
}

// 格式化文件大小
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 确认对话框
export function confirmDialog(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

// 滚动到底部
export function scrollToBottom(element) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

// 转义HTML
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 高亮文本
export function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${query})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

