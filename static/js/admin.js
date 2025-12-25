// JavaScript para painel administrativo
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.permissions = [];
        this.stats = {};
        this.initializeAdmin();
        this.initializeEventListeners();
    }

    async initializeAdmin() {
        // Verificar autenticação
        await this.checkAdminAuth();
        
        // Carregar dados iniciais
        await this.loadInitialData();
        
        // Configurar interface
        this.setupInterface();
        
        // Carregar estatísticas
        await this.loadStats();
        
        // Carregar usuários
        await this.loadUsers();
        
        // Carregar permissões
        await this.loadPermissions();
    }

    initializeEventListeners() {
        // Navegação do sidebar
        this.setupNavigation();
        
        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Botão de adicionar usuário
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }
        
        // Busca de usuários
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }
        
        // Modais
        this.setupModals();
        
        // Atualização automática de dados
        this.startAutoUpdate();
    }

    async checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/check-session', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user.is_admin) {
                    this.currentUser = data.user;
                    return;
                }
            }
            
            // Se não for admin, redirecionar
            window.location.href = '/login';
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = '/login';
        }
    }

    async loadInitialData() {
        try {
            // Buscar dados básicos do usuário
            if (this.currentUser) {
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    setupInterface() {
        // Configurar informações do usuário
        this.updateUserInfo();
        
        // Configurar navegação ativa
        this.setActiveNavigation('dashboard');
        
        // Configurar data/hora
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000); // Atualizar a cada minuto
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Atualizar avatar
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
        }
        
        // Atualizar nome
        const userName = document.querySelector('.user-details h4');
        if (userName) {
            userName.textContent = this.currentUser.username;
        }
        
        // Atualizar cargo/role
        const userRole = document.querySelector('.user-details p');
        if (userRole) {
            userRole.textContent = 'Administrador';
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateTime = now.toLocaleString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = dateTime;
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-item a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
                this.setActiveNavigation(section);
            });
        });
    }

    setActiveNavigation(activeSection) {
        const navLinks = document.querySelectorAll('.nav-item a');
        navLinks.forEach(link => {
            const section = link.getAttribute('href').substring(1);
            link.classList.toggle('active', section === activeSection);
        });
    }

    showSection(sectionName) {
        // Ocultar todas as seções
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Mostrar seção específica
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Executar função específica da seção
            switch(sectionName) {
                case 'dashboard':
                    this.loadStats();
                    break;
                case 'users':
                    this.loadUsers();
                    break;
                case 'permissions':
                    this.loadPermissions();
                    break;
                case 'reports':
                    this.loadReports();
                    break;
            }
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                this.stats = await response.json();
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    updateStatsDisplay() {
        // Atualizar cards de estatísticas
        this.updateStatCard('users', this.stats.total_users || 0, this.stats.users_trend || 0);
        this.updateStatCard('products', this.stats.total_products || 0, this.stats.products_trend || 0);
        this.updateStatCard('movements', this.stats.total_movements || 0, this.stats.movements_trend || 0);
        this.updateStatCard('alerts', this.stats.total_alerts || 0, this.stats.alerts_trend || 0);
    }

    updateStatCard(type, value, trend) {
        const card = document.querySelector(`.stat-card.${type}`);
        if (!card) return;
        
        const valueElement = card.querySelector('.stat-value');
        const trendElement = card.querySelector('.stat-trend');
        
        if (valueElement) {
            valueElement.textContent = this.formatNumber(value);
        }
        
        if (trendElement && trend !== undefined) {
            const trendIcon = trend > 0 ? 'fa-arrow-up' : trend < 0 ? 'fa-arrow-down' : 'fa-minus';
            const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral';
            const trendText = trend > 0 ? `+${Math.abs(trend)}%` : trend < 0 ? `-${Math.abs(trend)}%` : 'Estável';
            
            trendElement.className = `stat-trend ${trendClass}`;
            trendElement.innerHTML = `<i class="fas ${trendIcon}"></i> ${trendText}`;
        }
    }

    formatNumber(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    async loadUsers() {
        try {
            this.showLoading();
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                this.users = await response.json();
                this.displayUsers(this.users);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            this.showError('Erro ao carregar usuários');
        } finally {
            this.hideLoading();
        }
    }

    displayUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = this.createUserRow(user);
            tbody.appendChild(row);
        });
    }

    createUserRow(user) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="user-info">
                    <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <strong>${user.username}</strong>
                        <br>
                        <small>${user.email || 'Email não informado'}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge status-${user.active ? 'active' : 'inactive'}">
                    ${user.active ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <span class="role-badge ${user.is_admin ? 'role-admin' : 'role-user'}">
                    ${user.is_admin ? 'Administrador' : 'Usuário'}
                </span>
            </td>
            <td>${this.formatDate(user.created_at)}</td>
            <td>${user.last_login ? this.formatDate(user.last_login) : 'Nunca'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="adminPanel.editUser(${user.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-action btn-permissions" onclick="adminPanel.editUserPermissions(${user.id})">
                        <i class="fas fa-key"></i> Permissões
                    </button>
                    <button class="btn-action btn-delete" onclick="adminPanel.deleteUser(${user.id})" 
                            ${user.is_admin ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString('pt-BR');
    }

    filterUsers(searchTerm) {
        const filteredUsers = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.displayUsers(filteredUsers);
    }

    showAddUserModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            // Limpar formulário
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            document.querySelector('#userModal .modal-header h2').innerHTML = 
                '<i class="fas fa-user-plus"></i> Adicionar Usuário';
            
            modal.style.display = 'block';
        }
    }

    async editUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                this.populateUserForm(user);
                
                const modal = document.getElementById('userModal');
                document.querySelector('#userModal .modal-header h2').innerHTML = 
                    '<i class="fas fa-user-edit"></i> Editar Usuário';
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            this.showError('Erro ao carregar dados do usuário');
        }
    }

    populateUserForm(user) {
        document.getElementById('userId').value = user.id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userActive').checked = user.active;
        document.getElementById('userAdmin').checked = user.is_admin;
        
        // Ocultar campo de senha para edição
        const passwordField = document.getElementById('userPassword').parentElement;
        passwordField.style.display = 'none';
    }

    async saveUser(formData) {
        try {
            const userId = formData.get('userId');
            const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
            const method = userId ? 'PUT' : 'POST';
            
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                active: formData.has('active'),
                is_admin: formData.has('is_admin')
            };
            
            if (!userId && formData.get('password')) {
                userData.password = formData.get('password');
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showSuccess(userId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
                this.closeModal('userModal');
                await this.loadUsers();
            } else {
                this.showError(result.message || 'Erro ao salvar usuário');
            }
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            this.showError('Erro ao salvar usuário');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showSuccess('Usuário excluído com sucesso!');
                await this.loadUsers();
            } else {
                this.showError(result.message || 'Erro ao excluir usuário');
            }
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            this.showError('Erro ao excluir usuário');
        }
    }

    async editUserPermissions(userId) {
        try {
            // Carregar usuário e permissões
            const [userResponse, permissionsResponse] = await Promise.all([
                fetch(`/api/admin/users/${userId}`),
                fetch('/api/admin/permissions')
            ]);
            
            if (userResponse.ok && permissionsResponse.ok) {
                const user = await userResponse.json();
                const allPermissions = await permissionsResponse.json();
                
                this.showPermissionsModal(user, allPermissions);
            }
        } catch (error) {
            console.error('Erro ao carregar permissões:', error);
            this.showError('Erro ao carregar permissões do usuário');
        }
    }

    showPermissionsModal(user, allPermissions) {
        const modal = document.getElementById('permissionsModal');
        if (!modal) return;
        
        // Atualizar título
        const title = modal.querySelector('.modal-header h2');
        title.innerHTML = `<i class="fas fa-key"></i> Permissões - ${user.username}`;
        
        // Popular grid de permissões
        const grid = modal.querySelector('.permissions-grid');
        grid.innerHTML = '';
        
        allPermissions.forEach(permission => {
            const hasPermission = user.permissions && user.permissions.includes(permission.name);
            const card = this.createPermissionCard(permission, hasPermission);
            grid.appendChild(card);
        });
        
        // Configurar botão de salvar
        const saveBtn = modal.querySelector('.btn-save-permissions');
        saveBtn.onclick = () => this.saveUserPermissions(user.id);
        
        modal.style.display = 'block';
    }

    createPermissionCard(permission, isActive) {
        const card = document.createElement('div');
        card.className = `permission-card ${isActive ? 'active' : ''}`;
        card.dataset.permission = permission.name;
        
        card.innerHTML = `
            <div class="permission-header">
                <div class="permission-icon">
                    <i class="${permission.icon || 'fas fa-lock'}"></i>
                </div>
                <div class="permission-info">
                    <h4>${permission.display_name}</h4>
                    <p>${permission.description}</p>
                </div>
            </div>
            <div class="permission-toggle">
                <span>${isActive ? 'Ativo' : 'Inativo'}</span>
                <div class="toggle-switch ${isActive ? 'active' : ''}" onclick="adminPanel.togglePermission(this)">
                </div>
            </div>
        `;
        
        return card;
    }

    togglePermission(toggleElement) {
        const card = toggleElement.closest('.permission-card');
        const isActive = toggleElement.classList.contains('active');
        
        toggleElement.classList.toggle('active');
        card.classList.toggle('active');
        
        const statusText = card.querySelector('.permission-toggle span');
        statusText.textContent = !isActive ? 'Ativo' : 'Inativo';
    }

    async saveUserPermissions(userId) {
        try {
            const activePermissions = Array.from(document.querySelectorAll('.permission-card.active'))
                .map(card => card.dataset.permission);
            
            const response = await fetch(`/api/admin/users/${userId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permissions: activePermissions })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showSuccess('Permissões atualizadas com sucesso!');
                this.closeModal('permissionsModal');
            } else {
                this.showError(result.message || 'Erro ao atualizar permissões');
            }
        } catch (error) {
            console.error('Erro ao salvar permissões:', error);
            this.showError('Erro ao salvar permissões');
        }
    }

    async loadPermissions() {
        try {
            const response = await fetch('/api/admin/permissions');
            if (response.ok) {
                this.permissions = await response.json();
                this.displayPermissions();
            }
        } catch (error) {
            console.error('Erro ao carregar permissões:', error);
        }
    }

    displayPermissions() {
        // Implementar exibição de permissões se necessário
    }

    async loadReports() {
        // Implementar carregamento de relatórios
    }

    setupModals() {
        // Configurar fechamento de modais
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // Configurar botões de fechar
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Configurar formulários
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(userForm);
                await this.saveUser(formData);
            });
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleLogout() {
        if (confirm('Tem certeza que deseja sair?')) {
            try {
                const response = await fetch('/api/auth/logout', { method: 'POST' });
                if (response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Erro no logout:', error);
                window.location.href = '/login';
            }
        }
    }

    startAutoUpdate() {
        // Atualizar estatísticas a cada 5 minutos
        setInterval(() => {
            if (document.querySelector('#dashboard').style.display !== 'none') {
                this.loadStats();
            }
        }, 5 * 60 * 1000);
    }

    showLoading() {
        // Implementar indicador de carregamento
    }

    hideLoading() {
        // Ocultar indicador de carregamento
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        // Reutilizar função de toast do auth.js
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

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Inicializar painel admin
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.admin-wrapper')) {
        window.adminPanel = new AdminPanel();
    }
});

// Disponibilizar globalmente
window.AdminPanel = AdminPanel;