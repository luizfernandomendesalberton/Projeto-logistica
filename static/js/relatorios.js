// Relatórios JavaScript
class RelatoriosManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadRelatorios();
        this.setupCharts();
    }

    setupEventListeners() {
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportData());
        }
    }

    async loadRelatorios() {
        try {
            // Carregar dados dos relatórios
            const [produtos, estoqueBaixo, movimentacoes] = await Promise.all([
                api.get('/produtos'),
                api.get('/relatorio/estoque-baixo'),
                api.get('/relatorio/movimentacoes')
            ]);

            // Atualizar cards de resumo
            this.updateResumoCards(produtos, estoqueBaixo, movimentacoes);
            
            // Atualizar tabelas
            this.updateEstoqueBaixoTable(estoqueBaixo);
            this.updateMovimentacoesTable(movimentacoes);

            // Atualizar gráficos
            this.updateCharts(produtos, movimentacoes);

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            showError('Erro ao carregar dados dos relatórios');
        }
    }

    updateResumoCards(produtos, estoqueBaixo, movimentacoes) {
        // Produtos com estoque baixo
        document.getElementById('produtos-baixo').textContent = estoqueBaixo.length;

        // Movimentações do mês
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const movimentacoesMes = movimentacoes.filter(mov => 
            new Date(mov.data_movimento) >= inicioMes
        );
        document.getElementById('movimentacoes-mes').textContent = movimentacoesMes.length;

        // Valor total em estoque
        const valorTotal = produtos.reduce((total, produto) => {
            return total + ((produto.preco || 0) * (produto.quantidade || 0));
        }, 0);
        document.getElementById('valor-estoque').textContent = formatCurrency(valorTotal);
    }

    updateEstoqueBaixoTable(estoqueBaixo) {
        const tableBody = document.getElementById('estoque-baixo-table');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (estoqueBaixo.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-check-circle" style="color: #28a745; margin-right: 0.5rem;"></i>
                    Todos os produtos estão com estoque adequado
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        estoqueBaixo.forEach(produto => {
            const row = document.createElement('tr');
            
            let statusClass, statusText;
            if (produto.quantidade === 0) {
                statusClass = 'status-critico';
                statusText = 'SEM ESTOQUE';
            } else {
                const percentual = (produto.quantidade / produto.estoque_minimo) * 100;
                if (percentual <= 50) {
                    statusClass = 'status-critico';
                    statusText = 'CRÍTICO';
                } else {
                    statusClass = 'status-baixo';
                    statusText = 'BAIXO';
                }
            }

            row.innerHTML = `
                <td>${escapeHtml(produto.nome)}</td>
                <td>${escapeHtml(produto.categoria)}</td>
                <td>${produto.quantidade}</td>
                <td>${produto.estoque_minimo}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateMovimentacoesTable(movimentacoes) {
        const tableBody = document.getElementById('movimentacoes-recentes-table');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        const movimentacoesRecentes = movimentacoes.slice(0, 20); // Últimas 20

        if (movimentacoesRecentes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhuma movimentação encontrada
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        movimentacoesRecentes.forEach(mov => {
            const row = document.createElement('tr');
            const tipoIcon = mov.tipo === 'ENTRADA' ? 
                '<i class="fas fa-arrow-up" style="color: #28a745;"></i>' : 
                '<i class="fas fa-arrow-down" style="color: #dc3545;"></i>';
            
            row.innerHTML = `
                <td>${formatDate(mov.data_movimento)}</td>
                <td>${escapeHtml(mov.produto_nome)}</td>
                <td>${tipoIcon} ${mov.tipo}</td>
                <td>${mov.quantidade}</td>
                <td>${escapeHtml(mov.descricao || 'N/A')}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    setupCharts() {
        // Configurações padrão para os gráficos
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = '#333';
    }

    updateCharts(produtos, movimentacoes) {
        this.updateCategoriesChart(produtos);
        this.updateMovimentsChart(movimentacoes);
    }

    updateCategoriesChart(produtos) {
        const ctx = document.getElementById('categoriesChart');
        if (!ctx) return;

        // Agrupar produtos por categoria
        const categorias = {};
        produtos.forEach(produto => {
            const categoria = produto.categoria || 'Sem categoria';
            categorias[categoria] = (categorias[categoria] || 0) + 1;
        });

        const labels = Object.keys(categorias);
        const data = Object.values(categorias);
        const cores = this.generateColors(labels.length);

        // Destruir gráfico anterior se existir
        if (this.charts.categories) {
            this.charts.categories.destroy();
        }

        this.charts.categories = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateMovimentsChart(movimentacoes) {
        const ctx = document.getElementById('movimentsChart');
        if (!ctx) return;

        // Obter dados dos últimos 7 dias
        const hoje = new Date();
        const ultimosSeteDias = [];
        
        for (let i = 6; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            ultimosSeteDias.push(data);
        }

        const labels = ultimosSeteDias.map(data => 
            data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
        );

        const entradas = ultimosSeteDias.map(data => {
            const dataStr = data.toISOString().split('T')[0];
            return movimentacoes.filter(mov => 
                mov.tipo === 'ENTRADA' && 
                mov.data_movimento.split('T')[0] === dataStr
            ).length;
        });

        const saidas = ultimosSeteDias.map(data => {
            const dataStr = data.toISOString().split('T')[0];
            return movimentacoes.filter(mov => 
                mov.tipo === 'SAIDA' && 
                mov.data_movimento.split('T')[0] === dataStr
            ).length;
        });

        // Destruir gráfico anterior se existir
        if (this.charts.movements) {
            this.charts.movements.destroy();
        }

        this.charts.movements = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Entradas',
                        data: entradas,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Saídas',
                        data: saidas,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateColors(count) {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    async exportData() {
        try {
            showInfo('Preparando dados para exportação...');
            
            const [produtos, movimentacoes, estoqueBaixo] = await Promise.all([
                api.get('/produtos'),
                api.get('/relatorio/movimentacoes'),
                api.get('/relatorio/estoque-baixo')
            ]);

            // Criar dados CSV
            const csvData = this.generateCSV({
                produtos,
                movimentacoes,
                estoqueBaixo
            });

            // Download do arquivo
            this.downloadCSV(csvData, 'relatorio_estoque.csv');
            showSuccess('Relatório exportado com sucesso!');

        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            showError('Erro ao exportar dados');
        }
    }

    generateCSV(data) {
        let csv = '';
        
        // Seção de Produtos
        csv += 'PRODUTOS\n';
        csv += 'ID,Nome,Categoria,Preço,Código de Barras,Quantidade,Estoque Mínimo,Estoque Máximo\n';
        data.produtos.forEach(produto => {
            csv += `${produto.id},"${produto.nome}","${produto.categoria || ''}",${produto.preco || 0},"${produto.codigo_barras || ''}",${produto.quantidade || 0},${produto.estoque_minimo || 0},${produto.estoque_maximo || 0}\n`;
        });

        csv += '\n\nMOVIMENTAÇÕES\n';
        csv += 'Data/Hora,Produto,Tipo,Quantidade,Descrição\n';
        data.movimentacoes.forEach(mov => {
            csv += `"${formatDate(mov.data_movimento)}","${mov.produto_nome}","${mov.tipo}",${mov.quantidade},"${mov.descricao || ''}"\n`;
        });

        csv += '\n\nPRODUTOS COM ESTOQUE BAIXO\n';
        csv += 'Produto,Categoria,Quantidade Atual,Estoque Mínimo\n';
        data.estoqueBaixo.forEach(produto => {
            csv += `"${produto.nome}","${produto.categoria}",${produto.quantidade},${produto.estoque_minimo}\n`;
        });

        return csv;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/relatorios') {
        const relatoriosManager = new RelatoriosManager();
    }
});