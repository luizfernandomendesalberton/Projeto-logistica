"""
Script de teste para verificar as funcionalidades do sistema admin
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_admin_system():
    """Testa o sistema administrativo"""
    
    print("🔍 Testando sistema administrativo...")
    
    # Criar sessão
    session = requests.Session()
    
    # 1. Testar login como admin
    print("\n📋 Teste 1: Login como admin")
    login_data = {
        "username": "admin",
        "password": "admin123",
        "is_admin": True
    }
    
    response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Login bem-sucedido: {result.get('message')}")
        print(f"Usuário: {result.get('user', {}).get('username')}")
    else:
        print(f"❌ Falha no login: {response.text}")
        return
    
    # 2. Testar verificação de sessão
    print("\n📋 Teste 2: Verificação de sessão")
    response = session.get(f"{BASE_URL}/api/auth/check-session")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Sessão válida: {result.get('authenticated')}")
    else:
        print(f"❌ Sessão inválida: {response.text}")
    
    # 3. Testar listagem de usuários
    print("\n📋 Teste 3: Listagem de usuários")
    response = session.get(f"{BASE_URL}/api/admin/users")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"✅ Usuários carregados: {len(users)} usuários")
        for user in users:
            print(f"  - {user.get('username')} ({user.get('tipo', 'N/A')})")
    else:
        print(f"❌ Erro ao carregar usuários: {response.text}")
    
    # 4. Testar listagem de permissões
    print("\n📋 Teste 4: Listagem de permissões")
    response = session.get(f"{BASE_URL}/api/admin/permissions")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        permissions = response.json()
        print(f"✅ Permissões carregadas: {len(permissions)} permissões")
        for perm in permissions[:5]:  # Primeiras 5
            print(f"  - {perm.get('name')} ({perm.get('id')})")
        if len(permissions) > 5:
            print(f"  ... e mais {len(permissions) - 5} permissões")
    else:
        print(f"❌ Erro ao carregar permissões: {response.text}")
    
    # 5. Testar estatísticas
    print("\n📋 Teste 5: Estatísticas do admin")
    response = session.get(f"{BASE_URL}/api/admin/stats")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Estatísticas carregadas:")
        print(f"  - Total de usuários: {stats.get('total_users', 'N/A')}")
        print(f"  - Total de admins: {stats.get('total_admins', 'N/A')}")
        print(f"  - Usuários online: {stats.get('users_online', 'N/A')}")
    else:
        print(f"❌ Erro ao carregar estatísticas: {response.text}")
    
    print("\n🏁 Teste do sistema administrativo concluído!")

if __name__ == "__main__":
    test_admin_system()