#!/usr/bin/env python3
"""
Script para testar as APIs do painel admin
"""
import requests
import json
from pprint import pprint

def test_admin_apis():
    """Testar todas as APIs do painel admin"""
    base_url = 'http://localhost:5000'
    
    # Criar sessão para manter cookies
    session = requests.Session()
    
    print("🔧 === TESTE DAS APIs DO PAINEL ADMIN ===\n")
    
    # 1. Fazer login como admin
    print("1️⃣ Fazendo login como admin...")
    login_data = {
        'username': 'admin',
        'password': 'admin123',
        'is_admin': True
    }
    
    try:
        response = session.post(f'{base_url}/api/auth/login', json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Login realizado com sucesso!")
        else:
            print(f"   ❌ Falha no login: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Erro no login: {e}")
        return
    
    # 2. Verificar sessão
    print("\n2️⃣ Verificando sessão...")
    try:
        response = session.get(f'{base_url}/api/auth/check-session')
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            session_data = response.json()
            print("   ✅ Sessão válida!")
            print(f"   Usuário: {session_data.get('user', {}).get('username')}")
            print(f"   É admin: {session_data.get('user', {}).get('is_admin')}")
        else:
            print(f"   ❌ Sessão inválida: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Erro na verificação de sessão: {e}")
        return
    
    # 3. Testar API de estatísticas
    print("\n3️⃣ Testando API de estatísticas...")
    try:
        response = session.get(f'{base_url}/api/admin/stats')
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print("   ✅ Estatísticas carregadas!")
            print("   Dados:")
            pprint(stats, indent=6)
        else:
            print(f"   ❌ Erro nas estatísticas: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição de estatísticas: {e}")
    
    # 4. Testar API de usuários
    print("\n4️⃣ Testando API de usuários...")
    try:
        response = session.get(f'{base_url}/api/admin/users')
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('Content-Type')}")
        
        if response.status_code == 200:
            users = response.json()
            print("   ✅ Usuários carregados!")
            print(f"   Tipo da resposta: {type(users)}")
            print(f"   É uma lista: {isinstance(users, list)}")
            print(f"   Quantidade de usuários: {len(users) if isinstance(users, list) else 'N/A'}")
            
            if isinstance(users, list) and len(users) > 0:
                print("   Primeiro usuário:")
                pprint(users[0], indent=6)
        else:
            print(f"   ❌ Erro nos usuários: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição de usuários: {e}")
    
    # 5. Testar API de permissões
    print("\n5️⃣ Testando API de permissões...")
    try:
        response = session.get(f'{base_url}/api/admin/permissions')
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            perms = response.json()
            print("   ✅ Permissões carregadas!")
            print(f"   Tipo da resposta: {type(perms)}")
            print(f"   Quantidade: {len(perms) if isinstance(perms, list) else 'N/A'}")
        else:
            print(f"   ❌ Erro nas permissões: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição de permissões: {e}")

if __name__ == '__main__':
    test_admin_apis()