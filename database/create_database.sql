-- Script de criação do banco de dados para o Sistema de Logística de Estoque
-- Execute este script em seu MySQL para criar a estrutura completa

CREATE DATABASE IF NOT EXISTS logistica_estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logistica_estoque;

-- Tabela de produtos
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    preco DECIMAL(10, 2) DEFAULT 0,
    codigo_barras VARCHAR(50) UNIQUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome),
    INDEX idx_categoria (categoria),
    INDEX idx_codigo_barras (codigo_barras)
);

-- Tabela de controle de estoque
CREATE TABLE estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    quantidade INT DEFAULT 0,
    estoque_minimo INT DEFAULT 10,
    estoque_maximo INT DEFAULT 100,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_produto_estoque (produto_id),
    INDEX idx_quantidade (quantidade)
);

-- Tabela de movimentações de estoque
CREATE TABLE movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    tipo ENUM('ENTRADA', 'SAIDA') NOT NULL,
    quantidade INT NOT NULL,
    descricao TEXT,
    data_movimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    INDEX idx_produto_movimento (produto_id),
    INDEX idx_tipo (tipo),
    INDEX idx_data_movimento (data_movimento)
);

-- Trigger para atualizar estoque automaticamente após movimentação
DELIMITER $$

CREATE TRIGGER tr_movimentacao_estoque 
AFTER INSERT ON movimentacoes
FOR EACH ROW
BEGIN
    IF NEW.tipo = 'ENTRADA' THEN
        UPDATE estoque 
        SET quantidade = quantidade + NEW.quantidade
        WHERE produto_id = NEW.produto_id;
    ELSEIF NEW.tipo = 'SAIDA' THEN
        UPDATE estoque 
        SET quantidade = GREATEST(0, quantidade - NEW.quantidade)
        WHERE produto_id = NEW.produto_id;
    END IF;
END$$

DELIMITER ;

-- Inserir dados de exemplo
INSERT INTO produtos (nome, descricao, categoria, preco, codigo_barras) VALUES
('Notebook Dell Inspiron', 'Notebook para uso corporativo com 8GB RAM e SSD 256GB', 'Eletrônicos', 2500.00, '7891234567890'),
('Mouse Óptico USB', 'Mouse óptico com cabo USB, ergonômico', 'Eletrônicos', 25.90, '7891234567891'),
('Teclado Mecânico', 'Teclado mecânico para gamers com iluminação RGB', 'Eletrônicos', 189.90, '7891234567892'),
('Cadeira de Escritório', 'Cadeira ergonômica para escritório com apoio lombar', 'Casa', 350.00, '7891234567893'),
('Mesa para Computador', 'Mesa de madeira para computador com gavetas', 'Casa', 280.00, '7891234567894'),
('Livro - Python para Iniciantes', 'Guia completo de programação Python', 'Livros', 45.90, '7891234567895'),
('Camiseta Polo', 'Camiseta polo masculina 100% algodão', 'Roupas', 59.90, '7891234567896'),
('Calça Jeans', 'Calça jeans feminina skinny', 'Roupas', 89.90, '7891234567897'),
('Smartphone Android', 'Smartphone com tela de 6.1 polegadas e 128GB', 'Eletrônicos', 899.00, '7891234567898'),
('Fone de Ouvido Bluetooth', 'Fone de ouvido sem fio com cancelamento de ruído', 'Eletrônicos', 199.90, '7891234567899');

-- Inserir dados de estoque inicial
INSERT INTO estoque (produto_id, quantidade, estoque_minimo, estoque_maximo) VALUES
(1, 15, 5, 30),
(2, 45, 10, 100),
(3, 8, 5, 25),
(4, 12, 3, 20),
(5, 6, 2, 15),
(6, 25, 10, 50),
(7, 35, 15, 80),
(8, 28, 12, 60),
(9, 3, 5, 25),  -- Este produto está com estoque baixo
(10, 18, 8, 40);

-- Inserir algumas movimentações de exemplo
INSERT INTO movimentacoes (produto_id, tipo, quantidade, descricao) VALUES
(1, 'ENTRADA', 10, 'Compra de notebooks para reposição de estoque'),
(2, 'ENTRADA', 50, 'Entrada de mouses do fornecedor'),
(3, 'SAIDA', 2, 'Venda para cliente corporativo'),
(4, 'ENTRADA', 5, 'Reposição de cadeiras'),
(5, 'SAIDA', 1, 'Venda online'),
(6, 'ENTRADA', 20, 'Entrada de livros da editora'),
(7, 'SAIDA', 5, 'Venda para loja parceira'),
(8, 'ENTRADA', 15, 'Reposição de calças jeans'),
(9, 'SAIDA', 7, 'Venda de smartphones - promoção'),
(10, 'ENTRADA', 10, 'Entrada de fones de ouvido');

-- Views úteis para relatórios
CREATE VIEW vw_produtos_estoque AS
SELECT 
    p.id,
    p.nome,
    p.categoria,
    p.preco,
    p.codigo_barras,
    e.quantidade,
    e.estoque_minimo,
    e.estoque_maximo,
    CASE 
        WHEN e.quantidade = 0 THEN 'CRITICO'
        WHEN e.quantidade <= e.estoque_minimo THEN 'BAIXO'
        ELSE 'NORMAL'
    END as status_estoque
FROM produtos p
LEFT JOIN estoque e ON p.id = e.produto_id;

CREATE VIEW vw_produtos_estoque_baixo AS
SELECT 
    p.id,
    p.nome,
    p.categoria,
    e.quantidade,
    e.estoque_minimo,
    e.estoque_maximo
FROM produtos p
JOIN estoque e ON p.id = e.produto_id
WHERE e.quantidade <= e.estoque_minimo;

CREATE VIEW vw_movimentacoes_completa AS
SELECT 
    m.id,
    m.produto_id,
    p.nome as produto_nome,
    p.categoria,
    m.tipo,
    m.quantidade,
    m.descricao,
    m.data_movimento
FROM movimentacoes m
JOIN produtos p ON m.produto_id = p.id
ORDER BY m.data_movimento DESC;

-- Procedimentos armazenados úteis
DELIMITER $$

-- Procedimento para ajuste de estoque
CREATE PROCEDURE sp_ajustar_estoque(
    IN p_produto_id INT,
    IN p_nova_quantidade INT,
    IN p_descricao TEXT
)
BEGIN
    DECLARE v_quantidade_atual INT DEFAULT 0;
    DECLARE v_diferenca INT;
    DECLARE v_tipo_movimento VARCHAR(10);
    
    -- Obter quantidade atual
    SELECT quantidade INTO v_quantidade_atual 
    FROM estoque 
    WHERE produto_id = p_produto_id;
    
    -- Calcular diferença
    SET v_diferenca = p_nova_quantidade - v_quantidade_atual;
    
    -- Determinar tipo de movimento
    IF v_diferenca > 0 THEN
        SET v_tipo_movimento = 'ENTRADA';
    ELSEIF v_diferenca < 0 THEN
        SET v_tipo_movimento = 'SAIDA';
        SET v_diferenca = ABS(v_diferenca);
    END IF;
    
    -- Registrar movimentação se houver diferença
    IF v_diferenca != 0 THEN
        INSERT INTO movimentacoes (produto_id, tipo, quantidade, descricao)
        VALUES (p_produto_id, v_tipo_movimento, v_diferenca, p_descricao);
    END IF;
END$$

DELIMITER ;

-- Criar usuário específico para a aplicação (opcional, mas recomendado)
-- Descomente e modifique conforme necessário
-- CREATE USER 'logistica_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON logistica_estoque.* TO 'logistica_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Exibir resumo da criação
SELECT 'Banco de dados criado com sucesso!' as status;
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT COUNT(*) as total_estoque FROM estoque;
SELECT COUNT(*) as total_movimentacoes FROM movimentacoes;
SELECT COUNT(*) as produtos_estoque_baixo FROM vw_produtos_estoque_baixo;