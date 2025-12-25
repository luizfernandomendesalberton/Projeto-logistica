// JavaScript para sistema de autenticação
class AuthManager {
    constructor() {
        this.isAdmin = false;
        this.currentUser = null;
        this.initializeAuth();
        this.initializeEventListeners();
    }

    initializeAuth() {
        // Verificar se há sessão ativa
        this.checkActiveSession();
        
        // Configurar modais
        this.setupModals();
        
        // Verificar suporte ao NFC
        this.checkNFCSupport();
    }

    initializeEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Toggle de senha
        const passwordToggle = document.getElementById('toggle-password');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePassword());
        }

        // Botão de acesso admin
        const adminBtn = document.getElementById('admin-login-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.showAdminModal());
        }

        // Botão de login NFC
        const nfcLoginBtn = document.getElementById('nfc-login-btn');
        if (nfcLoginBtn) {
            nfcLoginBtn.addEventListener('click', () => this.handleNFCLogin());
        }

        // Modal de administrador
        const adminModal = document.getElementById('admin-modal');
        if (adminModal) {
            const cancelBtn = adminModal.querySelector('.btn-cancel');
            const adminLoginBtn = adminModal.querySelector('.btn-admin-login');
            const adminForm = document.getElementById('admin-login-form');
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeAdminModal());
            }
            
            if (adminLoginBtn) {
                adminLoginBtn.addEventListener('click', () => this.handleAdminLogin());
            }
            
            if (adminForm) {
                adminForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleAdminLogin();
                });
            }
        }

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('admin-modal');
            if (modal && e.target === modal) {
                this.closeAdminModal();
            }
        });
        
        // Fechar modal com botão X
        const modalCloseBtn = document.querySelector('#admin-modal .close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeAdminModal());
        }
    }

    async checkActiveSession() {
        try {
            const response = await fetch('/api/auth/check-session', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.currentUser = data.user;
                    // Redirecionar para o sistema se já estiver logado
                    if (data.user.is_admin) {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/';
                    }
                }
            }
        } catch (error) {
            console.log('Nenhuma sessão ativa encontrada');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        if (!username || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        this.showLoading('Realizando login...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    remember: remember,
                    is_admin: this.isAdmin
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                this.showSuccess('Login realizado com sucesso!');
                
                // Aguardar um pouco para mostrar o sucesso
                setTimeout(() => {
                    if (this.isAdmin || data.user.is_admin) {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/';
                    }
                }, 1000);
            } else {
                this.hideLoading();
                this.showError(data.message || 'Erro ao realizar login');
                
                // Limpar senha em caso de erro
                document.getElementById('password').value = '';
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Erro de conexão. Tente novamente.');
            console.error('Erro no login:', error);
        }
    }

    async handleNFCLogin() {
        if (!this.isNFCSupported()) {
            this.showError('NFC não é suportado neste dispositivo');
            return;
        }

        this.showLoading('Aguardando cartão NFC...');

        try {
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.addEventListener('reading', async (event) => {
                try {
                    const decoder = new TextDecoder();
                    let nfcData = '';

                    for (const record of event.message.records) {
                        if (record.recordType === 'text') {
                            nfcData = decoder.decode(record.data);
                            break;
                        }
                    }

                    if (!nfcData) {
                        this.hideLoading();
                        this.showError('Cartão NFC não contém dados de usuário válidos');
                        return;
                    }

                    // Tentar fazer login com dados do NFC
                    await this.authenticateWithNFC(nfcData);
                    
                } catch (error) {
                    this.hideLoading();
                    this.showError('Erro ao ler cartão NFC');
                    console.error('Erro NFC:', error);
                }
            });

            // Timeout para leitura NFC
            setTimeout(() => {
                this.hideLoading();
                this.showError('Tempo limite para leitura do cartão excedido');
            }, 10000);

        } catch (error) {
            this.hideLoading();
            this.showError('Erro ao ativar leitor NFC');
            console.error('Erro NFC:', error);
        }
    }

    async authenticateWithNFC(nfcData) {
        try {
            const response = await fetch('/api/auth/nfc-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nfc_data: nfcData,
                    is_admin: this.isAdmin
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                this.showSuccess('Login NFC realizado com sucesso!');
                
                setTimeout(() => {
                    if (this.isAdmin || data.user.is_admin) {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/';
                    }
                }, 1000);
            } else {
                this.hideLoading();
                this.showError(data.message || 'Cartão NFC não autorizado');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Erro ao autenticar com NFC');
            console.error('Erro na autenticação NFC:', error);
        }
    }

    showAdminModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeAdminModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    confirmAdminAccess() {
        this.isAdmin = true;
        this.closeAdminModal();
        
        // Atualizar interface para modo admin
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.classList.add('admin-mode');
        }
        
        // Atualizar título
        const title = document.querySelector('.login-header h1');
        if (title) {
            title.innerHTML = '<i class="fas fa-shield-alt"></i> Acesso Administrativo';
        }
        
        // Atualizar botão de login
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-key"></i> Entrar como Administrador';
            loginBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        }
        
        // Focar no campo de usuário
        const usernameField = document.getElementById('username');
        if (usernameField) {
            usernameField.focus();
        }
        
        this.showInfo('Modo administrativo ativado. Use suas credenciais de administrador.');
    }

    async handleAdminLogin() {
        // Obter credenciais do modal admin
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;

        if (!username || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        this.showLoading('Realizando login administrativo...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    remember: false,
                    is_admin: true
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                this.showSuccess('Login administrativo realizado com sucesso!');
                
                // Fechar modal
                this.closeAdminModal();
                
                // Aguardar um pouco para mostrar o sucesso e redirecionar
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 1000);
            } else {
                this.hideLoading();
                this.showError(data.message || 'Erro ao realizar login administrativo');
                
                // Limpar senha em caso de erro
                document.getElementById('admin-password').value = '';
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Erro de conexão. Tente novamente.');
            console.error('Erro no login administrativo:', error);
        }
    }

    togglePassword() {
        const passwordField = document.getElementById('password');
        const toggleIcon = document.getElementById('toggle-password').querySelector('i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordField.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    setupModals() {
        // Configurar fechamento de modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAdminModal();
            }
        });
    }

    checkNFCSupport() {
        const nfcSection = document.querySelector('.nfc-section');
        if (!this.isNFCSupported() && nfcSection) {
            nfcSection.style.display = 'none';
        }
    }

    isNFCSupported() {
        return 'NDEFReader' in window;
    }

    showLoading(message = 'Carregando...') {
        let overlay = document.getElementById('loading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <p>${message}</p>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('p').textContent = message;
        }
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loading');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        // Remover toast anterior se existir
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'error' ? 'fas fa-exclamation-circle' : 
                    type === 'success' ? 'fas fa-check-circle' : 
                    'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Adicionar estilos do toast se não existirem
        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 10001;
                    min-width: 300px;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid;
                }
                
                .toast-error { border-left-color: #e74c3c; }
                .toast-success { border-left-color: #27ae60; }
                .toast-info { border-left-color: #3498db; }
                
                .toast i:first-child {
                    font-size: 1.2rem;
                }
                
                .toast-error i:first-child { color: #e74c3c; }
                .toast-success i:first-child { color: #27ae60; }
                .toast-info i:first-child { color: #3498db; }
                
                .toast span {
                    flex: 1;
                    color: #2c3e50;
                    font-weight: 500;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: #7f8c8d;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 3px;
                    transition: all 0.2s ease;
                }
                
                .toast-close:hover {
                    background: #ecf0f1;
                    color: #2c3e50;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Função para logout (usada no sistema)
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.currentUser = null;
                this.isAdmin = false;
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Erro no logout:', error);
            window.location.href = '/login';
        }
    }

    // Verificar permissões do usuário
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions.includes(permission) || this.currentUser.is_admin;
    }

    // Guardar referência global para uso em outras páginas
    static getInstance() {
        if (!window.authManager) {
            window.authManager = new AuthManager();
        }
        return window.authManager;
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Só inicializar na página de login
    if (window.location.pathname === '/login' || document.getElementById('loginForm')) {
        window.authManager = new AuthManager();
    }
});

// Disponibilizar globalmente
window.AuthManager = AuthManager;

// Função global para toggle de senha (usada no HTML)
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}