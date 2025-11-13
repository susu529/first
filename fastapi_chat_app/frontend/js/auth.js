import { authAPI, setAuthToken, clearAuthToken, getAuthToken } from './api.js';
import { showToast } from './utils.js';

class AuthPage {
	constructor() {
		this.loginForm = document.getElementById('loginForm');
		this.registerForm = document.getElementById('registerForm');
		this.tabButtons = document.querySelectorAll('.tab-button');
		this.authRequiredBlocks = document.querySelectorAll('.auth-required');
		this.currentUser = null;
		this.redirectTarget = this.getRedirectTarget();
		this.init();
	}

	getRedirectTarget() {
		const params = new URLSearchParams(window.location.search);
		const redirect = params.get('redirect');
		if (!redirect) {
			return 'chat.html';
		}
		// 防止打开非本站链接
		if (redirect.startsWith('http')) {
			return 'chat.html';
		}
		return redirect;
	}

	init() {
		this.setupTabs();
		this.setupForms();
		this.checkLoginStatus();
	}

	setupTabs() {
		this.tabButtons.forEach((button) => {
			button.addEventListener('click', () => {
				const target = button.dataset.tab;
				this.switchTab(target);
			});
		});
	}

	switchTab(tab) {
		this.tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
		this.loginForm.classList.toggle('active', tab === 'login');
		this.registerForm.classList.toggle('active', tab === 'register');
	}

	setupForms() {
		if (this.loginForm) {
			this.loginForm.addEventListener('submit', async (event) => {
				event.preventDefault();
				const formData = new FormData(this.loginForm);
				const username = formData.get('username')?.toString().trim();
				const password = formData.get('password')?.toString();
				if (!username || !password) {
					showToast('请输入用户名和密码', 'error');
					return;
				}
				try {
					const result = await authAPI.login(username, password);
					setAuthToken(result.token, result.username);
					showToast('登录成功，欢迎回来！', 'success');
					window.location.href = this.redirectTarget;
				} catch (error) {
					showToast(error.message || '登录失败，请检查用户名或密码', 'error');
				}
			});
		}

		if (this.registerForm) {
			this.registerForm.addEventListener('submit', async (event) => {
				event.preventDefault();
				const formData = new FormData(this.registerForm);
				const username = formData.get('username')?.toString().trim();
				const password = formData.get('password')?.toString();
				const confirmPassword = formData.get('passwordConfirm')?.toString();
				if (!username || !password || !confirmPassword) {
					showToast('请完整填写注册信息', 'error');
					return;
				}
				if (password !== confirmPassword) {
					showToast('两次输入的密码不一致', 'error');
					return;
				}
				try {
					await authAPI.register(username, password);
					const result = await authAPI.login(username, password);
					setAuthToken(result.token, result.username);
					showToast('注册成功，已自动登录', 'success');
					window.location.href = this.redirectTarget;
				} catch (error) {
					showToast(error.message || '注册失败', 'error');
				}
			});
		}
	}

	async checkLoginStatus() {
		const token = getAuthToken();
		if (!token) {
			this.toggleAuthRequired(false);
			return;
		}
		try {
			const user = await authAPI.profile();
			this.currentUser = user;
			this.toggleAuthRequired(true);
			showToast(`欢迎回来，${user.username}！`, 'success');
		} catch (error) {
			clearAuthToken();
			this.toggleAuthRequired(false);
		}
	}

	toggleAuthRequired(isLoggedIn) {
		this.authRequiredBlocks.forEach((block) => {
			block.classList.toggle('hidden', !isLoggedIn);
		});
		if (!isLoggedIn) {
			this.switchTab('login');
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new AuthPage();
});

