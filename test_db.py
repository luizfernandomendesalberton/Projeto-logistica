#!/usr/bin/env python3
"""
Teste de conexão com banco de dados
"""

import sys
import os

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database.database import Database
    print("✓ Importação do módulo Database OK")
    
    # Teste de conexão
    db = Database()
    print("✓ Instância Database criada")
    
    # Teste de query simples
    result = db.execute_query("SELECT 1 as test")
    print(f"✓ Teste de query: {result}")
    
    # Teste de verificação de tabelas
    tables = db.execute_query("SHOW TABLES")
    print(f"✓ Tabelas encontradas: {len(tables) if tables else 0}")
    if tables:
        for table in tables:
            print(f"  - {table}")
    
except Exception as e:
    print(f"✗ Erro: {e}")
    import traceback
    traceback.print_exc()