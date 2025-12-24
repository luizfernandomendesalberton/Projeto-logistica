// Sistema NFC para Logística de Estoque
// Funcionalidades para cadastro e movimentação de produtos via NFC

class NFCManager {
    constructor() {
        this.isSupported = "NDEFReader" in window;
        this.currentReader = null;
    }

    // Verificar suporte ao NFC
    checkSupport() {
        if (!this.isSupported) {
            showError("NFC não é suportado neste navegador.");
            return false;
        }
        return true;
    }

    // Mostrar status de leitura
    showReadingStatus(message = "Aguardando leitura da tag NFC...") {
        let resposta = document.getElementById("nfc-status");
        if (!resposta) {
            resposta = document.createElement("div");
            resposta.id = "nfc-status";
            resposta.className = "nfc-status-message";
            resposta.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 5000;
                text-align: center;
                font-size: 1.1rem;
                min-width: 300px;
            `;
            document.body.appendChild(resposta);
        }
        resposta.style.display = "block";
        resposta.innerHTML = `
            <i class="fas fa-wifi" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
            <strong>${message}</strong>
            <br><br>
            <button onclick="nfcManager.cancelReading()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 5px;
                cursor: pointer;
            ">Cancelar</button>
        `;
    }

    hideReadingStatus() {
        const resposta = document.getElementById("nfc-status");
        if (resposta) {
            resposta.style.display = "none";
        }
    }

    // Cancelar leitura NFC
    cancelReading() {
        this.hideReadingStatus();
        if (this.currentReader) {
            this.currentReader = null;
        }
    }

    // Cadastrar produto via NFC
    async cadastrarProdutoNFC() {
        if (!this.checkSupport()) return;

        try {
            const ndef = new NDEFReader();
            this.currentReader = ndef;
            await ndef.scan();

            this.showReadingStatus("Aproxime a tag NFC para cadastrar produto...");

            ndef.onreading = async (event) => {
                this.hideReadingStatus();
                const decoder = new TextDecoder();
                
                for (const record of event.message.records) {
                    const rawData = decoder.decode(record.data);
                    console.log("Dados NFC recebidos:", rawData);
                    
                    try {
                        const dados = JSON.parse(rawData);
                        
                        // Validar se tem dados mínimos necessários
                        if (!dados.nome && !dados.codigo_barras) {
                            showError("A tag NFC deve conter pelo menos o nome ou código de barras do produto.");
                            return;
                        }

                        // Preencher automaticamente o formulário de produto
                        this.preencherFormularioProduto(dados);
                        
                        // Opcionalmente cadastrar automaticamente
                        if (dados.auto_cadastro === true) {
                            await this.cadastrarProdutoAutomatico(dados);
                        } else {
                            showSuccess("Dados do produto carregados via NFC. Revise e confirme o cadastro.");
                            modalManager.openModal('produto-modal');
                        }
                        
                    } catch (erro) {
                        console.error("Erro ao interpretar dados NFC:", erro);
                        showError("Erro ao interpretar os dados da tag NFC. Verifique se o formato está correto.");
                    }
                }
            };

            ndef.onerror = (error) => {
                this.hideReadingStatus();
                showError("Erro ao ler a tag NFC: " + error.message);
            };

        } catch (erro) {
            this.hideReadingStatus();
            console.error("Erro ao iniciar leitura NFC:", erro);
            showError("Erro ao tentar usar NFC: " + erro.message);
        }
    }

    // Preencher formulário de produto com dados NFC
    preencherFormularioProduto(dados) {
        const campos = {
            'nome': dados.nome || '',
            'descricao': dados.descricao || '',
            'categoria': dados.categoria || '',
            'preco': dados.preco || '',
            'codigo_barras': dados.codigo_barras || dados.barcode || '',
            'quantidade': dados.quantidade || dados.estoque_inicial || '',
            'estoque_minimo': dados.estoque_minimo || '10',
            'estoque_maximo': dados.estoque_maximo || '100'
        };

        for (const [campo, valor] of Object.entries(campos)) {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = valor;
            }
        }

        // Definir título do modal
        const titulo = document.getElementById('modal-title');
        if (titulo) {
            titulo.textContent = 'Cadastro via NFC - ' + (dados.nome || 'Novo Produto');
        }
    }

    // Cadastrar produto automaticamente
    async cadastrarProdutoAutomatico(dados) {
        try {
            const produtoData = {
                nome: dados.nome || 'Produto NFC',
                descricao: dados.descricao || '',
                categoria: dados.categoria || 'Outros',
                preco: parseFloat(dados.preco) || 0,
                codigo_barras: dados.codigo_barras || dados.barcode || '',
                quantidade: parseInt(dados.quantidade) || 0,
                estoque_minimo: parseInt(dados.estoque_minimo) || 10,
                estoque_maximo: parseInt(dados.estoque_maximo) || 100
            };

            const response = await api.post('/produtos', produtoData);
            if (response.success) {
                showSuccess('Produto cadastrado automaticamente via NFC!');
                if (typeof produtosManager !== 'undefined') {
                    await produtosManager.loadProdutos();
                }
            }
        } catch (erro) {
            showError('Erro ao cadastrar produto automaticamente: ' + erro.message);
        }
    }

    // Movimentar estoque via NFC
    async movimentarEstoqueNFC() {
        if (!this.checkSupport()) return;

        try {
            const ndef = new NDEFReader();
            this.currentReader = ndef;
            await ndef.scan();

            this.showReadingStatus("Aproxime a tag NFC para movimentar estoque...");

            ndef.onreading = async (event) => {
                this.hideReadingStatus();
                const decoder = new TextDecoder();
                
                for (const record of event.message.records) {
                    const rawData = decoder.decode(record.data);
                    console.log("Dados NFC para movimentação:", rawData);
                    
                    try {
                        const dados = JSON.parse(rawData);
                        
                        // Validar dados mínimos para movimentação
                        if (!dados.produto_id && !dados.codigo_barras) {
                            showError("A tag NFC deve conter o ID do produto ou código de barras.");
                            return;
                        }

                        if (!dados.tipo || !dados.quantidade) {
                            showError("A tag NFC deve conter o tipo de movimentação e quantidade.");
                            return;
                        }

                        // Buscar produto por ID ou código de barras
                        const produto = await this.buscarProduto(dados);
                        if (!produto) {
                            showError("Produto não encontrado no sistema.");
                            return;
                        }

                        // Executar movimentação automaticamente ou preencher formulário
                        if (dados.auto_movimentacao === true) {
                            await this.executarMovimentacaoAutomatica(produto, dados);
                        } else {
                            this.preencherFormularioMovimentacao(produto, dados);
                            modalManager.openModal('movimentacao-modal');
                        }
                        
                    } catch (erro) {
                        console.error("Erro ao interpretar dados NFC:", erro);
                        showError("Erro ao interpretar os dados da tag NFC.");
                    }
                }
            };

            ndef.onerror = (error) => {
                this.hideReadingStatus();
                showError("Erro ao ler a tag NFC: " + error.message);
            };

        } catch (erro) {
            this.hideReadingStatus();
            console.error("Erro ao iniciar leitura NFC:", erro);
            showError("Erro ao tentar usar NFC para movimentação.");
        }
    }

    // Buscar produto por ID ou código de barras
    async buscarProduto(dados) {
        try {
            const produtos = await api.get('/produtos');
            
            // Buscar por ID
            if (dados.produto_id) {
                return produtos.find(p => p.id === parseInt(dados.produto_id));
            }
            
            // Buscar por código de barras
            if (dados.codigo_barras) {
                return produtos.find(p => p.codigo_barras === dados.codigo_barras);
            }
            
            // Buscar por nome (fallback)
            if (dados.nome) {
                return produtos.find(p => p.nome.toLowerCase().includes(dados.nome.toLowerCase()));
            }
            
            return null;
        } catch (erro) {
            console.error("Erro ao buscar produto:", erro);
            return null;
        }
    }

    // Preencher formulário de movimentação
    preencherFormularioMovimentacao(produto, dados) {
        // Preencher select do produto
        const selectProduto = document.getElementById('select-produto');
        if (selectProduto) {
            selectProduto.value = produto.id;
            // Trigger change event para mostrar informações do produto
            selectProduto.dispatchEvent(new Event('change'));
        }

        // Preencher tipo de movimento
        const tipoMovimento = document.getElementById('tipo-movimento');
        if (tipoMovimento) {
            tipoMovimento.value = dados.tipo.toLowerCase();
        }

        // Preencher quantidade
        const quantidade = document.getElementById('quantidade-movimento');
        if (quantidade) {
            quantidade.value = dados.quantidade;
        }

        // Preencher descrição
        const descricao = document.getElementById('descricao-movimento');
        if (descricao) {
            descricao.value = dados.descricao || `Movimentação via NFC - ${dados.tipo}`;
        }

        // Atualizar título do modal
        const titulo = document.getElementById('movimentacao-title');
        if (titulo) {
            titulo.textContent = `Movimentação NFC - ${produto.nome}`;
        }
    }

    // Executar movimentação automaticamente
    async executarMovimentacaoAutomatica(produto, dados) {
        try {
            const endpoint = `/estoque/${produto.id}/${dados.tipo.toLowerCase()}`;
            const movimentacaoData = {
                quantidade: parseInt(dados.quantidade),
                descricao: dados.descricao || `Movimentação automática via NFC - ${dados.tipo}`
            };

            // Validar se é saída e se há estoque suficiente
            if (dados.tipo.toLowerCase() === 'saida' && produto.quantidade < parseInt(dados.quantidade)) {
                showError(`Estoque insuficiente. Disponível: ${produto.quantidade}, Solicitado: ${dados.quantidade}`);
                return;
            }

            const response = await api.post(endpoint, movimentacaoData);
            if (response.success) {
                const tipoText = dados.tipo.toLowerCase() === 'entrada' ? 'Entrada' : 'Saída';
                showSuccess(`${tipoText} de ${dados.quantidade} unidades registrada via NFC para ${produto.nome}!`);
                
                // Atualizar listagens se estiverem disponíveis
                if (typeof estoqueManager !== 'undefined') {
                    await estoqueManager.loadEstoque();
                }
                if (typeof produtosManager !== 'undefined') {
                    await produtosManager.loadProdutos();
                }
            }
        } catch (erro) {
            showError('Erro ao executar movimentação: ' + (erro.error || erro.message));
        }
    }

    // Buscar produto por NFC (para consultas rápidas)
    async buscarProdutoNFC() {
        if (!this.checkSupport()) return;

        try {
            const ndef = new NDEFReader();
            this.currentReader = ndef;
            await ndef.scan();

            this.showReadingStatus("Aproxime a tag NFC para buscar produto...");

            ndef.onreading = async (event) => {
                this.hideReadingStatus();
                const decoder = new TextDecoder();
                
                for (const record of event.message.records) {
                    const rawData = decoder.decode(record.data);
                    
                    try {
                        const dados = JSON.parse(rawData);
                        const produto = await this.buscarProduto(dados);
                        
                        if (produto) {
                            // Preencher campos de busca se estivermos na página apropriada
                            this.preencherCamposBusca(dados);
                            showSuccess(`Produto encontrado: ${produto.nome} - Estoque: ${produto.quantidade || 0}`);
                        } else {
                            showError("Produto não encontrado no sistema.");
                        }
                        
                    } catch (erro) {
                        showError("Erro ao interpretar os dados da tag NFC.");
                    }
                }
            };

        } catch (erro) {
            this.hideReadingStatus();
            showError("Erro ao tentar usar NFC para busca.");
        }
    }

    // Preencher campos de busca
    preencherCamposBusca(dados) {
        // Para página de produtos
        const searchProduto = document.getElementById('search-produto');
        if (searchProduto) {
            searchProduto.value = dados.codigo_barras || dados.nome || '';
            searchProduto.dispatchEvent(new Event('input'));
        }

        // Para página de estoque
        const searchEstoque = document.getElementById('search-estoque');
        if (searchEstoque) {
            searchEstoque.value = dados.codigo_barras || dados.nome || '';
            searchEstoque.dispatchEvent(new Event('input'));
        }
    }
}

// Instância global do gerenciador NFC
const nfcManager = new NFCManager();

// Exportar para uso global
window.nfcManager = nfcManager;