/**
 * ADMIN PANEL JAVASCRIPT - GERENCIAMENTO DE USUÁRIOS
 * Sistema completo de administração para logística de estoque
 */

// Variáveis globais
let adminData = {
    currentUser: null,
    users: [],
    permissions: [],
    filteredUsers: [],
    editingUser: null
};

console.log('[ADMIN] Script carregado');

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('[ADMIN] DOM carregado, inicializando...');
    hideAllLoadingElements();
    initAdminPanel();
});

/**
 * Remover todos os elementos de loading
 */
function hideAllLoadingElements() {
    const loadingSelectors = [
        '#loading',
        '#globalLoadingOverlay',
        '.loading-overlay',
        '[class*="loading"]'
    ];
    
    loadingSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.style.display = 'none';
            if (el.parentNode) {
                el.remove();
            }
        });
    });
}

/**
 * Inicialização principal do painel admin
 */
async function initAdminPanel() {
    console.log('[ADMIN] Inicializando painel admin...');
    
    try {
        // 1. Verificar autenticação
        const isAuth = await checkAuth();
        if (!isAuth) {
            console.log('[ADMIN] Não autenticado, redirecionando...');
            window.location.href = '/login';
            return;
        }
        
        // 2. Configurar interface básica
        setupEventListeners();
        
        // 3. Carregar dados
        await loadAllData();
        
        console.log('[ADMIN] Inicialização concluída com sucesso');
        
    } catch (error) {
        console.error('[ADMIN] Erro na inicialização:', error);
        showMessage('Erro ao inicializar o painel admin', 'error');
    }
}

/**
 * Verificar autenticação
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check-session');
        if (!response.ok) return false;
        
        const data = await response.json();
        if (data.authenticated && data.user && data.user.is_admin) {
            adminData.currentUser = data.user;
            return true;
        }
        return false;
    } catch (error) {
        console.error('[ADMIN] Erro na verificação de autenticação:', error);
        return false;
    }
}

/**
 * Carregar todos os dados
 */
async function loadAllData() {
    console.log('[ADMIN] Carregando dados...');
    
    const promises = [
        loadStats(),
        loadUsers(),
        loadPermissions()
    ];
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
        const names = ['estatísticas', 'usuários', 'permissões'];
        if (result.status === 'rejected') {
            console.error(`[ADMIN] Erro ao carregar ${names[index]}:`, result.reason);
        }
    });
}

/**
 * Carregar estatísticas
 */
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
            const stats = await response.json();
            updateStats(stats);
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar estatísticas:', error);
        setDefaultStats();
    }
}

/**
 * Carregar usuários
 */
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
            const users = await response.json();
            
            if (Array.isArray(users)) {
                adminData.users = users;
                adminData.filteredUsers = users;
                updateUsersTable(users);
                console.log(`[ADMIN] ${users.length} usuários carregados`);
            } else {
                throw new Error('Dados de usuários não são um array');
            }
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar usuários:', error);
        showUsersError('Erro ao carregar usuários: ' + error.message);
    }
}

/**
 * Carregar permissões
 */
async function loadPermissions() {
    try {
        const response = await fetch('/api/admin/permissions');
        if (response.ok) {
            const permissions = await response.json();
            adminData.permissions = permissions || [];
            console.log(`[ADMIN] ${adminData.permissions.length} permissões carregadas`);
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar permissões:', error);
    }
}

/**
 * Atualizar estatísticas na tela
 */
function updateStats(stats) {
    const elements = [
        { id: 'total-users', value: stats.total_users || 0 },
        { id: 'total-admins', value: stats.total_admins || 0 },
        { id: 'users-online', value: stats.users_online || 0 }
    ];
    
    elements.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.textContent = item.value;
        }
    });
}

/**
 * Definir estatísticas padrão em caso de erro
 */
function setDefaultStats() {
    updateStats({
        total_users: '?',
        total_admins: '?',
        users_online: '?'
    });
}

/**
 * Atualizar tabela de usuários
 */
function updateUsersTable(users) {
    console.log('[ADMIN] Atualizando tabela com', users.length, 'usuários');
    
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('[ADMIN] Elemento users-table-body não encontrado');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
    
    setupTableEventListeners();
    console.log('[ADMIN] Tabela atualizada com sucesso');
}

/**
 * Criar linha da tabela de usuário
 */
function createUserRow(user) {
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', user.id);
    
    const id = user.id || '';
    const username = escapeHtml(user.username || '');
    const nome = escapeHtml(user.nome || user.username || '');
    const email = escapeHtml(user.email || '');
    const isAdmin = user.is_admin || user.tipo === 'admin';
    const isActive = user.active || user.ativo;
    const lastLogin = formatDate(user.last_login || user.data_ultimo_login);
    const permissions = user.permissions || [];
    
    row.innerHTML = `
        <td><input type="checkbox" value="${id}" class="user-checkbox"></td>
        <td>${id}</td>
        <td>${username}</td>
        <td>${nome}</td>
        <td>${email}</td>
        <td><span class="badge ${isAdmin ? 'admin' : 'user'}">${isAdmin ? 'Admin' : 'Usuário'}</span></td>
        <td><span class="status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span></td>
        <td>${lastLogin}</td>
        <td class="permissions-cell">
            ${permissions.length > 0 ? 
                `<span class="permissions-count">${permissions.length} permissões</span>` : 
                '<span class="no-permissions">Nenhuma</span>'}
        </td>
        <td class="actions">
            <button class="btn-action edit" data-user-id="${id}" title="Editar usuário">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action permissions" data-user-id="${id}" title="Gerenciar permissões">
                <i class="fas fa-key"></i>
            </button>
            <button class="btn-action delete" data-user-id="${id}" title="Excluir usuário">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

/**
 * Mostrar erro na tabela de usuários
 */
function showUsersError(message) {
    const tbody = document.getElementById('users-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px; color: red;">❌ ${message}</td></tr>`;
    }
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    console.log('[ADMIN] Configurando event listeners...');
    
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botão novo usuário
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserModal());
    }
    
    // Busca de usuários
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', handleUserSearch);
    }
    
    // Checkbox selecionar todos
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
    
    // Configurar modais
    setupModals();
}

/**
 * Configurar modais
 */
function setupModals() {
    // Modal de usuário
    const userModal = document.getElementById('userModal');
    const userModalClose = userModal?.querySelector('.close');
    const userFormCancel = document.getElementById('btn-cancel-user');
    
    if (userModalClose) {
        userModalClose.addEventListener('click', () => closeUserModal());
    }
    
    if (userFormCancel) {
        userFormCancel.addEventListener('click', () => closeUserModal());
    }
    
    // Modal de permissões
    const permissionsModal = document.getElementById('permissionsModal');
    const permissionsModalClose = permissionsModal?.querySelector('.close');
    const permissionsCancel = document.getElementById('btn-cancel-permissions');
    const permissionsSave = document.getElementById('btn-save-permissions');
    
    if (permissionsModalClose) {
        permissionsModalClose.addEventListener('click', () => closePermissionsModal());
    }
    
    if (permissionsCancel) {
        permissionsCancel.addEventListener('click', () => closePermissionsModal());
    }
    
    if (permissionsSave) {
        permissionsSave.addEventListener('click', () => saveUserPermissions());
    }
    
    // Form de usuário
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }
    
    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        if (event.target === userModal) {
            closeUserModal();
        }
        if (event.target === permissionsModal) {
            closePermissionsModal();
        }
    });
}

/**
 * Configurar event listeners da tabela
 */
function setupTableEventListeners() {
    // Botões de editar
    const editButtons = document.querySelectorAll('.btn-action.edit');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.getAttribute('data-user-id'));
            editUser(userId);
        });
    });
    
    // Botões de permissões
    const permissionButtons = document.querySelectorAll('.btn-action.permissions');
    permissionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.getAttribute('data-user-id'));
            editUserPermissions(userId);
        });
    });
    
    // Botões de excluir
    const deleteButtons = document.querySelectorAll('.btn-action.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.getAttribute('data-user-id'));
            deleteUser(userId);
        });
    });
}

/**
 * Buscar usuários
 */
function handleUserSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!adminData.users || adminData.users.length === 0) {
        return;
    }
    
    const filteredUsers = adminData.users.filter(user => {
        return (user.username || '').toLowerCase().includes(searchTerm) ||
               (user.nome || '').toLowerCase().includes(searchTerm) ||
               (user.email || '').toLowerCase().includes(searchTerm);
    });
    
    adminData.filteredUsers = filteredUsers;
    updateUsersTable(filteredUsers);
}

/**
 * Abrir modal de usuário (novo ou edição)
 */
function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('user-modal-title');
    const form = document.getElementById('userForm');
    
    if (!modal || !title || !form) {
        console.error('[ADMIN] Elementos do modal não encontrados');
        return;
    }
    
    // Configurar modal
    if (user) {
        title.textContent = 'Editar Usuário';
        adminData.editingUser = user;
        fillUserForm(user);
    } else {
        title.textContent = 'Novo Usuário';
        adminData.editingUser = null;
        form.reset();
        document.getElementById('userId').value = '';
    }
    
    modal.style.display = 'block';
    
    // Carregar permissões no formulário
    loadPermissionsInForm(user ? user.permissions : []);
}

/**
 * Fechar modal de usuário
 */
function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
    adminData.editingUser = null;
}

/**
 * Preencher formulário de usuário
 */
function fillUserForm(user) {
    document.getElementById('userId').value = user.id || '';
    document.getElementById('userUsername').value = user.username || '';
    document.getElementById('user-nome').value = user.nome || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userActive').checked = user.active || user.ativo || false;
    document.getElementById('userAdmin').checked = user.is_admin || user.tipo === 'admin' || false;
    
    // Senha não é preenchida para edição
    document.getElementById('userPassword').required = !user.id;
    document.getElementById('userPasswordConfirm').required = !user.id;
    
    if (user.id) {
        document.getElementById('userPassword').placeholder = 'Deixe em branco para manter a senha atual';
        document.getElementById('userPasswordConfirm').placeholder = 'Deixe em branco para manter a senha atual';
    }
}

/**
 * Carregar permissões no formulário
 */
function loadPermissionsInForm(userPermissions = []) {
    const permissionsGrid = document.getElementById('permissions-grid');
    if (!permissionsGrid) return;
    
    permissionsGrid.innerHTML = '';
    
    adminData.permissions.forEach(permission => {
        const isChecked = userPermissions.includes(permission.id);
        
        const permissionDiv = document.createElement('div');
        permissionDiv.className = 'permission-item';
        permissionDiv.innerHTML = `
            <label>
                <input type="checkbox" name="permission" value="${permission.id}" ${isChecked ? 'checked' : ''}>
                <span class="permission-name">${permission.name}</span>
                <span class="permission-desc">${permission.description}</span>
            </label>
        `;
        
        permissionsGrid.appendChild(permissionDiv);
    });
}

/**
 * Handle submit do formulário de usuário
 */
async function handleUserFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        nome: formData.get('nome'),
        email: formData.get('email'),
        active: formData.get('active') === '1',
        is_admin: formData.get('is_admin') === '1'
    };
    
    // Validação de senha
    const password = formData.get('password');
    const passwordConfirm = formData.get('password_confirm');
    
    if (password || passwordConfirm) {
        if (password !== passwordConfirm) {
            showMessage('As senhas não coincidem', 'error');
            return;
        }
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        userData.password = password;
    }
    
    // Coletar permissões selecionadas
    const selectedPermissions = Array.from(document.querySelectorAll('input[name="permission"]:checked'))
        .map(input => input.value);
    
    try {
        showMessage('Salvando usuário...', 'info');
        
        let response;
        if (adminData.editingUser) {
            // Editar usuário
            response = await fetch(`/api/admin/users/${adminData.editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        } else {
            // Criar usuário
            response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            const userId = adminData.editingUser ? adminData.editingUser.id : result.user_id;
            
            // Salvar permissões
            if (selectedPermissions.length > 0 || adminData.editingUser) {
                await updateUserPermissions(userId, selectedPermissions);
            }
            
            showMessage(result.message, 'success');
            closeUserModal();
            loadUsers(); // Recarregar lista
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao salvar usuário:', error);
        showMessage('Erro ao salvar usuário', 'error');
    }
}

/**
 * Editar usuário
 */
function editUser(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    openUserModal(user);
}

/**
 * Editar permissões do usuário
 */
function editUserPermissions(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    openPermissionsModal(user);
}

/**
 * Abrir modal de permissões
 */
function openPermissionsModal(user) {
    const modal = document.getElementById('permissionsModal');
    const title = document.getElementById('permissions-modal-title');
    const userName = document.getElementById('permissions-user-name');
    const userDetails = document.getElementById('permissions-user-details');
    
    if (!modal) {
        console.error('[ADMIN] Modal de permissões não encontrado');
        return;
    }
    
    title.textContent = 'Gerenciar Permissões';
    userName.textContent = user.nome || user.username;
    userDetails.textContent = `${user.username} - ${user.email || 'Sem email'}`;
    
    adminData.editingUser = user;
    
    // Carregar permissões por categoria
    loadPermissionsByCategory(user.permissions || []);
    
    modal.style.display = 'block';
}

/**
 * Fechar modal de permissões
 */
function closePermissionsModal() {
    const modal = document.getElementById('permissionsModal');
    if (modal) {
        modal.style.display = 'none';
    }
    adminData.editingUser = null;
}

/**
 * Carregar permissões por categoria
 */
function loadPermissionsByCategory(userPermissions = []) {
    console.log('[ADMIN] Carregando permissões por categoria para usuário:', userPermissions);
    
    const categories = {
        'dashboard': [
            'visualizar_dashboard'
        ],
        'produtos': [
            'gerenciar_produtos',
            'visualizar_produtos'
        ],
        'estoque': [
            'gerenciar_estoque',
            'visualizar_estoque'
        ],
        'relatorios': [
            'visualizar_relatorios',
            'exportar_dados'
        ],
        'avancado': [
            'usar_nfc',
            'gerenciar_usuarios',
            'alterar_permissoes'
        ]
    };
    
    Object.keys(categories).forEach(categoryKey => {
        const categoryDiv = document.querySelector(`[data-category="${categoryKey}"]`);
        if (!categoryDiv) {
            console.warn(`[ADMIN] Categoria ${categoryKey} não encontrada no DOM`);
            return;
        }
        
        categoryDiv.innerHTML = '';
        
        const categoryPermissions = categories[categoryKey];
        console.log(`[ADMIN] Processando categoria ${categoryKey} com permissões:`, categoryPermissions);
        
        categoryPermissions.forEach(permissionId => {
            const permission = adminData.permissions.find(p => p.id === permissionId);
            if (!permission) {
                console.warn(`[ADMIN] Permissão ${permissionId} não encontrada na lista de permissões disponíveis`);
                return;
            }
            
            const isChecked = userPermissions.includes(permissionId);
            console.log(`[ADMIN] Permissão ${permissionId}: checked = ${isChecked}`);
            
            const permissionDiv = document.createElement('div');
            permissionDiv.className = 'permission-item';
            permissionDiv.innerHTML = `
                <label>
                    <input type="checkbox" name="category-permission" value="${permission.id}" ${isChecked ? 'checked' : ''}>
                    <span class="permission-name">${permission.name}</span>
                    <span class="permission-desc">${permission.description}</span>
                </label>
            `;
            
            categoryDiv.appendChild(permissionDiv);
        });
    });
    
    console.log('[ADMIN] Permissões carregadas. Total de checkboxes criados:', 
        document.querySelectorAll('input[name="category-permission"]').length);
}

/**
 * Salvar permissões do usuário
 */
async function saveUserPermissions() {
    if (!adminData.editingUser) {
        showMessage('Nenhum usuário selecionado', 'error');
        return;
    }
    
    console.log('[ADMIN] Salvando permissões para usuário:', adminData.editingUser.username);
    
    const selectedPermissions = Array.from(document.querySelectorAll('input[name="category-permission"]:checked'))
        .map(input => input.value);
    
    console.log('[ADMIN] Permissões selecionadas:', selectedPermissions);
    
    try {
        showMessage('Salvando permissões...', 'info');
        await updateUserPermissions(adminData.editingUser.id, selectedPermissions);
        showMessage('Permissões atualizadas com sucesso', 'success');
        closePermissionsModal();
        loadUsers(); // Recarregar lista
    } catch (error) {
        console.error('[ADMIN] Erro ao salvar permissões:', error);
        showMessage('Erro ao salvar permissões: ' + error.message, 'error');
    }
}

/**
 * Atualizar permissões do usuário
 */
async function updateUserPermissions(userId, permissions) {
    console.log('[ADMIN] Enviando permissões para API:', { userId, permissions });
    
    const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
    });
    
    console.log('[ADMIN] Resposta da API:', response.status);
    
    const result = await response.json();
    console.log('[ADMIN] Resultado da API:', result);
    
    if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar permissões');
    }
    
    return result;
}

/**
 * Excluir usuário
 */
async function deleteUser(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    if (!confirm(`Deseja realmente excluir o usuário "${user.username}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            loadUsers(); // Recarregar lista
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao excluir usuário:', error);
        showMessage('Erro ao excluir usuário', 'error');
    }
}

/**
 * Logout
 */
function handleLogout(event) {
    event.preventDefault();
    if (confirm('Deseja realmente sair?')) {
        window.location.href = '/logout';
    }
}

/**
 * Toggle password visibility
 */
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

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formatação de data
 */
function formatDate(dateString) {
    if (!dateString) return 'Nunca';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        return date.toLocaleDateString('pt-BR') + ' ' + 
               date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return 'Erro na data';
    }
}

/**
 * Sistema de mensagens
 */
function showMessage(message, type = 'info') {
    console.log(`[ADMIN] ${type.toUpperCase()}:`, message);
    
    // Remover mensagem anterior
    const existingMessage = document.getElementById('admin-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.id = 'admin-message';
    messageDiv.textContent = message;
    
    // Estilos baseados no tipo
    let backgroundColor, color;
    switch (type) {
        case 'error':
            backgroundColor = '#dc3545';
            color = 'white';
            break;
        case 'success':
            backgroundColor = '#28a745';
            color = 'white';
            break;
        case 'warning':
            backgroundColor = '#ffc107';
            color = '#212529';
            break;
        default:
            backgroundColor = '#007bff';
            color = 'white';
    }
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: ${color};
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    document.body.appendChild(messageDiv);
    
    // Animar entrada
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 300);
    }, 5000);
    
    // Permitir fechar clicando
    messageDiv.addEventListener('click', () => {
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 300);
    });
}

// Tornar função togglePassword global
window.togglePassword = togglePassword;

// Função de debug para testar no console
window.debugPermissions = function() {
    console.log('=== DEBUG PERMISSÕES ===');
    console.log('Usuario em edição:', adminData.editingUser);
    console.log('Permissões disponíveis:', adminData.permissions);
    
    const checkboxes = document.querySelectorAll('input[name="category-permission"]');
    console.log('Total de checkboxes encontrados:', checkboxes.length);
    
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    console.log('Checkboxes marcados:', checked.length);
    
    const values = checked.map(cb => cb.value);
    console.log('Valores dos checkboxes marcados:', values);
    
    return { checkboxes, checked, values };
};

console.log('[ADMIN] JavaScript carregado completamente');