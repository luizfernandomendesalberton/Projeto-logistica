// Produtos JavaScript
class ProdutosManager {
    constructor() {
        this.produtos = [];
        this.currentProduto = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProdutos();
        this.setupFilters();
    }

    setupEventListeners() {
        // Botão para adicionar novo produto
        const btnAddProduto = document.getElementById('btn-add-produto');
        if (btnAddProduto) {
            btnAddProduto.addEventListener('click', () => this.openAddModal());
        }

        // Botões NFC
        const btnCadastrarNFC = document.getElementById('btn-cadastrar-nfc');
        if (btnCadastrarNFC) {
            btnCadastrarNFC.addEventListener('click', () => {
                if (window.nfcManager) {
                    window.nfcManager.cadastrarProdutoNFC();
                } else {
                    showError('Sistema NFC não disponível');
                }
            });
        }

        const btnBuscarNFC = document.getElementById('btn-buscar-nfc');
        if (btnBuscarNFC) {
            btnBuscarNFC.addEventListener('click', () => {
                if (window.nfcManager) {
                    window.nfcManager.buscarProdutoNFC();
                } else {
                    showError('Sistema NFC não disponível');
                }
            });
        }

        // Botão cancelar no modal
        const btnCancel = document.getElementById('btn-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => modalManager.closeModal());
        }

        // Formulário de produto
        const produtoForm = document.getElementById('produto-form');
        if (produtoForm) {
            produtoForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Filtros de pesquisa
        const searchInput = document.getElementById('search-produto');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterProdutos(), 300));
        }

        const filterCategoria = document.getElementById('filter-categoria');
        if (filterCategoria) {
            filterCategoria.addEventListener('change', () => this.filterProdutos());
        }
    }

    async loadProdutos() {
        try {
            this.produtos = await api.get('/produtos');
            this.renderProdutos();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showError('Erro ao carregar lista de produtos');
        }
    }

    renderProdutos(produtosToRender = this.produtos) {
        const tableBody = document.getElementById('produtos-table-body');
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
            let statusClass = 'status-normal';
            let statusText = 'Normal';
            
            if (produto.quantidade === 0) {
                statusClass = 'status-critico';
                statusText = 'Sem Estoque';
            } else if (produto.quantidade <= produto.estoque_minimo) {
                statusClass = 'status-baixo';
                statusText = 'Estoque Baixo';
            }

            row.innerHTML = `
                <td>${produto.id}</td>
                <td>${escapeHtml(produto.nome)}</td>
                <td>${escapeHtml(produto.categoria || 'N/A')}</td>
                <td>${formatCurrency(produto.preco || 0)}</td>
                <td>${escapeHtml(produto.codigo_barras || 'N/A')}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${produto.quantidade || 0} un.
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" onclick="produtosManager.editProduto(${produto.id})" 
                            data-tooltip="Editar produto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="produtosManager.deleteProduto(${produto.id})" 
                            data-tooltip="Excluir produto">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    setupFilters() {
        // Filtro será aplicado através dos event listeners já configurados
    }

    filterProdutos() {
        const searchValue = document.getElementById('search-produto')?.value.toLowerCase() || '';
        const categoriaFilter = document.getElementById('filter-categoria')?.value || '';

        let filteredProdutos = this.produtos;

        // Filtrar por texto de pesquisa
        if (searchValue) {
            filteredProdutos = filteredProdutos.filter(produto => 
                produto.nome.toLowerCase().includes(searchValue) ||
                produto.categoria?.toLowerCase().includes(searchValue) ||
                produto.codigo_barras?.toLowerCase().includes(searchValue)
            );
        }

        // Filtrar por categoria
        if (categoriaFilter) {
            filteredProdutos = filteredProdutos.filter(produto => 
                produto.categoria === categoriaFilter
            );
        }

        this.renderProdutos(filteredProdutos);
    }

    openAddModal() {
        this.currentProduto = null;
        clearForm('produto-form');
        document.getElementById('modal-title').textContent = 'Novo Produto';
        modalManager.openModal('produto-modal');
    }

    async editProduto(produtoId) {
        const produto = this.produtos.find(p => p.id === produtoId);
        if (!produto) {
            showError('Produto não encontrado');
            return;
        }

        this.currentProduto = produto;
        
        // Preencher formulário
        document.getElementById('nome').value = produto.nome || '';
        document.getElementById('descricao').value = produto.descricao || '';
        document.getElementById('categoria').value = produto.categoria || '';
        document.getElementById('preco').value = produto.preco || '';
        document.getElementById('codigo_barras').value = produto.codigo_barras || '';
        document.getElementById('quantidade').value = produto.quantidade || '';
        document.getElementById('estoque_minimo').value = produto.estoque_minimo || '';
        document.getElementById('estoque_maximo').value = produto.estoque_maximo || '';

        document.getElementById('modal-title').textContent = 'Editar Produto';
        modalManager.openModal('produto-modal');
    }

    async deleteProduto(produtoId) {
        const produto = this.produtos.find(p => p.id === produtoId);
        if (!produto) {
            showError('Produto não encontrado');
            return;
        }

        if (!confirmAction(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
            return;
        }

        try {
            await api.delete(`/produtos/${produtoId}`);
            showSuccess('Produto excluído com sucesso!');
            await this.loadProdutos();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            showError('Erro ao excluir produto');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!validateForm('produto-form')) {
            showError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const formData = new FormData(e.target);
        const produtoData = {};

        // Converter FormData para objeto
        for (let [key, value] of formData.entries()) {
            if (key === 'preco' || key === 'quantidade' || key === 'estoque_minimo' || key === 'estoque_maximo') {
                produtoData[key] = parseFloat(value) || 0;
            } else {
                produtoData[key] = value;
            }
        }

        try {
            if (this.currentProduto) {
                // Editando produto existente
                await api.put(`/produtos/${this.currentProduto.id}`, produtoData);
                showSuccess('Produto atualizado com sucesso!');
            } else {
                // Criando novo produto
                await api.post('/produtos', produtoData);
                showSuccess('Produto criado com sucesso!');
            }

            modalManager.closeModal();
            await this.loadProdutos();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            showError('Erro ao salvar produto');
        }
    }
}

// Instância global para acesso via onclick
let produtosManager;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/produtos') {
        produtosManager = new ProdutosManager();
    }
});