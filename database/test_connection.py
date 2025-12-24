"""
Script para testar a conexão com o banco de dados MySQL
Execute este script para verificar se a configuração está correta
"""

import mysql.connector
from mysql.connector import Error
import sys

def test_connection():
    """Testa a conexão com o banco de dados"""
    
    # Configuração de teste - modifique conforme necessário
    config = {
        'host': 'localhost',
        'database': 'logistica_estoque',
        'user': 'root',
        'password': 'sua_senha_aqui'  # MODIFIQUE AQUI
    }
    
    try:
        print("Testando conexão com o banco de dados...")
        print(f"Host: {config['host']}")
        print(f"Database: {config['database']}")
        print(f"User: {config['user']}")
        print("-" * 50)
        
        # Tentar conectar
        connection = mysql.connector.connect(**config)
        
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"✅ Conectado ao MySQL Server versão {db_info}")
            
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            database_name = cursor.fetchone()
            print(f"✅ Conectado ao banco de dados: {database_name[0]}")
            
            # Testar algumas consultas básicas
            print("\n🔍 Testando consultas básicas:")
            
            # Verificar tabelas
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            print(f"📋 Tabelas encontradas: {len(tables)}")
            for table in tables:
                print(f"   - {table[0]}")
            
            # Verificar dados de exemplo
            cursor.execute("SELECT COUNT(*) FROM produtos;")
            count_produtos = cursor.fetchone()[0]
            print(f"📦 Total de produtos: {count_produtos}")
            
            cursor.execute("SELECT COUNT(*) FROM movimentacoes;")
            count_movimentacoes = cursor.fetchone()[0]
            print(f"📊 Total de movimentações: {count_movimentacoes}")
            
            # Verificar produtos com estoque baixo
            cursor.execute("""
                SELECT COUNT(*) FROM produtos p 
                JOIN estoque e ON p.id = e.produto_id 
                WHERE e.quantidade <= e.estoque_minimo
            """)
            count_estoque_baixo = cursor.fetchone()[0]
            print(f"⚠️  Produtos com estoque baixo: {count_estoque_baixo}")
            
            print("\n✅ Todos os testes passaram! O banco está funcionando corretamente.")
            return True
            
    except Error as e:
        print(f"❌ Erro ao conectar com MySQL: {e}")
        print("\n💡 Possíveis soluções:")
        print("1. Verifique se o MySQL está rodando")
        print("2. Confirme as credenciais no arquivo config")
        print("3. Execute o script create_database.sql primeiro")
        print("4. Verifique se o banco 'logistica_estoque' foi criado")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Conexão MySQL fechada.")

def check_dependencies():
    """Verifica se as dependências necessárias estão instaladas"""
    print("🔍 Verificando dependências...")
    
    try:
        import mysql.connector
        print("✅ mysql-connector-python está instalado")
    except ImportError:
        print("❌ mysql-connector-python não encontrado")
        print("💡 Instale com: pip install mysql-connector-python")
        return False
    
    try:
        import flask
        print("✅ Flask está instalado")
    except ImportError:
        print("❌ Flask não encontrado")
        print("💡 Instale com: pip install Flask")
        return False
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TESTE DE CONEXÃO - SISTEMA LOGÍSTICA DE ESTOQUE")
    print("=" * 60)
    
    # Verificar dependências primeiro
    if not check_dependencies():
        print("\n❌ Instale as dependências antes de continuar.")
        sys.exit(1)
    
    print()
    
    # Testar conexão
    if test_connection():
        print("\n🎉 Sistema pronto para uso!")
        sys.exit(0)
    else:
        print("\n❌ Corrija os problemas antes de usar o sistema.")
        sys.exit(1)