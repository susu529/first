// API配置 - 自动检测基础URL
const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        if (window.__API_BASE_URL__) {
            return window.__API_BASE_URL__;
        }
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            return window.location.origin;
        }
    }
    return 'http://localhost:8000';
};

const getWSBaseURL = () => {
    if (typeof window !== 'undefined' && window.__WS_BASE_URL__) {
        return window.__WS_BASE_URL__;
    }
    const base = getBaseURL();
    return base.replace(/^http/, 'ws');
};

export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token, username) => {
    localStorage.setItem('auth_token', token);
    if (username) {
        localStorage.setItem('auth_username', username);
    }
};
export const clearAuthToken = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
};

// API工具函数
class ApiClient {
    constructor() {
        this.baseURL = getBaseURL();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                if (response.status === 401) {
                    clearAuthToken();
                }
                const error = await response.json().catch(() => ({ detail: '请求失败' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async uploadFile(endpoint, file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${getBaseURL()}${endpoint}`;
        const headers = {};
        const token = getAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    clearAuthToken();
                }
                const error = await response.json().catch(() => ({ detail: '上传失败' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('文件上传错误:', error);
            throw error;
        }
    }
}

// 文档API
export const documentsAPI = {
    // 获取文档列表
    async list() {
        const client = new ApiClient();
        return client.get('/api/documents/');
    },

    // 上传文档
    async upload(file) {
        const client = new ApiClient();
        return client.uploadFile('/api/documents/upload', file);
    },

    // 删除文档
    async delete(documentId) {
        const client = new ApiClient();
        return client.delete(`/api/documents/${documentId}`);
    },
};

// 聊天API
export const chatAPI = {
    // 发送消息（REST）
    async sendMessage(message, documentId = null) {
        const client = new ApiClient();
        const payload = { message };
        if (documentId) {
            payload.document_id = documentId;
        }
        return client.post('/api/chat/message', payload);
    },

    async getRecommendations() {
        const client = new ApiClient();
        return client.get('/api/chat/recommendations');
    },
};

// 认证API
export const authAPI = {
    async register(username, password) {
        const client = new ApiClient();
        return client.post('/api/auth/register', { username, password });
    },

    async login(username, password) {
        const client = new ApiClient();
        return client.post('/api/auth/login', { username, password });
    },

    async profile() {
        const client = new ApiClient();
        try {
            const res = await client.get('/api/auth/me');
            return res.user;
        } catch (error) {
            clearAuthToken();
            throw error;
        }
    },
};

// WebSocket客户端
export class WebSocketClient {
    constructor(documentId, token, onMessage, onError) {
        this.documentId = documentId;
        this.token = token;
        this.onMessage = onMessage;
        this.onError = onError;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        // 构建WebSocket URL，如果documentId或token存在则作为查询参数
        let url = `${getWSBaseURL()}/ws/chat`;
        const params = new URLSearchParams();
        if (this.documentId) {
            params.append('document_id', this.documentId);
        }
        if (this.token) {
            params.append('token', this.token);
        }
        const query = params.toString();
        if (query) {
            url += `?${query}`;
        }
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('WebSocket连接已建立');
            this.reconnectAttempts = 0;
            if (this.onMessage) {
                this.onMessage({ type: 'connected' });
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (this.onMessage) {
                    this.onMessage(data);
                }
            } catch (error) {
                console.error('解析WebSocket消息失败:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            if (this.onError) {
                this.onError(error);
            }
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket连接已关闭', event.code);
            if (this.onMessage) {
                this.onMessage({ type: 'disconnected' });
            }
            if (event.code === 1008) {
                // 授权失败，不再重连
                if (this.onError) {
                    this.onError(new Error('unauthorized'));
                }
                return;
            }
            // 自动重连
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(() => {
                    console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    this.connect();
                }, 1000 * this.reconnectAttempts);
            }
        };
    }

    send(message, documentId = null) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const payload = {
                type: 'message',
                content: message,
            };
            // 如果提供了documentId，添加到消息中（优先级高于连接时的documentId）
            if (documentId) {
                payload.document_id = documentId;
            }
            if (this.token) {
                payload.token = this.token;
            }
            this.ws.send(JSON.stringify(payload));
        } else {
            console.error('WebSocket未连接');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

