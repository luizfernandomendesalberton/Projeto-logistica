/**
 * JavaScript para página de gerenciamento de permissões - SIMPLIFICADO
 */

let permissionsData = {
    permissions: [],
    filteredPermissions: []
};

console.log('[PERMISSIONS] Script simplificado carregado');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('[PERMISSIONS] DOM carregado - inicializando página de permissões');
    
    setupEventListeners();
    loadPermissions();
});

function setupEventListeners() {
    console.log('[PERMISSIONS] Configurando event listeners...');
    
    // Busca
    const searchInput = document.getElementById('permissionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handlePermissionSearch);
    }
    
    // Botão logout
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                window.location.href = '/logout';
            }
        });
    }
    
    console.log('[PERMISSIONS] Event listeners configurados');
}

async function loadPermissions() {
    console.log('[PERMISSIONS] Carregando permissões...');
    
    try {
        const response = await fetch('/api/admin/permissions');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const permissions = await response.json();
        console.log('[PERMISSIONS] Permissões carregadas:', permissions);
        
        permissionsData.permissions = permissions;
        permissionsData.filteredPermissions = permissions;
        
        updatePermissionsTable(permissions);
        
    } catch (error) {
        console.error('[PERMISSIONS] Erro ao carregar permissões:', error);
        showError('Erro ao carregar permissões: ' + error.message);
    }
}

function updatePermissionsTable(permissions) {
    console.log('[PERMISSIONS] Atualizando tabela com', permissions.length, 'permissões');
    
    const tbody = document.getElementById('permissions-table-body');
    if (!tbody) {
        console.error('[PERMISSIONS] Elemento permissions-table-body não encontrado');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!permissions || permissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhuma permissão encontrada</td></tr>';
        return;
    }
    
    permissions.forEach((permission, index) => {
        const row = createPermissionRow(permission, index + 1);
        tbody.appendChild(row);
    });
    
    console.log('[PERMISSIONS] Tabela atualizada com sucesso');
}

function createPermissionRow(permission, index) {
    const row = document.createElement('tr');
    
    // Categoria baseada no ID da permissão
    let category = 'Sistema';
    if (permission.id.includes('dashboard')) category = 'Dashboard';
    else if (permission.id.includes('produto')) category = 'Produtos';
    else if (permission.id.includes('estoque')) category = 'Estoque';
    else if (permission.id.includes('relatorio')) category = 'Relatórios';
    else if (permission.id.includes('usuario')) category = 'Administração';
    else if (permission.id.includes('nfc')) category = 'Sistema';
    
    row.innerHTML = `
        <td>${index}</td>
        <td>${escapeHtml(permission.name)}</td>
        <td>${escapeHtml(permission.description)}</td>
        <td><span class="category-badge">${category}</span></td>
        <td>
            <button class="btn-small" onclick="viewUsersWithPermission('${permission.id}')" title="Ver usuários com esta permissão">
                <i class="fas fa-users"></i>
                0 usuários
            </button>
        </td>
        <td class="actions">
            <button class="btn-action view" onclick="viewPermissionDetails('${permission.id}')" title="Ver detalhes">
                <i class="fas fa-eye"></i>
            </button>
        </td>
    `;
    
    return row;
}

function handlePermissionSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (!permissionsData.permissions || permissionsData.permissions.length === 0) {
        return;
    }
    
    const filteredPermissions = permissionsData.permissions.filter(permission => {
        return (permission.name || '').toLowerCase().includes(searchTerm) ||
               (permission.description || '').toLowerCase().includes(searchTerm) ||
               (permission.id || '').toLowerCase().includes(searchTerm);
    });
    
    permissionsData.filteredPermissions = filteredPermissions;
    updatePermissionsTable(filteredPermissions);
}

function viewUsersWithPermission(permissionId) {
    showMessage(`Visualizar usuários com a permissão "${permissionId}" será implementado em breve`, 'info');
}

function viewPermissionDetails(permissionId) {
    const permission = permissionsData.permissions.find(p => p.id === permissionId);
    if (!permission) {
        showMessage('Permissão não encontrada', 'error');
        return;
    }
    
    // Criar modal de detalhes
    const modal = document.createElement('div');
    modal.id = 'permission-details-modal';
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
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Detalhes da Permissão</h3>
            <button onclick="closePermissionDetailsModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div style="margin-bottom: 15px;">
            <strong>ID:</strong> ${permission.id}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Nome:</strong> ${permission.name}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Descrição:</strong> ${permission.description}
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="closePermissionDetailsModal()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Fechar
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function closePermissionDetailsModal() {
    const modal = document.getElementById('permission-details-modal');
    if (modal) {
        modal.remove();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type = 'info') {
    console.log(`[PERMISSIONS] ${type.toUpperCase()}:`, message);
    
    // Remover mensagem anterior
    const existingMessage = document.getElementById('permission-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.id = 'permission-message';
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

function showError(message) {
    showMessage(message, 'error');
}

console.log('[PERMISSIONS] JavaScript simplificado carregado completamente');