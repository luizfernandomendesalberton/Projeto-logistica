"""
Script para criar usuários de teste
"""
import mysql.connector
import bcrypt

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'logistica_estoque',
    'user': 'root',
    'password': 'ecalfma'
}

def hash_password(password):
    """Gerar hash da senha"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def create_test_users():
    """Criar usuários de teste"""
    try:
        # Conectar ao banco
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Verificar se já existem usuários de teste
        cursor.execute("SELECT COUNT(*) FROM usuarios WHERE username IN ('usuario', 'funcionario')")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print("Usuários de teste já existem.")
            return
        
        # Criar usuário comum
        usuario_senha = hash_password('123456')
        cursor.execute("""
            INSERT INTO usuarios (username, password_hash, nome, email, tipo, ativo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, ('usuario', usuario_senha, 'Usuário Comum', 'usuario@teste.com', 'usuario', True))
        
        # Criar funcionário
        funcionario_senha = hash_password('123456')
        cursor.execute("""
            INSERT INTO usuarios (username, password_hash, nome, email, tipo, ativo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, ('funcionario', funcionario_senha, 'Funcionário Teste', 'funcionario@teste.com', 'usuario', True))
        
        # Obter IDs dos usuários criados
        cursor.execute("SELECT id FROM usuarios WHERE username = 'usuario'")
        usuario_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id FROM usuarios WHERE username = 'funcionario'")
        funcionario_id = cursor.fetchone()[0]
        
        # Dar algumas permissões básicas ao usuário comum
        cursor.execute("SELECT id FROM permissoes WHERE nome IN ('visualizar_dashboard', 'visualizar_produtos', 'visualizar_estoque')")
        basic_permissions = cursor.fetchall()
        
        for perm in basic_permissions:
            cursor.execute("""
                INSERT INTO usuario_permissoes (usuario_id, permissao_id, concedida_por)
                VALUES (%s, %s, %s)
            """, (usuario_id, perm[0], 1))  # Concedido pelo admin (ID 1)
        
        # Dar permissões de funcionário (visualizar + gerenciar produtos)
        cursor.execute("SELECT id FROM permissoes WHERE nome IN ('visualizar_dashboard', 'gerenciar_produtos', 'visualizar_produtos', 'gerenciar_estoque', 'visualizar_estoque')")
        funcionario_permissions = cursor.fetchall()
        
        for perm in funcionario_permissions:
            cursor.execute("""
                INSERT INTO usuario_permissoes (usuario_id, permissao_id, concedida_por)
                VALUES (%s, %s, %s)
            """, (funcionario_id, perm[0], 1))  # Concedido pelo admin (ID 1)
        
        connection.commit()
        print("✅ Usuários de teste criados com sucesso!")
        print("\n👥 Usuários disponíveis:")
        print("📌 ADMIN:")
        print("   Usuário: admin")
        print("   Senha: admin123")
        print("   Acesso: Painel Administrativo completo")
        print("\n📌 FUNCIONÁRIO:")
        print("   Usuário: funcionario") 
        print("   Senha: 123456")
        print("   Acesso: Dashboard + Gerenciar produtos e estoque")
        print("\n📌 USUÁRIO COMUM:")
        print("   Usuário: usuario")
        print("   Senha: 123456")
        print("   Acesso: Dashboard + Apenas visualizar")
        
    except mysql.connector.Error as e:
        print(f"❌ Erro ao criar usuários de teste: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    create_test_users()