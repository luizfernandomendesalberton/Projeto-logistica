/**
 * ADMIN PANEL JAVASCRIPT - VERSÃO COMPLETA E FUNCIONAL
 * Sistema de administração para logística de estoque
 */

// Variáveis globais
let adminData = {
    currentUser: null,
    users: [],
    permissions: [],
    filteredUsers: []
};

console.log('[ADMIN] Script admin.js carregado - Versão Completa');

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('[ADMIN] DOM carregado, inicializando painel admin...');
    
    // Remover qualquer loading existente imediatamente
    hideAllLoadingElements();
    
    // Inicializar de forma mais direta
    initializeAdminPanelSimple();
});

/**
 * Função para esconder todos os elementos de loading
 */
function hideAllLoadingElements() {
    console.log('[ADMIN] Removendo todos os elementos de loading...');
    
    // Remover overlay de loading global
    const globalOverlay = document.getElementById('globalLoadingOverlay');
    if (globalOverlay) {
        globalOverlay.remove();
    }
    
    // Remover overlay de loading padrão
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
    // Remover qualquer outro elemento de loading
    const allLoadingElements = document.querySelectorAll('[id*="loading"], [class*="loading"]');
    allLoadingElements.forEach(el => {
        if (el.style) {
            el.style.display = 'none';
        }
    });
    
    console.log('[ADMIN] Elementos de loading removidos');
}

/**
 * Inicialização simplificada do painel admin
 */
async function initializeAdminPanelSimple() {
    console.log('[ADMIN] Iniciando painel administrativo (modo simplificado)...');
    
    try {
        // 1. Verificar autenticação de forma mais direta
        console.log('[ADMIN] Verificando autenticação...');
        const isAuthenticated = await checkAuthenticationSimple();
        
        if (!isAuthenticated) {
            console.log('[ADMIN] Não autenticado - redirecionando para login');
            window.location.href = '/login';
            return;
        }
        
        console.log('[ADMIN] Autenticação verificada com sucesso');
        
        // 2. Configurar interface básica
        setupBasicEventListeners();
        
        // 3. Carregar dados de forma assíncrona sem bloquear
        console.log('[ADMIN] Iniciando carregamento de dados...');
        loadAdminDataSimple();
        
        console.log('[ADMIN] Painel admin inicializado (modo simplificado) com sucesso');
        
    } catch (error) {
        console.error('[ADMIN] Erro na inicialização simplificada:', error);
        // Mesmo com erro, garantir que a interface funcione
        setupBasicEventListeners();
        showBasicErrorMessage('Erro ao carregar alguns dados. A interface pode funcionar parcialmente.');
    }
}

/**
 * Verificação simples de autenticação
 */
async function checkAuthenticationSimple() {
    try {
        const response = await fetch('/api/auth/check-session');
        if (!response.ok) {
            return false;
        }
        
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
 * Carregamento simplificado de dados do admin
 */
async function loadAdminDataSimple() {
    console.log('[ADMIN] Carregando dados de forma assíncrona...');
    
    // Carregar cada tipo de dado independentemente
    loadStatsSimple();
    loadUsersSimple();
    loadPermissionsSimple();
}

/**
 * Carregar estatísticas de forma simples
 */
async function loadStatsSimple() {
    try {
        console.log('[ADMIN] Carregando estatísticas...');
        const response = await fetch('/api/admin/stats');
        
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplaySimple(stats);
            console.log('[ADMIN] Estatísticas carregadas com sucesso');
        } else {
            console.log('[ADMIN] Erro ao carregar estatísticas:', response.status);
            setDefaultStats();
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar estatísticas:', error);
        setDefaultStats();
    }
}

/**
 * Carregar usuários de forma simples
 */
async function loadUsersSimple() {
    try {
        console.log('[ADMIN] Carregando usuários...');
        const response = await fetch('/api/admin/users');
        
        if (response.ok) {
            const users = await response.json();
            console.log('[ADMIN] Usuários recebidos:', users);
            
            // Garantir que é um array
            if (Array.isArray(users)) {
                adminData.users = users;
                adminData.filteredUsers = users;
                updateUsersTableSimple(users);
                console.log('[ADMIN] Usuários carregados com sucesso:', users.length, 'usuários');
            } else {
                console.error('[ADMIN] Dados de usuários não são um array:', typeof users);
                showUsersError('Formato de dados inválido');
            }
        } else {
            console.error('[ADMIN] Erro ao carregar usuários:', response.status);
            showUsersError('Erro ao carregar usuários: ' + response.status);
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar usuários:', error);
        showUsersError('Erro de conexão ao carregar usuários');
    }
}

/**
 * Carregar permissões de forma simples
 */
async function loadPermissionsSimple() {
    try {
        console.log('[ADMIN] Carregando permissões...');
        const response = await fetch('/api/admin/permissions');
        
        if (response.ok) {
            const permissions = await response.json();
            adminData.permissions = permissions || [];
            console.log('[ADMIN] Permissões carregadas com sucesso');
        } else {
            console.log('[ADMIN] Erro ao carregar permissões:', response.status);
        }
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar permissões:', error);
    }
}

/**
 * Atualizar exibição de estatísticas de forma simples
 */
function updateStatsDisplaySimple(stats) {
    console.log('[ADMIN] Atualizando estatísticas:', stats);
    
    const statsElements = [
        { id: 'total-users', value: stats.total_users || 0 },
        { id: 'total-admins', value: stats.total_admins || 0 },
        { id: 'users-online', value: stats.users_online || 0 }
    ];
    
    statsElements.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (element) {
            element.textContent = stat.value;
            console.log(`[ADMIN] Estatística ${stat.id} atualizada: ${stat.value}`);
        }
    });
}

/**
 * Definir estatísticas padrão
 */
function setDefaultStats() {
    console.log('[ADMIN] Definindo estatísticas padrão');
    updateStatsDisplaySimple({
        total_users: '?',
        total_admins: '?',
        users_online: '?'
    });
}

/**
 * Atualizar tabela de usuários de forma simples
 */
function updateUsersTableSimple(users) {
    console.log('[ADMIN] Atualizando tabela de usuários (modo simples):', users);
    
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('[ADMIN] Elemento users-table-body não encontrado!');
        return;
    }
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Verificar se há usuários
    if (!users || !Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Nenhum usuário encontrado</td></tr>';
        console.log('[ADMIN] Nenhum usuário para exibir');
        return;
    }
    
    console.log(`[ADMIN] Criando ${users.length} linhas na tabela...`);
    
    // Criar linhas para cada usuário
    users.forEach((user, index) => {
        try {
            const row = createUserRowSimple(user);
            tbody.appendChild(row);
            console.log(`[ADMIN] Linha ${index + 1} criada para usuário:`, user.username);
        } catch (error) {
            console.error(`[ADMIN] Erro ao criar linha para usuário ${index + 1}:`, error);
        }
    });
    
    // Configurar event listeners básicos
    setupTableEventListenersSimple();
    
    console.log(`[ADMIN] Tabela atualizada com ${users.length} usuários - CONCLUÍDA`);
}

/**
 * Criar linha de usuário de forma simples
 */
function createUserRowSimple(user) {
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', user.id);
    
    // Valores seguros
    const id = user.id || '';
    const username = escapeHtmlSimple(user.username || '');
    const nome = escapeHtmlSimple(user.nome || user.username || '');
    const email = escapeHtmlSimple(user.email || '');
    const isAdmin = user.is_admin || user.tipo === 'admin';
    const isActive = user.active || user.ativo;
    const lastLogin = formatDateSimple(user.last_login || user.data_ultimo_login);
    
    // Formatar permissões
    let permissionsDisplay = '<span class="no-permissions">Nenhuma</span>';
    if (user.permissions && user.permissions.length > 0) {
        const permissionNames = user.permissions.map(p => {
            // Se for string, usar diretamente; se for objeto, usar a propriedade nome ou name
            if (typeof p === 'string') return p;
            return p.nome || p.name || p;
        });
        permissionsDisplay = `<span class="permissions-count">${permissionNames.length} permissão(ões)</span>`;
    }
    
    row.innerHTML = `
        <td><input type="checkbox" value="${id}" class="user-checkbox"></td>
        <td>${id}</td>
        <td>${username}</td>
        <td>${nome}</td>
        <td>${email}</td>
        <td><span class="badge ${isAdmin ? 'admin' : 'user'}">${isAdmin ? 'Admin' : 'Usuário'}</span></td>
        <td><span class="status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span></td>
        <td>${lastLogin}</td>
        <td>${permissionsDisplay}</td>
        <td class="actions">
            <button class="btn-action edit" data-user-id="${id}" title="Editar usuário" onclick="editUser(${id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action permissions" data-user-id="${id}" title="Gerenciar permissões" onclick="managePermissions(${id})">
                <i class="fas fa-key"></i>
            </button>
            <button class="btn-action delete" data-user-id="${id}" title="Excluir usuário" onclick="deleteUser(${id})">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

/**
 * Escape HTML simples
 */
function escapeHtmlSimple(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formatação de data simples
 */
function formatDateSimple(dateString) {
    if (!dateString) return 'Nunca';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    } catch (error) {
        return 'Erro na data';
    }
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
 * Configurar event listeners básicos da tabela
 */
function setupTableEventListenersSimple() {
    console.log('[ADMIN] Configurando event listeners básicos da tabela');
    
    // Event listener para checkbox "selecionar todos"
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
}

/**
 * Configurar event listeners básicos
 */
function setupBasicEventListeners() {
    console.log('[ADMIN] Configurando event listeners básicos...');
    
    // Botão logout
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botão Novo Usuário
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => showUserModal());
    }
    
    // Busca de usuários
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', handleUserSearch);
    }
    
    // Formulário de usuário
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Fechar modal
    const closeModal = document.querySelector('.modal .close');
    if (closeModal) {
        closeModal.addEventListener('click', closeUserModal);
    }
    
    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('userModal');
        if (event.target === modal) {
            closeUserModal();
        }
    });
    
    console.log('[ADMIN] Event listeners básicos configurados');
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
 * Mostrar mensagem de erro básica
 */
function showBasicErrorMessage(message) {
    console.error('[ADMIN] Erro:', message);
    
    // Tentar mostrar na página se possível
    const container = document.querySelector('.main-content') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #f8d7da; color: #721c24; padding: 10px; margin: 10px; border-radius: 4px; border: 1px solid #f5c6cb;';
    errorDiv.textContent = message;
    
    // Adicionar no topo do container
    container.insertBefore(errorDiv, container.firstChild);
    
    // Remover após 10 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 10000);
}

// Funções de ação dos usuários
function editUser(userId) {
    console.log(`[ADMIN] Editando usuário: ${userId}`);
    showUserModal(userId);
}

async function deleteUser(userId) {
    console.log(`[ADMIN] Solicitação para deletar usuário: ${userId}`);
    
    if (!confirm('Tem certeza que deseja excluir este usuário?\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao excluir usuário');
        }
        
        showSuccess('Usuário excluído com sucesso!');
        await loadUsersSimple(); // Recarregar lista
        
    } catch (error) {
        console.error('[ADMIN] Erro ao excluir usuário:', error);
        showError('Erro ao excluir usuário: ' + error.message);
    }
}
    
    // Fechar modal
    const closeModal = document.querySelector('.modal .close');
    if (closeModal) {
        closeModal.addEventListener('click', closeUserModal);
    }
    
    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('userModal');
        if (event.target === modal) {
            closeUserModal();
        }
    });


/**
 * Carregar estatísticas
 */
async function loadStats() {
    console.log('[ADMIN] Carregando estatísticas...');
    
    try {
        const response = await fetch('/api/admin/stats');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const stats = await response.json();
        updateStatsDisplay(stats);
        
        console.log('[ADMIN] Estatísticas carregadas:', stats);
        
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar estatísticas:', error);
        showError('Erro ao carregar estatísticas');
    }
}

/**
 * Carregar lista de usuários
 */
async function loadUsers() {
    console.log('[ADMIN] Carregando usuários...');
    
    try {
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const users = await response.json();
        adminData.users = users;
        adminData.filteredUsers = users;
        
        updateUsersTable(users);
        
        console.log('[ADMIN] Usuários carregados:', users.length, 'usuários');
        
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar usuários:', error);
        showError('Erro ao carregar usuários');
    }
}

/**
 * Carregar permissões disponíveis
 */
async function loadPermissions() {
    console.log('[ADMIN] Carregando permissões...');
    
    try {
        const response = await fetch('/api/admin/permissions');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const permissions = await response.json();
        adminData.permissions = permissions;
        
        console.log('[ADMIN] Permissões carregadas:', permissions.length, 'permissões');
        
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar permissões:', error);
        showError('Erro ao carregar permissões');
    }
}

/**
 * Atualizar exibição das estatísticas
 */
function updateStatsDisplay(stats) {
    console.log('[ADMIN] Atualizando exibição das estatísticas...');
    
    // Elementos de estatísticas
    const elements = {
        'total-users': stats.total_users || 0,
        'total-admins': stats.total_admins || 0,
        'users-online': stats.users_online || 0,
        'total-products': stats.total_products || 0
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`[ADMIN] Stat ${id} atualizado: ${value}`);
        }
    });
}

/**
 * Atualizar tabela de usuários
 */
function updateUsersTable(users) {
    console.log('[ADMIN] Atualizando tabela de usuários...');
    console.log('[ADMIN] Usuários recebidos:', users);
    
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('[ADMIN] Elemento users-table-body não encontrado!');
        console.log('[ADMIN] Elementos disponíveis com ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    console.log('[ADMIN] Elemento tbody encontrado:', tbody);
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhum usuário encontrado</td></tr>';
        console.log('[ADMIN] Nenhum usuário para exibir');
        return;
    }
    
    console.log(`[ADMIN] Processando ${users.length} usuários...`);
    
    users.forEach((user, index) => {
        console.log(`[ADMIN] Processando usuário ${index + 1}:`, user);
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
    
    // Adicionar event listeners aos botões
    setupTableEventListeners();
    
    console.log(`[ADMIN] Tabela atualizada com ${users.length} usuários - CONCLUÍDA`);
}

/**
 * Criar linha da tabela de usuário
 */
function createUserRow(user) {
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', user.id);
    
    // Formatar permissões do usuário
    let permissionsBadges = '<span class="no-permissions">Nenhuma</span>';
    if (user.permissions && user.permissions.length > 0) {
        permissionsBadges = user.permissions.map(p => 
            `<span class="permission-badge">${p.nome || p}</span>`
        ).join(' ');
    }
    
    // Garantir que os campos existam
    const username = escapeHtml(user.username || '');
    const nome = escapeHtml(user.nome || user.username || '');
    const email = escapeHtml(user.email || '');
    const lastLogin = formatDate(user.last_login || user.data_ultimo_login);
    
    row.innerHTML = `
        <td><input type="checkbox" value="${user.id}" class="user-checkbox"></td>
        <td>${user.id}</td>
        <td>${username}</td>
        <td>${nome}</td>
        <td>${email}</td>
        <td><span class="badge ${user.is_admin ? 'admin' : 'user'}">${user.is_admin ? 'Admin' : 'Usuário'}</span></td>
        <td><span class="status ${user.active || user.ativo ? 'active' : 'inactive'}">${user.active || user.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>${lastLogin}</td>
        <td class="permissions-cell">${permissionsBadges}</td>
        <td class="actions">
            <button class="btn-action edit" data-user-id="${user.id}" title="Editar usuário">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action permissions" data-user-id="${user.id}" title="Gerenciar permissões">
                <i class="fas fa-key"></i>
            </button>
            <button class="btn-action logs" data-user-id="${user.id}" title="Ver logs do usuário">
                <i class="fas fa-history"></i>
            </button>
            <button class="btn-action delete" data-user-id="${user.id}" title="Excluir usuário">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

/**
 * Configurar event listeners da tabela
 */
function setupTableEventListeners() {
    console.log('[ADMIN] Configurando event listeners da tabela');
    
    // Remover event listeners anteriores se existirem
    document.querySelectorAll('.btn-action.edit, .btn-action.delete, .btn-action.permissions, .btn-action.logs').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // Event listeners para botões de editar
    const editButtons = document.querySelectorAll('.btn-action.edit');
    console.log(`[ADMIN] Configurando ${editButtons.length} botões de editar`);
    editButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            console.log('[ADMIN] Botão editar clicado, userId:', userId, typeof userId);
            if (userId && userId !== 'null' && userId !== 'undefined') {
                editUser(parseInt(userId));
            } else {
                console.error('[ADMIN] ID do usuário inválido:', userId);
                showError('Erro ao identificar usuário para edição');
            }
        });
    });
    
    // Event listeners para botões de permissões
    const permissionButtons = document.querySelectorAll('.btn-action.permissions');
    console.log(`[ADMIN] Configurando ${permissionButtons.length} botões de permissões`);
    permissionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            console.log('[ADMIN] Botão permissões clicado, userId:', userId);
            if (userId && userId !== 'null' && userId !== 'undefined') {
                openPermissionsModal(parseInt(userId));
            } else {
                console.error('[ADMIN] ID do usuário inválido:', userId);
                showError('Erro ao identificar usuário para permissões');
            }
        });
    });
    
    // Event listeners para botões de logs
    const logsButtons = document.querySelectorAll('.btn-action.logs');
    console.log(`[ADMIN] Configurando ${logsButtons.length} botões de logs`);
    logsButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            console.log('[ADMIN] Botão logs clicado, userId:', userId);
            if (userId && userId !== 'null' && userId !== 'undefined') {
                openLogsModal(parseInt(userId));
            } else {
                console.error('[ADMIN] ID do usuário inválido:', userId);
                showError('Erro ao identificar usuário para logs');
            }
        });
    });
    
    // Event listeners para botões de deletar
    const deleteButtons = document.querySelectorAll('.btn-action.delete');
    console.log(`[ADMIN] Configurando ${deleteButtons.length} botões de deletar`);
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            console.log('[ADMIN] Botão deletar clicado, userId:', userId, typeof userId);
            if (userId && userId !== 'null' && userId !== 'undefined') {
                deleteUser(parseInt(userId));
            } else {
                console.error('[ADMIN] ID do usuário inválido:', userId);
                showError('Erro ao identificar usuário para exclusão');
            }
        });
    });
}

/**
 * Event Handlers
 */

// Handler para busca de usuários
function handleUserSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log(`[ADMIN] Buscando usuários: "${searchTerm}"`);
    
    if (!adminData.users || adminData.users.length === 0) {
        console.log('[ADMIN] Nenhum usuário para buscar');
        return;
    }
    
    if (searchTerm === '') {
        adminData.filteredUsers = adminData.users;
    } else {
        adminData.filteredUsers = adminData.users.filter(user => 
            (user.username || '').toLowerCase().includes(searchTerm) ||
            (user.nome || '').toLowerCase().includes(searchTerm) ||
            (user.email || '').toLowerCase().includes(searchTerm)
        );
    }
    
    updateUsersTableSimple(adminData.filteredUsers);
    console.log(`[ADMIN] Busca resultou em ${adminData.filteredUsers.length} usuários`);
}

// Handler para logout
function handleLogout(event) {
    event.preventDefault();
    console.log('[ADMIN] Logout solicitado');
    
    if (confirm('Deseja realmente sair do sistema?')) {
        console.log('[ADMIN] Realizando logout...');
        window.location.href = '/api/auth/logout';
    }
}

/**
 * Modal de usuário
 */
function showUserModal(userId = null) {
    console.log(`[ADMIN] Abrindo modal de usuário ${userId ? `(ID: ${userId})` : '(novo)'}`);
    
    const modal = document.getElementById('userModal');
    if (!modal) {
        console.error('[ADMIN] Modal de usuário não encontrado!');
        showError('Modal não encontrado');
        return;
    }
    
    // Limpar formulário
    const form = document.getElementById('userForm');
    if (form) {
        form.reset();
        
        // Se for novo usuário, limpar ID e ajustar campos
        if (!userId) {
            const idInput = form.querySelector('[name="id"]');
            if (idInput) {
                idInput.value = '';
            }
            
            // Tornar senha obrigatória para novo usuário
            const passwordFields = form.querySelectorAll('[name="password"], [name="password_confirm"]');
            passwordFields.forEach(field => {
                field.required = true;
            });
            
            // Atualizar título do modal
            const modalTitle = document.getElementById('user-modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Novo Usuário';
            }
        }
    }
    
    // Se for edição, carregar dados do usuário
    if (userId) {
        loadUserForEdit(userId);
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevenir scroll
}

function closeUserModal() {
    console.log('[ADMIN] Fechando modal de usuário');
    
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function loadUserForEdit(userId) {
    console.log(`[ADMIN] Carregando usuário para edição: ${userId}`, typeof userId, userId);
    
    if (!userId || userId === null || userId === undefined) {
        console.error('[ADMIN] ID de usuário inválido recebido:', userId);
        showError('ID de usuário inválido');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        console.log(`[ADMIN] Response status para usuário ${userId}:`, response.status);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const user = await response.json();
        populateUserForm(user);
        
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar usuário:', error);
        showError('Erro ao carregar dados do usuário');
    }
}

function populateUserForm(user) {
    console.log('[ADMIN] Preenchendo formulário com dados do usuário');
    
    const form = document.getElementById('userForm');
    if (!form) return;
    
    // Preencher ID do usuário
    const idInput = form.querySelector('[name="id"]');
    if (idInput) {
        idInput.value = user.id;
    }
    
    // Preencher campos básicos
    const fields = ['username', 'nome', 'email'];
    fields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input && user[field]) {
            input.value = user[field];
        }
    });
    
    // Checkbox de admin
    const isAdminCheckbox = form.querySelector('[name="is_admin"]');
    if (isAdminCheckbox) {
        isAdminCheckbox.checked = user.is_admin;
    }
    
    // Checkbox de ativo
    const isActiveCheckbox = form.querySelector('[name="active"]');
    if (isActiveCheckbox) {
        isActiveCheckbox.checked = user.active;
    }
    
    // Campos de senha não devem ser preenchidos em edição
    const passwordFields = form.querySelectorAll('[name="password"], [name="password_confirm"]');
    passwordFields.forEach(field => {
        field.required = false; // Senha não é obrigatória em edição
        field.value = '';
    });
    
    // Atualizar título do modal
    const modalTitle = document.getElementById('user-modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Editar Usuário: ${user.username}`;
    }
}

/**
 * Operações CRUD
 */

async function saveUser(userData) {
    console.log('[ADMIN] Salvando usuário:', userData);
    
    const url = userData.id ? `/api/admin/users/${userData.id}` : '/api/admin/users';
    const method = userData.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar usuário');
    }
    
    return response.json();
}

function editUser(userId) {
    console.log(`[ADMIN] Editando usuário: ${userId}`);
    showUserModal(userId);
}

async function deleteUser(userId) {
    console.log(`[ADMIN] Solicitação para deletar usuário: ${userId}`);
    
    if (!confirm('Tem certeza que deseja excluir este usuário?\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao excluir usuário');
        }
        
        await loadUsersSimple(); // Recarregar lista
        showSuccess('Usuário excluído com sucesso!');
        
    } catch (error) {
        console.error('[ADMIN] Erro ao excluir usuário:', error);
        showError('Erro ao excluir usuário: ' + error.message);
    }
}

/**
 * Modal de Permissões
 */
async function openPermissionsModal(userId) {
    console.log(`[ADMIN] Abrindo modal de permissões para usuário: ${userId}`);
    
    try {
        // Carregar dados do usuário
        const userResponse = await fetch(`/api/admin/users/${userId}`);
        if (!userResponse.ok) {
            throw new Error(`Erro ao carregar usuário: ${userResponse.status}`);
        }
        const user = await userResponse.json();
        
        // Carregar permissões disponíveis
        const permissionsResponse = await fetch('/api/admin/permissions');
        if (!permissionsResponse.ok) {
            throw new Error(`Erro ao carregar permissões: ${permissionsResponse.status}`);
        }
        const permissions = await permissionsResponse.json();
        
        // Abrir modal
        const modal = document.getElementById('permissionsModal');
        if (modal) {
            // Preencher informações do usuário
            document.getElementById('permissions-user-name').textContent = user.nome || user.username;
            document.getElementById('permissions-user-details').textContent = `${user.username} - ${user.email || 'Sem email'}`;
            
            // Limpar e preencher permissões
            const permissionsLists = document.querySelectorAll('.permissions-list');
            permissionsLists.forEach(list => {
                list.innerHTML = '';
            });
            
            // Agrupar permissões por categoria
            const permissionsByCategory = {};
            permissions.forEach(perm => {
                const category = perm.categoria || 'geral';
                if (!permissionsByCategory[category]) {
                    permissionsByCategory[category] = [];
                }
                permissionsByCategory[category].push(perm);
            });
            
            // Preencher cada categoria
            Object.keys(permissionsByCategory).forEach(category => {
                const list = document.querySelector(`[data-category="${category}"]`);
                if (list) {
                    permissionsByCategory[category].forEach(perm => {
                        const hasPermission = user.permissions.some(p => p.id === perm.id);
                        const checkbox = document.createElement('div');
                        checkbox.className = 'permission-item';
                        checkbox.innerHTML = `
                            <label>
                                <input type="checkbox" value="${perm.id}" ${hasPermission ? 'checked' : ''}>
                                <span class="permission-name">${perm.nome}</span>
                                <small class="permission-desc">${perm.descricao || ''}</small>
                            </label>
                        `;
                        list.appendChild(checkbox);
                    });
                }
            });
            
            modal.style.display = 'block';
            modal.setAttribute('data-user-id', userId);
        }
        
    } catch (error) {
        console.error('[ADMIN] Erro ao abrir modal de permissões:', error);
        showError('Erro ao carregar permissões: ' + error.message);
    }
}

/**
 * Modal de Logs
 */
async function openLogsModal(userId) {
    console.log(`[ADMIN] Abrindo modal de logs para usuário: ${userId}`);
    
    try {
        // Carregar logs do usuário
        const response = await fetch(`/api/admin/users/${userId}/logs`);
        if (!response.ok) {
            throw new Error(`Erro ao carregar logs: ${response.status}`);
        }
        const logs = await response.json();
        
        // Criar modal de logs se não existir
        let modal = document.getElementById('logsModal');
        if (!modal) {
            modal = createLogsModal();
            document.body.appendChild(modal);
        }
        
        // Carregar dados do usuário para o cabeçalho
        const userResponse = await fetch(`/api/admin/users/${userId}`);
        const user = userResponse.ok ? await userResponse.json() : { username: `Usuário ${userId}` };
        
        // Preencher modal
        document.getElementById('logs-user-name').textContent = user.nome || user.username;
        document.getElementById('logs-user-details').textContent = `Logs de atividade - ${user.username}`;
        
        // Preencher logs
        const logsContainer = document.getElementById('logs-container');
        logsContainer.innerHTML = '';
        
        if (logs.length === 0) {
            logsContainer.innerHTML = '<p class="no-logs">Nenhum log encontrado para este usuário.</p>';
        } else {
            logs.forEach(log => {
                const logElement = document.createElement('div');
                logElement.className = `log-entry log-${log.tipo || 'info'}`;
                logElement.innerHTML = `
                    <div class="log-header">
                        <span class="log-time">${formatDate(log.data_hora)}</span>
                        <span class="log-type">${log.tipo || 'INFO'}</span>
                    </div>
                    <div class="log-message">${log.mensagem}</div>
                    ${log.detalhes ? `<div class="log-details">${log.detalhes}</div>` : ''}
                `;
                logsContainer.appendChild(logElement);
            });
        }
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('[ADMIN] Erro ao abrir modal de logs:', error);
        showError('Erro ao carregar logs: ' + error.message);
    }
}

function createLogsModal() {
    const modal = document.createElement('div');
    modal.id = 'logsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="logs-modal-title">Logs do Usuário</h2>
                <span class="close" onclick="document.getElementById('logsModal').style.display='none'">&times;</span>
            </div>
            <div class="logs-content">
                <div class="logs-info">
                    <h4 id="logs-user-name"></h4>
                    <p id="logs-user-details"></p>
                </div>
                <div class="logs-list" id="logs-container">
                    <!-- Logs carregados via JavaScript -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('logsModal').style.display='none'">
                    Fechar
                </button>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Funções utilitárias
 */

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '-';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Funções de notificação
 */
function showSuccess(message) {
    console.log('[ADMIN] Sucesso:', message);
    showNotification(message, 'success');
}

function showError(message) {
    console.error('[ADMIN] Erro:', message);
    showNotification(message, 'error');
}

function showInfo(message) {
    console.log('[ADMIN] Info:', message);
    showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${escapeHtml(message)}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Adicionar à página
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Funções de debug e logging
 */
function logAdminState() {
    console.log('[ADMIN] Estado atual:', {
        currentUser: adminData.currentUser,
        usersCount: adminData.users.length,
        filteredUsersCount: adminData.filteredUsers.length,
        permissionsCount: adminData.permissions.length
    });
}

// Expor algumas funções globalmente para debug
if (typeof window !== 'undefined') {
    window.adminDebug = {
        adminData,
        logAdminState,
        loadUsers,
        loadStats,
        loadPermissions
    };
}

/**
 * CSS dinâmico para notificações
 */
function injectNotificationStyles() {
    if (document.getElementById('admin-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'admin-notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        }
        
        .notification-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .notification-error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .notification-info {
            background: #d1ecf1;
            border: 1px solid #b6d4db;
            color: #0c5460;
        }
        
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
            opacity: 0.7;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Mostrar/esconder loading global
 */
function showLoading(show) {
    try {
        let overlay = document.getElementById('globalLoadingOverlay');
        
        if (!overlay && show) {
            // Criar overlay de loading se não existir
            overlay = document.createElement('div');
            overlay.id = 'globalLoadingOverlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>Carregando dados do painel...</p>
                    <button onclick="hideLoadingForce()" style="margin-top: 15px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Parar Carregamento</button>
                    <button onclick="location.reload()" style="margin-top: 10px; margin-left: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Recarregar Página</button>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-family: 'Segoe UI', sans-serif;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-content {
                    text-align: center;
                    background: rgba(0,0,0,0.9);
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(overlay);
            console.log('[ADMIN] Loading overlay criado');
        }
        
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
            console.log(`[ADMIN] Loading ${show ? 'MOSTRADO' : 'ESCONDIDO'} - display: ${overlay.style.display}`);
        }
        
    } catch (error) {
        console.error('[ADMIN] Erro na função showLoading:', error);
    }
}

/**
 * Função para forçar remoção do loading
 */
function hideLoadingForce() {
    console.log('[ADMIN] Forçando remoção do loading...');
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) {
        overlay.remove();
        console.log('[ADMIN] Loading overlay removido à força');
    }
}

// Injetar estilos quando o script carregar
injectNotificationStyles();

// Funções de ação dos usuários (placeholders)
function editUser(userId) {
    alert(`Editar usuário ID: ${userId} - Função será implementada em breve.`);
}

function deleteUser(userId) {
    if (confirm(`Deseja realmente excluir o usuário ID: ${userId}?`)) {
        alert('Função de exclusão será implementada em breve.');
    }
}

/**
 * Gerenciar permissões do usuário
 */
async function managePermissions(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    try {
        // Carregar permissões disponíveis
        const permissionsResponse = await fetch('/api/admin/permissions');
        if (!permissionsResponse.ok) {
            throw new Error('Erro ao carregar permissões');
        }
        
        const availablePermissions = await permissionsResponse.json();
        
        // Carregar permissões atuais do usuário
        const userResponse = await fetch(`/api/admin/users/${userId}`);
        if (!userResponse.ok) {
            throw new Error('Erro ao carregar dados do usuário');
        }
        
        const userData = await userResponse.json();
        const currentPermissions = userData.permissions || [];
        
        // Mostrar modal de permissões
        showPermissionsModal(user, availablePermissions, currentPermissions);
        
    } catch (error) {
        console.error('[ADMIN] Erro ao carregar dados para gerenciar permissões:', error);
        showMessage('Erro ao carregar dados de permissões: ' + error.message, 'error');
    }
}

/**
 * Mostrar modal de permissões
 */
function showPermissionsModal(user, availablePermissions, currentPermissions) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('permissions-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'permissions-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    // Criar conteúdo do modal
    let permissionsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Gerenciar Permissões - ${user.username}</h3>
            <button onclick="closePermissionsModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div style="margin-bottom: 20px;">
            <p><strong>Nome:</strong> ${user.nome || user.username}</p>
            <p><strong>Email:</strong> ${user.email || 'Não informado'}</p>
            <p><strong>Tipo:</strong> ${user.is_admin ? 'Administrador' : 'Usuário'}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <h4>Permissões Disponíveis:</h4>
            <form id="permissions-form">
    `;
    
    // Adicionar checkboxes para cada permissão
    availablePermissions.forEach(permission => {
        const isChecked = currentPermissions.some(p => p === permission.id || p.nome === permission.id);
        permissionsHTML += `
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" name="permissions" value="${permission.id}" ${isChecked ? 'checked' : ''} style="margin-right: 10px;">
                    <div>
                        <strong>${permission.name}</strong>
                        <br>
                        <small style="color: #666;">${permission.description}</small>
                    </div>
                </label>
            </div>
        `;
    });
    
    permissionsHTML += `
            </form>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="closePermissionsModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Cancelar
            </button>
            <button onclick="savePermissions(${user.id})" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Salvar Permissões
            </button>
        </div>
    `;
    
    modalContent.innerHTML = permissionsHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

/**
 * Fechar modal de permissões
 */
function closePermissionsModal() {
    const modal = document.getElementById('permissions-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Salvar permissões do usuário
 */
async function savePermissions(userId) {
    try {
        // Obter permissões selecionadas
        const form = document.getElementById('permissions-form');
        const formData = new FormData(form);
        const selectedPermissions = formData.getAll('permissions');
        
        console.log('[ADMIN] Salvando permissões para usuário', userId, ':', selectedPermissions);
        
        // Enviar para o servidor
        const response = await fetch(`/api/admin/users/${userId}/permissions`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                permissions: selectedPermissions
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Permissões atualizadas com sucesso!', 'success');
            closePermissionsModal();
            
            // Recarregar dados dos usuários
            loadUsersSimple();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao salvar permissões');
        }
        
    } catch (error) {
        console.error('[ADMIN] Erro ao salvar permissões:', error);
        showMessage('Erro ao salvar permissões: ' + error.message, 'error');
    }
}

/**
 * Função para mostrar mensagem de sucesso
 */
function showSuccess(message) {
    showMessage(message, 'success');
}

/**
 * Função para mostrar mensagem de erro
 */
function showError(message) {
    showMessage(message, 'error');
}

/**
 * Função para mostrar notificações
 */
function showMessage(message, type = 'info') {
    console.log(`[ADMIN] Mostrando mensagem ${type}:`, message);
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adicionar estilos básicos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 9999;
        max-width: 400px;
        color: white;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Definir cor baseada no tipo
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = '#212529';
    } else {
        notification.style.backgroundColor = '#17a2b8';
    }
    
    // Adicionar ao documento
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

/**
 * Handler para submissão de formulário de usuário
 */
async function handleUserSubmit(event) {
    event.preventDefault();
    console.log('[ADMIN] Submissão de formulário de usuário');
    
    const formData = new FormData(event.target);
    const userData = {};
    
    // Converter form data para objeto
    for (let [key, value] of formData.entries()) {
        if (key === 'active' || key === 'is_admin') {
            userData[key] = value === '1';
        } else {
            userData[key] = value;
        }
    }
    
    // Se os checkboxes não estiverem marcados, definir como false
    if (!formData.has('active')) userData.active = false;
    if (!formData.has('is_admin')) userData.is_admin = false;
    
    console.log('[ADMIN] Dados do formulário:', userData);
    
    try {
        await saveUser(userData);
        closeUserModal();
        await loadUsersSimple(); // Recarregar lista
        showSuccess('Usuário salvo com sucesso!');
    } catch (error) {
        console.error('[ADMIN] Erro ao salvar usuário:', error);
        showError('Erro ao salvar usuário: ' + error.message);
    }
}

console.log('[ADMIN] JavaScript carregado completamente');