#!/usr/bin/env python3
"""
Verificar e criar usuário admin
"""

from app import db
import bcrypt

def check_and_create_admin():
    print("Verificando usuários no banco...")
    
    # Verificar usuários existentes
    users = db.execute_query('SELECT id, username, tipo FROM usuarios')
    print(f'Total de usuários: {len(users or [])}')
    
    for user in users or []:
        print(f'  ID: {user["id"]}, User: {user["username"]}, Tipo: {user["tipo"]}')
    
    # Verificar se existe admin
    admin_exists = any(user['tipo'] == 'admin' for user in users or [])
    
    if not admin_exists:
        print('\nCriando usuário admin...')
        password = 'admin123'
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        query = '''
        INSERT INTO usuarios (username, password_hash, nome, email, tipo, ativo, data_criacao)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        '''
        
        result = db.execute_query(query, ('admin', password_hash, 'Administrador', 'admin@example.com', 'admin', True))
        if result:
            print('✓ Usuário admin criado com sucesso')
            print('  Username: admin')
            print('  Password: admin123')
        else:
            print('✗ Erro ao criar usuário admin')
    else:
        print('\n✓ Usuário admin já existe')

if __name__ == "__main__":
    check_and_create_admin()