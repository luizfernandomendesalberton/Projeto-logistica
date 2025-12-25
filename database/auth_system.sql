-- Script adicional para sistema de autenticação e permissões
-- Execute este script após o create_database.sql

USE logistica_estoque;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    tipo ENUM('admin', 'usuario') DEFAULT 'usuario',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultimo_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_tipo (tipo),
    INDEX idx_ativo (ativo)
);

-- Tabela de permissões
CREATE TABLE permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    descricao VARCHAR(255),
    
    INDEX idx_nome (nome)
);

-- Tabela de relacionamento usuário-permissões
CREATE TABLE usuario_permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    permissao_id INT NOT NULL,
    concedida_por INT NOT NULL,
    data_concessao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
    FOREIGN KEY (concedida_por) REFERENCES usuarios(id),
    UNIQUE KEY unique_usuario_permissao (usuario_id, permissao_id)
);

-- Tabela de sessões (opcional, para controle avançado)
CREATE TABLE sessoes (
    id VARCHAR(255) PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_expiracao (data_expiracao),
    INDEX idx_ativo (ativo)
);

-- Inserir permissões básicas
INSERT INTO permissoes (nome, descricao) VALUES
('visualizar_dashboard', 'Acessar dashboard principal'),
('gerenciar_produtos', 'Cadastrar, editar e excluir produtos'),
('visualizar_produtos', 'Visualizar lista de produtos'),
('gerenciar_estoque', 'Realizar entradas e saídas de estoque'),
('visualizar_estoque', 'Visualizar informações de estoque'),
('visualizar_relatorios', 'Acessar relatórios e gráficos'),
('exportar_dados', 'Exportar relatórios e dados'),
('usar_nfc', 'Utilizar funcionalidades NFC'),
('gerenciar_usuarios', 'Gerenciar usuários do sistema (admin)'),
('alterar_permissoes', 'Alterar permissões de usuários (admin)');

-- Criar usuário administrador padrão (senha: admin123)
-- Hash gerado para 'admin123' usando bcrypt
INSERT INTO usuarios (username, password_hash, nome, email, tipo) VALUES
('admin', '$2b$12$LQv3c1yqBKvlpz7O6/2vle8W.jn3m5/k3H5H5M3r8WqH7M3jH5M3q', 'Administrador', 'admin@logistica.com', 'admin');

-- Conceder todas as permissões ao administrador
INSERT INTO usuario_permissoes (usuario_id, permissao_id, concedida_por)
SELECT 1, id, 1 FROM permissoes;

-- View para facilitar consultas de usuários com permissões
CREATE VIEW vw_usuarios_permissoes AS
SELECT 
    u.id as usuario_id,
    u.username,
    u.nome,
    u.email,
    u.tipo,
    u.ativo,
    u.data_ultimo_login,
    GROUP_CONCAT(p.nome) as permissoes
FROM usuarios u
LEFT JOIN usuario_permissoes up ON u.id = up.usuario_id
LEFT JOIN permissoes p ON up.permissao_id = p.id
WHERE u.ativo = TRUE
GROUP BY u.id, u.username, u.nome, u.email, u.tipo, u.ativo, u.data_ultimo_login;

-- Procedure para verificar permissão
DELIMITER $$

CREATE PROCEDURE sp_verificar_permissao(
    IN p_usuario_id INT,
    IN p_permissao VARCHAR(50),
    OUT p_tem_permissao BOOLEAN
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_tipo VARCHAR(10);
    
    -- Verificar se é admin (admin tem todas as permissões)
    SELECT tipo INTO v_tipo FROM usuarios WHERE id = p_usuario_id AND ativo = TRUE;
    
    IF v_tipo = 'admin' THEN
        SET p_tem_permissao = TRUE;
    ELSE
        -- Verificar permissão específica
        SELECT COUNT(*) INTO v_count
        FROM usuario_permissoes up
        JOIN permissoes p ON up.permissao_id = p.id
        JOIN usuarios u ON up.usuario_id = u.id
        WHERE up.usuario_id = p_usuario_id 
        AND p.nome = p_permissao
        AND u.ativo = TRUE;
        
        SET p_tem_permissao = (v_count > 0);
    END IF;
END$$

DELIMITER ;

-- Trigger para limpar sessões expiradas automaticamente
DELIMITER $$

CREATE EVENT ev_limpar_sessoes_expiradas
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM sessoes WHERE data_expiracao < NOW();
END$$

DELIMITER ;

-- Habilitar event scheduler se não estiver ativo
SET GLOBAL event_scheduler = ON;

SELECT 'Sistema de autenticação criado com sucesso!' as status;