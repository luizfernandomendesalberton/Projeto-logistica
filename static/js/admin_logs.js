/**
 * JavaScript para página de logs do sistema
 */

let logsData = {
    logs: [],
    filteredLogs: [],
    currentPage: 1,
    pageSize: 50,
    totalPages: 1
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('[LOGS] Inicializando página de logs');
    
    setupEventListeners();
    loadUsers();
    loadLogs();
});

function setupEventListeners() {
    // Busca e filtros
    document.getElementById('logSearch').addEventListener('input', handleLogSearch);
    document.getElementById('logTypeFilter').addEventListener('change', handleLogFilter);
    document.getElementById('userFilter').addEventListener('change', handleLogFilter);
    document.getElementById('startDate').addEventListener('change', handleLogFilter);
    document.getElementById('endDate').addEventListener('change', handleLogFilter);
    
    // Botões
    document.getElementById('refreshLogsBtn').addEventListener('click', loadLogs);
    document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);
}

async function loadUsers() {
    console.log('[LOGS] Carregando lista de usuários para filtro');
    
    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const users = await response.json();
        const userFilter = document.getElementById('userFilter');
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.nome || user.username} (ID: ${user.id})`;
            userFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('[LOGS] Erro ao carregar usuários:', error);
    }
}

async function loadLogs() {
    console.log('[LOGS] Carregando logs do sistema');
    showLoading(true);
    
    try {
        // Simular carregamento de logs do sistema
        // Por enquanto, vamos usar os logs disponíveis dos usuários
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const users = await response.json();
        let allLogs = [];
        
        // Carregar logs de cada usuário
        for (const user of users) {
            try {
                const userLogsResponse = await fetch(`/api/admin/users/${user.id}/logs`);
                if (userLogsResponse.ok) {
                    const userLogs = await userLogsResponse.json();
                    // Adicionar informações do usuário aos logs
                    userLogs.forEach(log => {
                        log.usuario_id = user.id;
                        log.usuario_nome = user.nome || user.username;
                    });
                    allLogs = allLogs.concat(userLogs);
                }
            } catch (e) {
                console.warn(`[LOGS] Erro ao carregar logs do usuário ${user.id}:`, e);
            }
        }
        
        // Ordenar logs por data (mais recentes primeiro)
        allLogs.sort((a, b) => {
            const dateA = new Date(a.data_hora || 0);
            const dateB = new Date(b.data_hora || 0);
            return dateB - dateA;
        });
        
        logsData.logs = allLogs;
        logsData.filteredLogs = allLogs;
        updatePagination();
        updateLogsDisplay();
        
        console.log(`[LOGS] Carregados ${allLogs.length} logs`);
        
    } catch (error) {
        console.error('[LOGS] Erro ao carregar logs:', error);
        showError('Erro ao carregar logs: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function handleLogSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log(`[LOGS] Buscando: "${searchTerm}"`);
    
    applyFilters();
}

function handleLogFilter() {
    console.log('[LOGS] Aplicando filtros');
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('logSearch').value.toLowerCase().trim();
    const typeFilter = document.getElementById('logTypeFilter').value;
    const userFilter = document.getElementById('userFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let filtered = logsData.logs;
    
    // Filtro de busca
    if (searchTerm) {
        filtered = filtered.filter(log => 
            (log.mensagem && log.mensagem.toLowerCase().includes(searchTerm)) ||
            (log.detalhes && log.detalhes.toLowerCase().includes(searchTerm)) ||
            (log.usuario_nome && log.usuario_nome.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filtro de tipo
    if (typeFilter) {
        filtered = filtered.filter(log => log.tipo === typeFilter);
    }
    
    // Filtro de usuário
    if (userFilter) {
        filtered = filtered.filter(log => log.usuario_id == userFilter);
    }
    
    // Filtro de data
    if (startDate) {
        const start = new Date(startDate);
        filtered = filtered.filter(log => {
            const logDate = new Date(log.data_hora);
            return logDate >= start;
        });
    }
    
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Final do dia
        filtered = filtered.filter(log => {
            const logDate = new Date(log.data_hora);
            return logDate <= end;
        });
    }
    
    logsData.filteredLogs = filtered;
    logsData.currentPage = 1; // Resetar para primeira página
    updatePagination();
    updateLogsDisplay();
    
    console.log(`[LOGS] Filtros resultaram em ${filtered.length} logs`);
}

function updatePagination() {
    logsData.totalPages = Math.ceil(logsData.filteredLogs.length / logsData.pageSize);
    
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (logsData.totalPages <= 1) return;
    
    // Botão anterior
    if (logsData.currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-secondary';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
        prevBtn.onclick = () => changePage(logsData.currentPage - 1);
        pagination.appendChild(prevBtn);
    }
    
    // Números das páginas
    const startPage = Math.max(1, logsData.currentPage - 2);
    const endPage = Math.min(logsData.totalPages, logsData.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn ${i === logsData.currentPage ? 'btn-primary' : 'btn-secondary'}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => changePage(i);
        pagination.appendChild(pageBtn);
    }
    
    // Botão próximo
    if (logsData.currentPage < logsData.totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-secondary';
        nextBtn.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = () => changePage(logsData.currentPage + 1);
        pagination.appendChild(nextBtn);
    }
}

function changePage(page) {
    logsData.currentPage = page;
    updateLogsDisplay();
    updatePagination();
}

function updateLogsDisplay() {
    const container = document.getElementById('logs-container');
    container.innerHTML = '';
    
    const startIndex = (logsData.currentPage - 1) * logsData.pageSize;
    const endIndex = startIndex + logsData.pageSize;
    const logsToShow = logsData.filteredLogs.slice(startIndex, endIndex);
    
    if (logsToShow.length === 0) {
        container.innerHTML = `
            <div class="no-logs">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum log encontrado</p>
            </div>
        `;
        return;
    }
    
    logsToShow.forEach(log => {
        const logElement = createLogElement(log);
        container.appendChild(logElement);
    });
    
    // Adicionar informações de paginação
    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.innerHTML = `
        Mostrando ${startIndex + 1}-${Math.min(endIndex, logsData.filteredLogs.length)} 
        de ${logsData.filteredLogs.length} logs
    `;
    container.insertBefore(info, container.firstChild);
    
    console.log(`[LOGS] Exibindo ${logsToShow.length} logs (página ${logsData.currentPage})`);
}

function createLogElement(log) {
    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${log.tipo || 'info'}`;
    
    logElement.innerHTML = `
        <div class="log-header">
            <div class="log-meta">
                <span class="log-time">${formatDate(log.data_hora)}</span>
                <span class="log-user">${escapeHtml(log.usuario_nome || 'Sistema')}</span>
            </div>
            <span class="log-type">${log.tipo || 'INFO'}</span>
        </div>
        <div class="log-message">${escapeHtml(log.mensagem || '')}</div>
        ${log.detalhes ? `<div class="log-details">${escapeHtml(log.detalhes)}</div>` : ''}
    `;
    
    return logElement;
}

async function clearLogs() {
    if (!confirm('Tem certeza que deseja limpar todos os logs?\\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    console.log('[LOGS] Limpando logs do sistema');
    
    try {
        // Implementar API para limpar logs se necessário
        showError('Funcionalidade de limpeza não implementada');
        
    } catch (error) {
        console.error('[LOGS] Erro ao limpar logs:', error);
        showError('Erro ao limpar logs: ' + error.message);
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// Funções utilitárias
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        return '-';
    }
}

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
    console.error('[LOGS] Erro:', message);
    alert('Erro: ' + message);
}

function showSuccess(message) {
    console.log('[LOGS] Sucesso:', message);
    alert('Sucesso: ' + message);
}