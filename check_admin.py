#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import mysql.connector
import bcrypt

try:
    # Conectar ao banco
    conn = mysql.connector.connect(
        host='localhost',
        database='logistica_estoque',
        user='root',
        password='ecalfma'
    )
    cursor = conn.cursor(dictionary=True)

    print("🔍 Verificando usuário admin...")

    # Verificar se existe usuário admin
    cursor.execute('SELECT * FROM usuarios WHERE username = %s', ('admin',))
    admin = cursor.fetchone()

    if admin:
        print('✅ Usuário admin encontrado:')
        print(f'  ID: {admin["id"]}')
        print(f'  Username: {admin["username"]}')
        print(f'  Email: {admin["email"]}')
        print(f'  Ativo: {admin["ativo"]}')
        print(f'  Tipo: {admin["tipo"]}')
        
        # Verificar se a senha está correta (testar com admin123)
        password_hash_bytes = admin['password_hash']
        if isinstance(password_hash_bytes, str):
            password_hash_bytes = password_hash_bytes.encode('latin-1')
        password_check = bcrypt.checkpw('admin123'.encode('utf-8'), password_hash_bytes)
        print(f'  Senha "admin123" válida: {password_check}')
        
        if not password_check:
            print('🔧 Redefinindo senha...')
            new_password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
            cursor.execute('UPDATE usuarios SET password_hash = %s WHERE id = %s', 
                         (new_password_hash, admin["id"]))
            conn.commit()
            print('✅ Senha redefinida para "admin123"')
    else:
        print('❌ Usuário admin não encontrado. Criando...')
        # Criar usuário admin
        password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        cursor.execute('''
            INSERT INTO usuarios (username, password_hash, nome, email, tipo, ativo, data_criacao)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ''', ('admin', password_hash, 'Administrator', 'admin@logistica.com', 'admin', True))
        conn.commit()
        print('✅ Usuário admin criado com sucesso!')
        print('  Username: admin')
        print('  Senha: admin123')

    # Verificar permissões
    print('\n🔐 Verificando permissões...')
    cursor.execute('SELECT COUNT(*) as count FROM permissoes')
    perm_count = cursor.fetchone()
    print(f'  Total de permissões: {perm_count["count"]}')
    
    # Criar permissões básicas se não existirem
    permissions = [
        ('manage_products', 'Gerenciar Produtos', 'Criar, editar e excluir produtos'),
        ('manage_inventory', 'Gerenciar Estoque', 'Controlar entrada e saída de estoque'),
        ('view_reports', 'Ver Relatórios', 'Acessar relatórios e estatísticas'),
        ('manage_users', 'Gerenciar Usuários', 'Administrar usuários e permissões'),
        ('nfc_operations', 'Operações NFC', 'Usar funcionalidades NFC')
    ]
    
    for perm_name, perm_display, perm_desc in permissions:
        cursor.execute('SELECT id FROM permissoes WHERE nome = %s', (perm_name,))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO permissoes (nome, descricao) VALUES (%s, %s)',
                         (perm_name, perm_desc))
            print(f'  ✅ Permissão criada: {perm_name}')
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print('\n🎉 Configuração concluída com sucesso!')
    print('📝 Credenciais de acesso:')
    print('  URL: http://localhost:5000/login')
    print('  Username: admin')
    print('  Senha: admin123')

except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()