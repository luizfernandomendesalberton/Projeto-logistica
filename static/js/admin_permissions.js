/**
 * JavaScript para página de gerenciamento de permissões
 */

let permissionsData = {
    permissions: [],
    filteredPermissions: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('[PERMISSIONS] Inicializando página de permissões');
    
    setupEventListeners();
    loadPermissions();
});

function setupEventListeners() {
    // Busca
    document.getElementById('permissionSearch').addEventListener('input', handlePermissionSearch);
    
    // Botões
    document.getElementById('newPermissionBtn').addEventListener('click', () => showPermissionModal());
    document.getElementById('cancelPermissionBtn').addEventListener('click', closePermissionModal);
    
    // Modal
    const modal = document.getElementById('permissionModal');
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', closePermissionModal);
    
    // Formulário
    document.getElementById('permissionForm').addEventListener('submit', handlePermissionSubmit);
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePermissionModal();
        }
    });
}

async function loadPermissions() {
    console.log('[PERMISSIONS] Carregando permissões');
    
    try {
        const response = await fetch('/api/admin/permissions');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const permissions = await response.json();
        console.log(`[PERMISSIONS] Carregadas ${permissions.length} permissões`);
        
        permissionsData.permissions = permissions;
        permissionsData.filteredPermissions = permissions;
        
        updatePermissionsTable(permissions);
        
    } catch (error) {
        console.error('[PERMISSIONS] Erro ao carregar permissões:', error);
        showError('Erro ao carregar permissões: ' + error.message);
    }
}

function updatePermissionsTable(permissions) {
    const tbody = document.getElementById('permissions-table-body');
    tbody.innerHTML = '';
    
    if (permissions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <i class="fas fa-info-circle"></i>
                    Nenhuma permissão encontrada
                </td>
            </tr>
        `;
        return;
    }
    
    permissions.forEach(permission => {
        const row = createPermissionRow(permission);
        tbody.appendChild(row);
    });
    
    console.log(`[PERMISSIONS] Tabela atualizada com ${permissions.length} permissões`);
}

function createPermissionRow(permission) {
    const row = document.createElement('tr');
    row.setAttribute('data-permission-id', permission.id);
    
    row.innerHTML = `
        <td>${permission.id}</td>
        <td><strong>${escapeHtml(permission.nome)}</strong></td>
        <td>${escapeHtml(permission.descricao || '')}</td>
        <td><span class="badge category-${permission.categoria || 'default'}">${permission.categoria || 'Geral'}</span></td>
        <td><span class="user-count">${permission.user_count || 0} usuários</span></td>
        <td class="actions">
            <button class="btn-action edit" onclick="editPermission(${permission.id})" title="Editar permissão">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action delete" onclick="deletePermission(${permission.id})" title="Excluir permissão">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function handlePermissionSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log(`[PERMISSIONS] Buscando: "${searchTerm}"`);
    
    if (searchTerm === '') {
        permissionsData.filteredPermissions = permissionsData.permissions;
    } else {
        permissionsData.filteredPermissions = permissionsData.permissions.filter(permission => 
            permission.nome.toLowerCase().includes(searchTerm) ||
            (permission.descricao && permission.descricao.toLowerCase().includes(searchTerm)) ||
            (permission.categoria && permission.categoria.toLowerCase().includes(searchTerm))
        );
    }
    
    updatePermissionsTable(permissionsData.filteredPermissions);
    console.log(`[PERMISSIONS] Busca resultou em ${permissionsData.filteredPermissions.length} permissões`);
}

function showPermissionModal(permissionId = null) {
    console.log(`[PERMISSIONS] Abrindo modal de permissão ${permissionId ? `(ID: ${permissionId})` : '(nova)'}`);
    
    const modal = document.getElementById('permissionModal');
    const form = document.getElementById('permissionForm');
    const title = document.getElementById('permission-modal-title');
    
    // Limpar formulário
    form.reset();
    
    if (permissionId) {
        title.textContent = 'Editar Permissão';
        loadPermissionForEdit(permissionId);
    } else {
        title.textContent = 'Nova Permissão';
    }
    
    modal.style.display = 'block';
}

function closePermissionModal() {
    console.log('[PERMISSIONS] Fechando modal de permissão');
    
    const modal = document.getElementById('permissionModal');
    modal.style.display = 'none';
}

async function loadPermissionForEdit(permissionId) {
    console.log(`[PERMISSIONS] Carregando permissão para edição: ${permissionId}`);
    
    try {
        const permission = permissionsData.permissions.find(p => p.id === permissionId);
        if (!permission) {
            throw new Error('Permissão não encontrada');
        }
        
        // Preencher formulário
        document.getElementById('permissionId').value = permission.id;
        document.getElementById('permissionName').value = permission.nome;
        document.getElementById('permissionDescription').value = permission.descricao || '';
        document.getElementById('permissionCategory').value = permission.categoria || '';
        
    } catch (error) {
        console.error('[PERMISSIONS] Erro ao carregar permissão:', error);
        showError('Erro ao carregar permissão: ' + error.message);
    }
}

async function handlePermissionSubmit(event) {
    event.preventDefault();
    console.log('[PERMISSIONS] Submissão de formulário de permissão');
    
    const formData = new FormData(event.target);
    const permissionData = Object.fromEntries(formData);
    
    console.log('[PERMISSIONS] Dados do formulário:', permissionData);
    
    try {
        await savePermission(permissionData);
        closePermissionModal();
        await loadPermissions(); // Recarregar lista
        showSuccess('Permissão salva com sucesso!');
    } catch (error) {
        console.error('[PERMISSIONS] Erro ao salvar permissão:', error);
        showError('Erro ao salvar permissão: ' + error.message);
    }
}

async function savePermission(permissionData) {
    console.log('[PERMISSIONS] Salvando permissão:', permissionData);
    
    const url = permissionData.id ? `/api/admin/permissions/${permissionData.id}` : '/api/admin/permissions';
    const method = permissionData.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissionData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar permissão');
    }
    
    return response.json();
}

function editPermission(permissionId) {
    console.log(`[PERMISSIONS] Editando permissão: ${permissionId}`);
    showPermissionModal(permissionId);
}

async function deletePermission(permissionId) {
    console.log(`[PERMISSIONS] Solicitação para deletar permissão: ${permissionId}`);
    
    if (!confirm('Tem certeza que deseja excluir esta permissão?\\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/permissions/${permissionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao excluir permissão');
        }
        
        await loadPermissions(); // Recarregar lista
        showSuccess('Permissão excluída com sucesso!');
        
    } catch (error) {
        console.error('[PERMISSIONS] Erro ao excluir permissão:', error);
        showError('Erro ao excluir permissão: ' + error.message);
    }
}

// Funções utilitárias
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

function showError(message) {
    console.error('[PERMISSIONS] Erro:', message);
    // Implementar notificação de erro
    alert('Erro: ' + message);
}

function showSuccess(message) {
    console.log('[PERMISSIONS] Sucesso:', message);
    // Implementar notificação de sucesso
    alert('Sucesso: ' + message);
}