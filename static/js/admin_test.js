/**
 * SCRIPT DE TESTE SIMPLIFICADO PARA ADMIN
 */

console.log('[ADMIN-TEST] Script carregado');

document.addEventListener('DOMContentLoaded', async function() {
    console.log('[ADMIN-TEST] DOM carregado');
    
    try {
        // Verificar autenticação
        const authResponse = await fetch('/api/auth/check-session');
        if (!authResponse.ok) {
            console.log('[ADMIN-TEST] Não autenticado');
            return;
        }
        
        const authData = await authResponse.json();
        if (!authData.authenticated || !authData.user.is_admin) {
            console.log('[ADMIN-TEST] Não é admin');
            return;
        }
        
        console.log('[ADMIN-TEST] Autenticação OK');
        
        // Carregar usuários
        console.log('[ADMIN-TEST] Carregando usuários...');
        const usersResponse = await fetch('/api/admin/users');
        
        if (!usersResponse.ok) {
            console.error('[ADMIN-TEST] Erro ao carregar usuários:', usersResponse.status);
            return;
        }
        
        const users = await usersResponse.json();
        console.log('[ADMIN-TEST] Usuários carregados:', users);
        
        // Atualizar tabela
        const tbody = document.getElementById('users-table-body');
        if (!tbody) {
            console.error('[ADMIN-TEST] Elemento users-table-body não encontrado');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10">Nenhum usuário encontrado</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" value="${user.id}"></td>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.nome || user.username}</td>
                <td>${user.email || ''}</td>
                <td><span class="badge">${user.is_admin ? 'Admin' : 'Usuário'}</span></td>
                <td><span class="status">${user.active || user.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${user.last_login || user.data_ultimo_login || 'Nunca'}</td>
                <td>Nenhuma</td>
                <td>
                    <button onclick="alert('Editar ${user.username}')">Editar</button>
                    <button onclick="alert('Excluir ${user.username}')">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('[ADMIN-TEST] Tabela atualizada com sucesso');
        
        // Carregar estatísticas
        const statsResponse = await fetch('/api/admin/stats');
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('[ADMIN-TEST] Estatísticas:', stats);
            
            // Atualizar estatísticas na tela
            const totalUsersEl = document.getElementById('total-users');
            if (totalUsersEl) totalUsersEl.textContent = stats.total_users || 0;
            
            const totalAdminsEl = document.getElementById('total-admins');
            if (totalAdminsEl) totalAdminsEl.textContent = stats.total_admins || 0;
            
            const usersOnlineEl = document.getElementById('users-online');
            if (usersOnlineEl) usersOnlineEl.textContent = stats.users_online || 0;
        }
        
    } catch (error) {
        console.error('[ADMIN-TEST] Erro:', error);
    }
});