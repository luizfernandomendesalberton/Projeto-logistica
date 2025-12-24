// Funções utilitárias globais
class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            showLoading(true);
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }
            
            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            showError('Erro na comunicação com o servidor: ' + error.message);
            throw error;
        } finally {
            showLoading(false);
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }
}

// Instância global da API
const api = new ApiClient();

// Funções de loading
function showLoading(show = true) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'flex' : 'none';
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info', duration = 3000) {
    // Criar elemento de notificação se não existir
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 5px;
        border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    container.appendChild(notification);

    // Remover notificação após o tempo especificado
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Adicionar CSS de animação para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Aliases para tipos específicos de notificação
function showSuccess(message, duration) {
    showNotification(message, 'success', duration);
}

function showError(message, duration) {
    showNotification(message, 'error', duration);
}

function showInfo(message, duration) {
    showNotification(message, 'info', duration);
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Função para confirmar ações
function confirmAction(message) {
    return confirm(message);
}

// Função para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Função para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Gerenciamento de modais
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Fechar modal clicando no X ou fora do modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            this.activeModal = modal;
            document.body.style.overflow = 'hidden'; // Impede scroll do body
        }
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.style.display = 'none';
            this.activeModal = null;
            document.body.style.overflow = ''; // Restaura scroll do body
        }
    }
}

// Instância global do gerenciador de modais
const modalManager = new ModalManager();

// Classe para gerenciar tabelas
class TableManager {
    constructor(tableBodyId) {
        this.tableBody = document.getElementById(tableBodyId);
    }

    clear() {
        if (this.tableBody) {
            this.tableBody.innerHTML = '';
        }
    }

    addRow(rowData) {
        if (!this.tableBody) return;
        
        const row = document.createElement('tr');
        row.innerHTML = rowData;
        this.tableBody.appendChild(row);
    }

    addRows(rowsData) {
        rowsData.forEach(rowData => this.addRow(rowData));
    }

    setEmptyMessage(message = 'Nenhum dado encontrado') {
        if (!this.tableBody) return;
        
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 100; // Ocupar todas as colunas
        cell.style.textAlign = 'center';
        cell.style.padding = '2rem';
        cell.style.color = '#666';
        cell.textContent = message;
        row.appendChild(cell);
        this.tableBody.appendChild(row);
    }
}

// Função para filtrar tabelas
function filterTable(tableBodyId, searchValue, filterColumn = null) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    const searchLower = searchValue.toLowerCase();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let shouldShow = false;

        if (filterColumn !== null) {
            // Filtrar por coluna específica
            const cell = cells[filterColumn];
            if (cell && cell.textContent.toLowerCase().includes(searchLower)) {
                shouldShow = true;
            }
        } else {
            // Filtrar por qualquer coluna
            for (let cell of cells) {
                if (cell.textContent.toLowerCase().includes(searchLower)) {
                    shouldShow = true;
                    break;
                }
            }
        }

        row.style.display = shouldShow ? '' : 'none';
    });
}

// Função para validar formulários
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#ddd';
        }
    });

    return isValid;
}

// Função para limpar formulário
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        
        // Limpar estilos de validação
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.style.borderColor = '#ddd';
        });
    }
}

// Função para preencher select com dados
function populateSelect(selectId, data, valueField = 'id', textField = 'name') {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Limpar opções existentes (exceto a primeira que geralmente é placeholder)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        select.appendChild(option);
    });
}

// Função para inicializar tooltips (se necessário)
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 0.5rem;
        border-radius: 3px;
        font-size: 0.8rem;
        z-index: 1000;
        pointer-events: none;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
    
    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target._tooltip) {
        document.body.removeChild(e.target._tooltip);
        delete e.target._tooltip;
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar navegação ativa
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Inicializar tooltips
    initializeTooltips();

    console.log('Sistema de Logística de Estoque carregado');
});