#!/usr/bin/env python3
"""
Teste de conexão com MySQL
"""

import mysql.connector
from mysql.connector import Error

# Configuração do banco
DB_CONFIG = {
    'host': 'localhost',
    'database': 'logistica_estoque',
    'user': 'root',
    'password': 'ecalfma'
}

def test_mysql_connection():
    print("Testando conexão com MySQL...")
    
    try:
        # Teste de conexão básica
        connection = mysql.connector.connect(**DB_CONFIG)
        
        if connection.is_connected():
            print("✓ Conexão com MySQL estabelecida")
            
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"✓ Versão do MySQL: {version[0]}")
            
            # Teste de database
            cursor.execute("USE logistica_estoque")
            print("✓ Database 'logistica_estoque' acessado")
            
            # Listar tabelas
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"✓ Tabelas encontradas: {len(tables)}")
            for table in tables:
                print(f"  - {table[0]}")
            
            cursor.close()
            
        else:
            print("✗ Falha na conexão")
            
    except Error as e:
        print(f"✗ Erro de conexão: {e}")
        
        # Testar se é problema de autenticação
        if "Access denied" in str(e):
            print("  → Problema de autenticação (usuário/senha)")
        elif "Unknown database" in str(e):
            print("  → Database 'logistica_estoque' não existe")
        elif "Can't connect to MySQL server" in str(e):
            print("  → Servidor MySQL não está rodando")
    
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("✓ Conexão fechada")

if __name__ == "__main__":
    test_mysql_connection()