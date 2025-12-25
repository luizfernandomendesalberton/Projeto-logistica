#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de inicialização do banco de dados
Executa todos os scripts SQL necessários para configurar o sistema
"""

import mysql.connector
from mysql.connector import Error
import os
import sys

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'ecalfma'
}

# Configuração do banco após criação
DB_CONFIG_WITH_DB = {
    'host': 'localhost',
    'database': 'logistica_estoque',
    'user': 'root',
    'password': 'ecalfma'
}

def create_database():
    """Criar banco de dados se não existir"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Criar banco de dados
        cursor.execute("CREATE DATABASE IF NOT EXISTS logistica_estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print("✓ Banco de dados criado/verificado com sucesso")
        
        cursor.close()
        connection.close()
        return True
        
    except Error as e:
        print(f"❌ Erro ao criar banco de dados: {e}")
        return False

def execute_sql_file(file_path, description):
    """Executar arquivo SQL"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG_WITH_DB)
        cursor = connection.cursor()
        
        # Ler e executar arquivo SQL
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
            
        # Separar comandos SQL por ';' e executar um por um
        sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        for command in sql_commands:
            if command:
                cursor.execute(command)
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print(f"✓ {description} executado com sucesso")
        return True
        
    except Error as e:
        print(f"❌ Erro ao executar {description}: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False

def create_admin_user():
    """Criar usuário administrador padrão"""
    try:
        import bcrypt
        
        connection = mysql.connector.connect(**DB_CONFIG_WITH_DB)
        cursor = connection.cursor()
        
        # Verificar se já existe admin
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        if cursor.fetchone()[0] > 0:
            print("✓ Usuário admin já existe")
            cursor.close()
            connection.close()
            return True
        
        # Criar hash da senha padrão
        password = "admin123"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Inserir usuário admin
        query = """
        INSERT INTO users (username, password_hash, email, active, is_admin, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(query, ('admin', password_hash, 'admin@logistica.com', True, True))
        
        # Obter ID do usuário criado
        admin_id = cursor.lastrowid
        
        # Dar todas as permissões ao admin
        cursor.execute("SELECT id FROM permissions")
        permissions = cursor.fetchall()
        
        for perm in permissions:
            cursor.execute("INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)", 
                         (admin_id, perm[0]))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("✓ Usuário administrador criado com sucesso")
        print(f"   Username: admin")
        print(f"   Senha: {password}")
        print(f"   ⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!")
        return True
        
    except ImportError:
        print("❌ Biblioteca bcrypt não instalada. Execute: pip install bcrypt")
        return False
    except Error as e:
        print(f"❌ Erro ao criar usuário administrador: {e}")
        return False

def main():
    """Função principal de inicialização"""
    print("🚀 Iniciando configuração do banco de dados...")
    print("=" * 60)
    
    # Lista de scripts SQL para executar em ordem
    sql_scripts = [
        ('database/create_database.sql', 'Schema principal'),
        ('database/auth_system.sql', 'Sistema de autenticação'),
    ]
    
    # Criar banco de dados
    if not create_database():
        print("❌ Falha na criação do banco de dados. Abortando.")
        sys.exit(1)
    
    # Executar scripts SQL
    success = True
    for script_path, description in sql_scripts:
        if not execute_sql_file(script_path, description):
            success = False
    
    if not success:
        print("❌ Falha na execução de alguns scripts SQL. Verifique os erros acima.")
        sys.exit(1)
    
    # Criar usuário administrador
    if not create_admin_user():
        print("❌ Falha na criação do usuário administrador.")
        sys.exit(1)
    
    print("=" * 60)
    print("✅ Configuração concluída com sucesso!")
    print("")
    print("📋 Próximos passos:")
    print("1. Execute o sistema: python app.py")
    print("2. Acesse http://localhost:5000/login")
    print("3. Faça login com as credenciais padrão")
    print("4. Altere a senha do administrador")
    print("5. Crie usuários e configure permissões")
    print("")
    print("🔧 Estrutura do sistema:")
    print("   📁 Produtos e Estoque")
    print("   📊 Relatórios e Dashboard")
    print("   🏷️  Sistema NFC")
    print("   👥 Gestão de Usuários")
    print("   🔐 Sistema de Permissões")
    
if __name__ == "__main__":
    main()