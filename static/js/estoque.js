// Estoque JavaScript
class EstoqueManager {
    constructor() {
        this.produtos = [];
        this.selectedProduto = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadEstoque();
        this.setupFilters();
    }

    setupEventListeners() {
        // Botões de entrada e saída
        const btnEntrada = document.getElementById('btn-entrada');
        const btnSaida = document.getElementById('btn-saida');

        if (btnEntrada) {
            btnEntrada.addEventListener('click', () => this.openMovimentacaoModal('entrada'));
        }

        if (btnSaida) {
            btnSaida.addEventListener('click', () => this.openMovimentacaoModal('saida'));
        }

        // Botões NFC
        const btnMovimentarNFC = document.getElementById('btn-movimentar-nfc');
        if (btnMovimentarNFC) {
            btnMovimentarNFC.addEventListener('click', () => {
                if (window.nfcManager) {
                    window.nfcManager.movimentarEstoqueNFC();
                } else {
                    showError('Sistema NFC não disponível');
                }
            });
        }

        const btnBuscarEstoqueNFC = document.getElementById('btn-buscar-estoque-nfc');
        if (btnBuscarEstoqueNFC) {
            btnBuscarEstoqueNFC.addEventListener('click', () => {
                if (window.nfcManager) {
                    window.nfcManager.buscarProdutoNFC();
                } else {
                    showError('Sistema NFC não disponível');
                }
            });
        }

        // Cancelar movimentação
        const btnCancelMov = document.getElementById('btn-cancel-mov');
        if (btnCancelMov) {
            btnCancelMov.addEventListener('click', () => modalManager.closeModal());
        }

        // Formulário de movimentação
        const movimentacaoForm = document.getElementById('movimentacao-form');
        if (movimentacaoForm) {
            movimentacaoForm.addEventListener('submit', (e) => this.handleMovimentacaoSubmit(e));
        }

        // Select de produto
        const selectProduto = document.getElementById('select-produto');
        if (selectProduto) {
            selectProduto.addEventListener('change', (e) => this.onProdutoSelect(e));
        }

        // Tipo de movimento
        const tipoMovimento = document.getElementById('tipo-movimento');
        if (tipoMovimento) {
            tipoMovimento.addEventListener('change', (e) => this.onTipoMovimentoChange(e));
        }

        // Filtros
        const searchInput = document.getElementById('search-estoque');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterEstoque(), 300));
        }

        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterEstoque());
        }
    }

    async loadEstoque() {
        try {
            this.produtos = await api.get('/produtos');
            this.renderEstoque();
            this.populateProdutoSelect();
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            showError('Erro ao carregar dados do estoque');
        }
    }

    renderEstoque(produtosToRender = this.produtos) {
        const tableBody = document.getElementById('estoque-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (produtosToRender.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhum produto encontrado
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        produtosToRender.forEach(produto => {
            const row = document.createElement('tr');
            
            // Determinar status do estoque
            const { statusClass, statusText } = this.getStatusEstoque(produto);

            row.innerHTML = `
                <td>${escapeHtml(produto.nome)}</td>
                <td>${escapeHtml(produto.categoria || 'N/A')}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${produto.quantidade || 0}
                    </span>
                </td>
                <td>${produto.estoque_minimo || 0}</td>
                <td>${produto.estoque_maximo || 0}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" onclick="estoqueManager.openMovimentacaoModalForProduto(${produto.id})" 
                            data-tooltip="Movimentar estoque">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="action-btn view" onclick="estoqueManager.viewHistorico(${produto.id})" 
                            data-tooltip="Ver histórico">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    getStatusEstoque(produto) {
        const quantidade = produto.quantidade || 0;
        const minimo = produto.estoque_minimo || 0;

        if (quantidade === 0) {
            return { statusClass: 'status-critico', statusText: 'Crítico' };
        } else if (quantidade <= minimo) {
            return { statusClass: 'status-baixo', statusText: 'Baixo' };
        } else {
            return { statusClass: 'status-normal', statusText: 'Normal' };
        }
    }

    populateProdutoSelect() {
        const select = document.getElementById('select-produto');
        if (!select) return;

        // Limpar opções existentes (exceto a primeira)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        this.produtos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = produto.nome;
            select.appendChild(option);
        });
    }

    filterEstoque() {
        const searchValue = document.getElementById('search-estoque')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';

        let filteredProdutos = this.produtos;

        // Filtrar por texto de pesquisa
        if (searchValue) {
            filteredProdutos = filteredProdutos.filter(produto => 
                produto.nome.toLowerCase().includes(searchValue) ||
                produto.categoria?.toLowerCase().includes(searchValue)
            );
        }

        // Filtrar por status
        if (statusFilter) {
            filteredProdutos = filteredProdutos.filter(produto => {
                const { statusClass } = this.getStatusEstoque(produto);
                return statusClass.includes(statusFilter);
            });
        }

        this.renderEstoque(filteredProdutos);
    }

    openMovimentacaoModal(tipo = null) {
        clearForm('movimentacao-form');
        document.getElementById('product-info').style.display = 'none';
        
        if (tipo) {
            document.getElementById('tipo-movimento').value = tipo;
            document.getElementById('movimentacao-title').textContent = 
                tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque';
        } else {
            document.getElementById('movimentacao-title').textContent = 'Movimentação de Estoque';
        }

        modalManager.openModal('movimentacao-modal');
    }

    openMovimentacaoModalForProduto(produtoId) {
        this.openMovimentacaoModal();
        document.getElementById('select-produto').value = produtoId;
        this.onProdutoSelect({ target: { value: produtoId } });
    }

    onProdutoSelect(e) {
        const produtoId = parseInt(e.target.value);
        const produto = this.produtos.find(p => p.id === produtoId);

        if (produto) {
            this.selectedProduto = produto;
            this.showProductInfo(produto);
        } else {
            this.selectedProduto = null;
            document.getElementById('product-info').style.display = 'none';
        }
    }

    showProductInfo(produto) {
        const productInfoDiv = document.getElementById('product-info');
        if (!productInfoDiv) return;

        document.getElementById('info-nome').textContent = produto.nome;
        document.getElementById('info-categoria').textContent = produto.categoria || 'N/A';
        document.getElementById('info-estoque').textContent = produto.quantidade || 0;
        document.getElementById('info-minimo').textContent = produto.estoque_minimo || 0;

        productInfoDiv.style.display = 'block';
    }

    onTipoMovimentoChange(e) {
        const tipo = e.target.value;
        const quantidadeInput = document.getElementById('quantidade-movimento');
        
        if (tipo === 'saida' && this.selectedProduto) {
            quantidadeInput.max = this.selectedProduto.quantidade || 0;
            quantidadeInput.placeholder = `Máximo: ${this.selectedProduto.quantidade || 0}`;
        } else {
            quantidadeInput.removeAttribute('max');
            quantidadeInput.placeholder = '';
        }
    }

    async handleMovimentacaoSubmit(e) {
        e.preventDefault();

        const produtoId = document.getElementById('select-produto').value;
        const tipo = document.getElementById('tipo-movimento').value;
        const quantidade = parseInt(document.getElementById('quantidade-movimento').value);
        const descricao = document.getElementById('descricao-movimento').value;

        if (!produtoId || !tipo || !quantidade) {
            showError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Validar quantidade para saída
        if (tipo === 'saida' && this.selectedProduto && quantidade > this.selectedProduto.quantidade) {
            showError('Quantidade de saída maior que o estoque disponível');
            return;
        }

        try {
            const endpoint = `/estoque/${produtoId}/${tipo}`;
            await api.post(endpoint, { quantidade, descricao });
            
            showSuccess(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
            modalManager.closeModal();
            await this.loadEstoque();
        } catch (error) {
            console.error('Erro ao registrar movimentação:', error);
            showError(error.error || 'Erro ao registrar movimentação');
        }
    }

    async viewHistorico(produtoId) {
        const produto = this.produtos.find(p => p.id === produtoId);
        if (!produto) {
            showError('Produto não encontrado');
            return;
        }

        try {
            const movimentacoes = await api.get(`/movimentacoes/${produtoId}`);
            
            document.getElementById('historico-title').textContent = 
                `Histórico de Movimentações - ${produto.nome}`;
            
            const tableBody = document.getElementById('historico-table-body');
            tableBody.innerHTML = '';

            if (movimentacoes.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #666;">
                        Nenhuma movimentação encontrada
                    </td>
                `;
                tableBody.appendChild(row);
            } else {
                movimentacoes.forEach(mov => {
                    const row = document.createElement('tr');
                    const tipoIcon = mov.tipo === 'ENTRADA' ? 
                        '<i class="fas fa-arrow-up" style="color: #28a745;"></i>' : 
                        '<i class="fas fa-arrow-down" style="color: #dc3545;"></i>';
                    
                    row.innerHTML = `
                        <td>${formatDate(mov.data_movimento)}</td>
                        <td>${tipoIcon} ${mov.tipo}</td>
                        <td>${mov.quantidade}</td>
                        <td>${escapeHtml(mov.descricao || 'N/A')}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            modalManager.openModal('historico-modal');
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            showError('Erro ao carregar histórico de movimentações');
        }
    }
}

// Instância global para acesso via onclick
let estoqueManager;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/estoque') {
        estoqueManager = new EstoqueManager();
    }
});