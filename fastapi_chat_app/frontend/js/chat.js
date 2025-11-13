import { chatAPI, WebSocketClient, documentsAPI, authAPI, getAuthToken } from './api.js';
import { showToast, formatTime, scrollToBottom } from './utils.js';

class ChatApp {
    constructor() {
        this.currentDocumentId = null;
        this.wsClient = null;
        this.useWebSocket = false; // 默认使用REST，可通过UI切换
        this.messages = [];
        this.currentUser = null;
        this.recommendations = [];
        this.voiceActive = false;
        this.recognition = null;
        this.authToken = getAuthToken();
        this.storagePrefix = 'chat_guest';
        
        this.init();
    }

    async init() {
        try {
            this.currentUser = await authAPI.profile();
            if (this.currentUser?.user_id) {
                this.storagePrefix = `chat_${this.currentUser.user_id}`;
            }
            this.authToken = getAuthToken();
        } catch (error) {
            showToast('请先登录', 'error');
            const params = new URLSearchParams();
            params.set('redirect', 'chat.html');
            window.location.href = `index.html?${params.toString()}`;
            return;
        }

        this.setupElements();
        await this.loadDocuments();
        await this.loadRecommendations();
        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.loadFromLocalStorage();
    }

    setupElements() {
        this.navbar = document.querySelector('.navbar');
        this.statusElement = document.querySelector('.connection-status');
        this.documentSelector = document.getElementById('documentSelector'); // 可能为null
        this.messagesContainer = document.getElementById('messagesContainer');
        this.recommendationsContainer = document.getElementById('recommendationsContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.attachBtn = document.getElementById('attachBtn');
        this.wsToggleBtn = document.getElementById('wsToggleBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
    }

    async loadDocuments() {
        // 如果文档选择器不存在，跳过加载
        if (!this.documentSelector) {
            return;
        }
        
        try {
            const response = await documentsAPI.list();
            const documents = response.documents || [];
            
            this.documentSelector.innerHTML = '<option value="">选择文档...</option>';
            documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.document_id;
                option.textContent = `${doc.filename} (${doc.chunks_count} 块)`;
                this.documentSelector.appendChild(option);
            });

            // 如果有URL参数，自动选择文档
            const urlParams = new URLSearchParams(window.location.search);
            const docId = urlParams.get('document_id');
            if (docId) {
                this.documentSelector.value = docId;
                this.currentDocumentId = docId;
            }
        } catch (error) {
            if (this.handleAuthError(error)) {
                return;
            }
            showToast('加载文档列表失败: ' + error.message, 'error');
        }
    }

    async loadRecommendations() {
        if (!this.recommendationsContainer) {
            return;
        }
        try {
            const response = await chatAPI.getRecommendations();
            this.recommendations = response.recommendations || [];
            this.renderRecommendations();
        } catch (error) {
            if (this.handleAuthError(error)) {
                return;
            }
            console.warn('加载推荐问题失败:', error);
            this.recommendationsContainer.innerHTML = '<div class="recommendations-empty">暂时无法获取推荐问题</div>';
        }
    }

    renderRecommendations() {
        if (!this.recommendationsContainer) {
            return;
        }
        if (!this.recommendations.length) {
            this.recommendationsContainer.innerHTML = '<div class="recommendations-empty">暂无推荐问题</div>';
            return;
        }

        this.recommendationsContainer.innerHTML = this.recommendations
            .map((question) => {
                const safeQuestion = question.replace(/"/g, '&quot;');
                return `<button class="recommendation-chip" data-question="${safeQuestion}">${question}</button>`;
            })
            .join('');

        this.recommendationsContainer.querySelectorAll('.recommendation-chip').forEach((btn) => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question || btn.textContent;
                this.messageInput.value = question;
                this.messageInput.focus();
                this.messageInput.dispatchEvent(new Event('input'));
            });
        });
    }

    setupEventListeners() {
        // 文档选择（如果存在）
        if (this.documentSelector) {
            this.documentSelector.addEventListener('change', (e) => {
                this.currentDocumentId = e.target.value || null;
                // 如果使用WebSocket模式，重新连接
                if (this.useWebSocket) {
                    this.connectWebSocket();
                }
            });
        }
        
        // WebSocket切换按钮
        if (this.wsToggleBtn) {
            this.wsToggleBtn.addEventListener('click', () => {
                this.useWebSocket = !this.useWebSocket;
                this.wsToggleBtn.textContent = this.useWebSocket ? '使用REST' : '使用WebSocket';
                if (this.useWebSocket) {
                    this.connectWebSocket();
                } else {
                    this.disconnectWebSocket();
                }
            });
        }

        // 发送消息
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框自适应高度
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });

		// 语音输入
		if (this.voiceBtn) {
			this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
		}
    }

    connectWebSocket() {
        // document_id现在是可选的，允许无文档连接
        this.disconnectWebSocket();

        this.wsClient = new WebSocketClient(
            this.currentDocumentId, // 可以为null
            this.authToken,
            (data) => this.handleWebSocketMessage(data),
            (error) => {
                if (error?.message === 'unauthorized') {
                    this.handleAuthError(new Error('登录已过期'));
                } else {
                    showToast('WebSocket连接错误', 'error');
                }
                this.updateConnectionStatus(false);
            }
        );

        this.wsClient.connect();
        this.updateConnectionStatus(true);
    }

    disconnectWebSocket() {
        if (this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = null;
        }
        this.updateConnectionStatus(false);
    }

    handleWebSocketMessage(data) {
        if (data.type === 'connected') {
            this.updateConnectionStatus(true);
            showToast('WebSocket已连接', 'success');
        } else if (data.type === 'disconnected') {
            this.updateConnectionStatus(false);
        } else if (data.type === 'start') {
            this.addAssistantMessage('', true);
        } else if (data.type === 'chunk') {
            this.appendToLastMessage(data.content);
        } else if (data.type === 'end') {
            this.finishLastMessage();
        } else if (data.type === 'error') {
            showToast('错误: ' + data.message, 'error');
            this.removeTypingIndicator();
        }
    }

    updateConnectionStatus(connected) {
        if (this.statusElement) {
            this.statusElement.textContent = connected ? '已连接' : '未连接';
            this.statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // document_id现在是可选的，允许无文档聊天

        // 添加用户消息
        this.addUserMessage(message);
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.sendBtn.disabled = true;

        try {
            if (this.useWebSocket && this.wsClient && this.wsClient.isConnected()) {
                // 使用WebSocket - 发送消息和可选的document_id
                this.wsClient.send(message, this.currentDocumentId);
            } else {
                // 使用REST - 显示输入指示器
                this.showTypingIndicator();
                const response = await chatAPI.sendMessage(message, this.currentDocumentId);
                this.removeTypingIndicator();
                this.addAssistantMessage(response.response);
                
                // 显示相关片段（如果有）
                if (response.relevant_chunks && response.relevant_chunks.length > 0) {
                    this.addRelevantChunks(response.relevant_chunks);
                }
            }
        } catch (error) {
            if (!this.handleAuthError(error)) {
                showToast('发送消息失败: ' + error.message, 'error');
            }
            this.removeTypingIndicator();
        } finally {
            this.sendBtn.disabled = false;
        }
    }

    addUserMessage(content) {
        const message = {
            type: 'user',
            content,
            time: new Date(),
        };
        this.messages.push(message);
        this.renderMessage(message);
        this.saveToLocalStorage();
    }

    addAssistantMessage(content, isStreaming = false) {
        const message = {
            type: 'assistant',
            content,
            time: new Date(),
            streaming: isStreaming,
        };
        this.messages.push(message);
        this.renderMessage(message);
        if (!isStreaming) {
            this.saveToLocalStorage();
        }
    }

    appendToLastMessage(content) {
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.type === 'assistant') {
            lastMessage.content += content;
            const messageElement = this.messagesContainer.lastElementChild;
            if (messageElement) {
                const bubble = messageElement.querySelector('.message-bubble');
                if (bubble) {
                    bubble.textContent = lastMessage.content;
                }
            }
        }
    }

    finishLastMessage() {
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage) {
            lastMessage.streaming = false;
            this.saveToLocalStorage();
        }
        this.removeTypingIndicator();
    }

    addRelevantChunks(chunks) {
        const lastMessage = this.messagesContainer.lastElementChild;
        if (lastMessage && chunks.length > 0) {
            const chunksDiv = document.createElement('div');
            chunksDiv.className = 'relevant-chunks';
            chunksDiv.innerHTML = `
                <div class="relevant-chunks-title">相关片段：</div>
                ${chunks.map((chunk, index) => `
                    <div class="relevant-chunk">${index + 1}. ${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}</div>
                `).join('')}
            `;
            lastMessage.querySelector('.message-bubble').appendChild(chunksDiv);
        }
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${message.type}`;
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';
        
        // 如果是助手消息，添加头像
        if (message.type === 'assistant') {
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            const avatarImg = document.createElement('img');
            avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FF9EBB'/%3E%3Cpath d='M30 45 Q50 35 70 45 Q50 55 30 45' fill='%23FFFFFF'/%3E%3Ccircle cx='40' cy='45' r='3' fill='%236B5B6B'/%3E%3Ccircle cx='60' cy='45' r='3' fill='%236B5B6B'/%3E%3Cpath d='M35 60 Q50 70 65 60' stroke='%236B5B6B' stroke-width='2' fill='none'/%3E%3C/svg%3E";
            avatarImg.alt = '甜心助手';
            avatarImg.className = 'message-avatar-img';
            avatar.appendChild(avatarImg);
            contentWrapper.appendChild(avatar);
        }
        
        const textWrapper = document.createElement('div');
        textWrapper.className = 'message-text-wrapper';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = message.content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = formatTime(message.time);
        
        textWrapper.appendChild(bubble);
        textWrapper.appendChild(timeDiv);
        contentWrapper.appendChild(textWrapper);
        
        messageDiv.appendChild(contentWrapper);
        this.messagesContainer.appendChild(messageDiv);
        scrollToBottom(this.messagesContainer);
    }

    showTypingIndicator() {
        // 移除已存在的指示器
        this.removeTypingIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'message message-assistant typing-indicator';
        indicator.innerHTML = `
            <div class="message-content-wrapper">
                <div class="message-avatar">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FF9EBB'/%3E%3Cpath d='M30 45 Q50 35 70 45 Q50 55 30 45' fill='%23FFFFFF'/%3E%3Ccircle cx='40' cy='45' r='3' fill='%236B5B6B'/%3E%3Ccircle cx='60' cy='45' r='3' fill='%236B5B6B'/%3E%3Cpath d='M35 60 Q50 70 65 60' stroke='%236B5B6B' stroke-width='2' fill='none'/%3E%3C/svg%3E" alt="甜心助手" class="message-avatar-img">
                </div>
                <div class="message-text-wrapper">
                    <div class="message-bubble">
                        <div class="typing-dots">
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(indicator);
        scrollToBottom(this.messagesContainer);
    }

    removeTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(`${this.storagePrefix}_messages`, JSON.stringify(this.messages));
            localStorage.setItem(`${this.storagePrefix}_document_id`, this.currentDocumentId || '');
        } catch (error) {
            console.error('保存消息失败:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedMessages = localStorage.getItem(`${this.storagePrefix}_messages`);
            const savedDocId = localStorage.getItem(`${this.storagePrefix}_document_id`);
            
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages);
                this.messages.forEach(msg => {
                    msg.time = new Date(msg.time);
                    this.renderMessage(msg);
                });
            }
            
            if (savedDocId && this.documentSelector) {
                this.documentSelector.value = savedDocId;
                this.currentDocumentId = savedDocId;
            }
        } catch (error) {
            console.error('加载消息失败:', error);
        }
    }

    handleAuthError(error) {
        const message = error?.message || '';
        if (!message) {
            return false;
        }
        if (message.includes('未授权') || message.includes('未登录') || message.includes('登录已过期')) {
            showToast('登录已过期，请重新登录', 'error');
            setTimeout(() => {
                const params = new URLSearchParams();
                params.set('redirect', 'chat.html');
                window.location.href = `index.html?${params.toString()}`;
            }, 800);
            return true;
        }
        return false;
    }

    setupVoiceRecognition() {
        if (!this.voiceBtn) {
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.voiceBtn.style.display = 'none';
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.interimResults = false;
        this.recognition.continuous = false;

        this.recognition.onstart = () => {
            this.voiceActive = true;
            this.updateVoiceButton();
            showToast('正在聆听，请开始说话~', 'success');
        };

        this.recognition.onend = () => {
            this.voiceActive = false;
            this.updateVoiceButton();
        };

        this.recognition.onerror = (event) => {
            this.voiceActive = false;
            this.updateVoiceButton();
            showToast('语音识别失败: ' + event.error, 'error');
        };

        this.recognition.onresult = (event) => {
            if (!event.results || !event.results[0]) {
                return;
            }
            const transcript = event.results[0][0].transcript;
            const current = this.messageInput.value.trim();
            const next = current ? `${current} ${transcript}` : transcript;
            this.messageInput.value = next;
            this.messageInput.dispatchEvent(new Event('input'));
        };
    }

    updateVoiceButton() {
        if (!this.voiceBtn) return;
        const icon = this.voiceBtn.querySelector('i');
        if (!icon) return;
        if (this.voiceActive) {
            this.voiceBtn.classList.add('voice-active');
            icon.className = 'fa fa-stop';
        } else {
            this.voiceBtn.classList.remove('voice-active');
            icon.className = 'fa fa-microphone';
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            showToast('当前浏览器不支持语音输入', 'error');
            return;
        }
        if (this.voiceActive) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('语音识别启动失败:', error);
                showToast('语音识别启动失败', 'error');
            }
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});

