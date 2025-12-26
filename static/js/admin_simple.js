/**
 * ADMIN PANEL JAVASCRIPT - VERSÃO SIMPLIFICADA E FUNCIONAL
 * Sistema de administração para logística de estoque
 */

// Variáveis globais
let adminData = {
    currentUser: null,
    users: [],
    permissions: [],
    filteredUsers: []
};

console.log('[ADMIN-SIMPLE] Script carregado');

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('[ADMIN-SIMPLE] DOM carregado, inicializando...');
    
    // Remover qualquer loading imediatamente
    hideAllLoadingElements();
    
    // Inicializar painel admin
    initAdminPanel();
});

/**
 * Remover todos os elementos de loading
 */
function hideAllLoadingElements() {
    console.log('[ADMIN-SIMPLE] Removendo elementos de loading...');
    
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
    console.log('[ADMIN-SIMPLE] Inicializando painel admin...');
    
    try {
        // 1. Verificar autenticação
        const isAuth = await checkAuth();
        if (!isAuth) {
            console.log('[ADMIN-SIMPLE] Não autenticado, redirecionando...');
            window.location.href = '/login';
            return;
        }
        
        // 2. Configurar interface básica
        setupEventListeners();
        
        // 3. Carregar dados
        await loadAllData();
        
        console.log('[ADMIN-SIMPLE] Inicialização concluída com sucesso');
        
    } catch (error) {
        console.error('[ADMIN-SIMPLE] Erro na inicialização:', error);
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
        console.error('[ADMIN-SIMPLE] Erro na verificação de autenticação:', error);
        return false;
    }
}

/**
 * Carregar todos os dados
 */
async function loadAllData() {
    console.log('[ADMIN-SIMPLE] Carregando dados...');
    
    // Carregar em paralelo
    const promises = [
        loadStats(),
        loadUsers(),
        loadPermissions()
    ];
    
    // Aguardar todos ou mostrar erros individuais
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
        const names = ['estatísticas', 'usuários', 'permissões'];
        if (result.status === 'rejected') {
            console.error(`[ADMIN-SIMPLE] Erro ao carregar ${names[index]}:`, result.reason);
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
        } else {
            throw new Error(`Status: ${response.status}`);
        }
    } catch (error) {
        console.error('[ADMIN-SIMPLE] Erro ao carregar estatísticas:', error);
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
                console.log(`[ADMIN-SIMPLE] ${users.length} usuários carregados`);
            } else {
                throw new Error('Dados de usuários não são um array');
            }
        } else {
            throw new Error(`Status: ${response.status}`);
        }
    } catch (error) {
        console.error('[ADMIN-SIMPLE] Erro ao carregar usuários:', error);
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
        }
    } catch (error) {
        console.error('[ADMIN-SIMPLE] Erro ao carregar permissões:', error);
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
    console.log('[ADMIN-SIMPLE] Atualizando tabela com', users.length, 'usuários');
    
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('[ADMIN-SIMPLE] Elemento users-table-body não encontrado');
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
    console.log('[ADMIN-SIMPLE] Tabela atualizada com sucesso');
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
    
    row.innerHTML = `
        <td><input type="checkbox" value="${id}" class="user-checkbox"></td>
        <td>${id}</td>
        <td>${username}</td>
        <td>${nome}</td>
        <td>${email}</td>
        <td><span class="badge ${isAdmin ? 'admin' : 'user'}">${isAdmin ? 'Admin' : 'Usuário'}</span></td>
        <td><span class="status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span></td>
        <td>${lastLogin}</td>
        <td><span class="no-permissions">Nenhuma</span></td>
        <td class="actions">
            <button class="btn-action edit" data-user-id="${id}" title="Editar usuário">
                <i class="fas fa-edit"></i>
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
    console.log('[ADMIN-SIMPLE] Configurando event listeners...');
    
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botão novo usuário
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showMessage('Função de adicionar usuário será implementada em breve', 'info');
        });
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
 * Editar usuário
 */
function editUser(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    showMessage(`Edição do usuário "${user.username}" será implementada em breve`, 'info');
}

/**
 * Excluir usuário
 */
function deleteUser(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    if (confirm(`Deseja realmente excluir o usuário "${user.username}"?\n\nEsta ação não pode ser desfeita.`)) {
        showMessage(`Exclusão do usuário "${user.username}" será implementada em breve`, 'info');
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
    console.log(`[ADMIN-SIMPLE] ${type.toUpperCase()}:`, message);
    
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

console.log('[ADMIN-SIMPLE] JavaScript carregado completamente');