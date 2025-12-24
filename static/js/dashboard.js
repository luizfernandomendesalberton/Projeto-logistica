// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        await this.loadRecentActivities();
        await this.loadAlerts();
        this.setupAutoRefresh();
    }

    async loadDashboardData() {
        try {
            const produtos = await api.get('/produtos');
            const estoqueBaixo = await api.get('/relatorio/estoque-baixo');
            
            // Calcular estatísticas
            const totalProdutos = produtos.length;
            const itensEstoque = produtos.reduce((total, produto) => total + (produto.quantidade || 0), 0);
            const produtosEstoqueBaixo = estoqueBaixo.length;
            
            // Atualizar cards do dashboard
            this.updateDashboardCard('total-produtos', totalProdutos);
            this.updateDashboardCard('itens-estoque', itensEstoque);
            this.updateDashboardCard('estoque-baixo', produtosEstoqueBaixo);

            // Carregar movimentações de hoje
            const today = new Date().toISOString().split('T')[0];
            const movimentacoesRecentes = await api.get('/relatorio/movimentacoes');
            const movimentacoesHoje = movimentacoesRecentes.filter(mov => {
                const movDate = new Date(mov.data_movimento).toISOString().split('T')[0];
                return movDate === today;
            }).length;
            
            this.updateDashboardCard('movimentacoes-hoje', movimentacoesHoje);

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            showError('Erro ao carregar dados do dashboard');
        }
    }

    updateDashboardCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value.toLocaleString('pt-BR');
        }
    }

    async loadRecentActivities() {
        try {
            const movimentacoes = await api.get('/relatorio/movimentacoes');
            const recentActivities = movimentacoes.slice(0, 10); // Últimas 10 movimentações

            const tableBody = document.getElementById('recent-activities-body');
            if (!tableBody) return;

            tableBody.innerHTML = '';

            if (recentActivities.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                        Nenhuma atividade recente encontrada
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            recentActivities.forEach(atividade => {
                const row = document.createElement('tr');
                const tipoIcon = atividade.tipo === 'ENTRADA' ? 
                    '<i class="fas fa-arrow-up" style="color: #28a745;"></i>' : 
                    '<i class="fas fa-arrow-down" style="color: #dc3545;"></i>';
                
                row.innerHTML = `
                    <td>${formatDate(atividade.data_movimento)}</td>
                    <td>${escapeHtml(atividade.produto_nome || 'N/A')}</td>
                    <td>${tipoIcon} ${atividade.tipo}</td>
                    <td>${atividade.quantidade}</td>
                    <td>${escapeHtml(atividade.descricao || 'N/A')}</td>
                `;
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Erro ao carregar atividades recentes:', error);
        }
    }

    async loadAlerts() {
        try {
            const estoqueBaixo = await api.get('/relatorio/estoque-baixo');
            const alertsContainer = document.getElementById('alerts-container');
            
            if (!alertsContainer) return;

            alertsContainer.innerHTML = '';

            if (estoqueBaixo.length === 0) {
                const noAlert = document.createElement('div');
                noAlert.className = 'alert';
                noAlert.style.borderLeftColor = '#28a745';
                noAlert.style.backgroundColor = '#d4edda';
                noAlert.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #28a745; margin-right: 0.5rem;"></i>
                    Todos os produtos estão com estoque adequado
                `;
                alertsContainer.appendChild(noAlert);
                return;
            }

            // Agrupar alertas por criticidade
            estoqueBaixo.forEach(produto => {
                const percentual = (produto.quantidade / produto.estoque_minimo) * 100;
                const isCritico = produto.quantidade === 0;
                const isBaixo = percentual <= 50;

                const alert = document.createElement('div');
                alert.className = isCritico ? 'alert danger' : 'alert';
                
                const icon = isCritico ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';
                const message = isCritico ? 
                    `Produto "${produto.nome}" está em FALTA no estoque!` :
                    `Produto "${produto.nome}" está com estoque baixo (${produto.quantidade} unidades)`;

                alert.innerHTML = `
                    <i class="${icon}" style="margin-right: 0.5rem;"></i>
                    ${message}
                `;
                
                alertsContainer.appendChild(alert);
            });

        } catch (error) {
            console.error('Erro ao carregar alertas:', error);
        }
    }

    setupAutoRefresh() {
        // Atualizar dados a cada 5 minutos
        setInterval(() => {
            this.loadDashboardData();
            this.loadRecentActivities();
            this.loadAlerts();
        }, 5 * 60 * 1000);
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const dashboard = new Dashboard();
    }
});