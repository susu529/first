import { documentsAPI, authAPI, clearAuthToken } from './api.js';
import { showToast, formatTime, confirmDialog } from './utils.js';

class DocumentsApp {
    constructor() {
        this.documents = [];
        this.currentUser = null;
		this.redirectTarget = 'documents.html';
		this.redirectTimer = null;
        this.init();
    }

    async init() {
        try {
            this.currentUser = await authAPI.profile();
        } catch (error) {
            showToast('请先登录', 'error');
            const params = new URLSearchParams();
            params.set('redirect', 'documents.html');
            window.location.href = `index.html?${params.toString()}`;
            return;
        }

        this.setupElements();
        this.setupEventListeners();
        await this.loadDocuments();
    }

    setupElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.documentsTable = document.getElementById('documentsTable');
        this.documentsBody = document.getElementById('documentsBody');
        this.refreshBtn = document.getElementById('refreshBtn');
    }

    setupEventListeners() {
        // 文件选择
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0]);
            }
        });

        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.uploadFile(files[0]);
            }
        });

        // 刷新按钮
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.loadDocuments();
            });
        }
    }

    async loadDocuments() {
        try {
            const response = await documentsAPI.list();
            this.documents = response.documents || [];
            this.renderDocuments();
        } catch (error) {
			if (this.handleAuthError(error)) return;
            showToast('加载文档列表失败: ' + error.message, 'error');
        }
    }

    async uploadFile(file) {
        if (!file.name.toLowerCase().endsWith('.txt')) {
            showToast('只支持txt文件', 'error');
            return;
        }

        // 显示上传中状态
        const originalText = this.uploadArea.querySelector('.upload-text').textContent;
        this.uploadArea.querySelector('.upload-text').textContent = '上传中...';
        this.uploadArea.style.pointerEvents = 'none';

        try {
            const response = await documentsAPI.upload(file);
            showToast(`文档 "${response.filename}" 上传成功！`, 'success');
            this.fileInput.value = '';
            await this.loadDocuments();
        } catch (error) {
			if (this.handleAuthError(error)) return;
            showToast('上传失败: ' + error.message, 'error');
        } finally {
            this.uploadArea.querySelector('.upload-text').textContent = originalText;
            this.uploadArea.style.pointerEvents = 'auto';
        }
    }

    async deleteDocument(documentId, filename) {
        confirmDialog(
            `确定要删除文档 "${filename}" 吗？`,
            async () => {
                try {
                    await documentsAPI.delete(documentId);
                    showToast('文档删除成功', 'success');
                    await this.loadDocuments();
                } catch (error) {
					if (this.handleAuthError(error)) return;
                    showToast('删除失败: ' + error.message, 'error');
                }
            }
        );
    }

    startChat(documentId) {
        window.location.href = `chat.html?document_id=${documentId}`;
    }

    renderDocuments() {
        if (this.documents.length === 0) {
            this.documentsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fa fa-folder-open"></i>
                        </div>
                        <div>暂无文档，请上传txt文件开始使用</div>
                    </td>
                </tr>
            `;
            return;
        }

        this.documentsBody.innerHTML = this.documents.map(doc => {
            const uploadTime = formatTime(doc.upload_time);
            return `
                <tr>
                    <td>${this.escapeHtml(doc.filename)}</td>
                    <td>${uploadTime}</td>
                    <td>${doc.chunks_count || 0}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn action-btn-chat" onclick="documentsApp.startChat('${doc.document_id}')">
                                <i class="fa fa-comments"></i> 开始聊天
                            </button>
                            <button class="action-btn action-btn-delete" onclick="documentsApp.deleteDocument('${doc.document_id}', '${this.escapeHtml(doc.filename)}')">
                                <i class="fa fa-trash"></i> 删除
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

	handleAuthError(error) {
		const message = error?.message || '';
		if (!message) return false;
		if (message.includes('未授权') || message.includes('未登录') || message.includes('登录已过期')) {
			showToast('登录已过期，请重新登录', 'error');
			clearAuthToken();
			clearTimeout(this.redirectTimer);
			this.redirectTimer = setTimeout(() => {
				const params = new URLSearchParams();
				params.set('redirect', this.redirectTarget);
				window.location.href = `index.html?${params.toString()}`;
			}, 800);
			return true;
		}
		return false;
	}
}

// 初始化应用
let documentsApp;
document.addEventListener('DOMContentLoaded', () => {
    documentsApp = new DocumentsApp();
});

