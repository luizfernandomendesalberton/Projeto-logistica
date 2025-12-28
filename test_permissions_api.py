"""
Script para testar a API de permissões
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_permissions():
    session = requests.Session()
    
    # 1. Login como admin
    print("1. Fazendo login como admin...")
    login_data = {
        "username": "admin",
        "password": "admin123",
        "is_admin": True
    }
    
    response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Falha no login: {response.text}")
        return
    
    print("✅ Login realizado com sucesso")
    
    # 2. Listar usuários para pegar um ID
    print("\n2. Listando usuários...")
    response = session.get(f"{BASE_URL}/api/admin/users")
    if response.status_code != 200:
        print(f"❌ Falha ao listar usuários: {response.text}")
        return
    
    users = response.json()
    if not users:
        print("❌ Nenhum usuário encontrado")
        return
    
    # Pegar o primeiro usuário (provavelmente o admin)
    test_user = users[0]
    user_id = test_user['id']
    username = test_user['username']
    
    print(f"✅ Usuário encontrado: {username} (ID: {user_id})")
    print(f"   Permissões atuais: {test_user.get('permissions', [])}")
    
    # 3. Testar atualização de permissões
    print(f"\n3. Testando atualização de permissões para usuário {username}...")
    test_permissions_list = [
        "visualizar_dashboard",
        "gerenciar_produtos", 
        "visualizar_estoque"
    ]
    
    permissions_data = {
        "permissions": test_permissions_list
    }
    
    print(f"   Enviando permissões: {test_permissions_list}")
    
    response = session.put(
        f"{BASE_URL}/api/admin/users/{user_id}/permissions",
        json=permissions_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"   Status da resposta: {response.status_code}")
    print(f"   Resposta: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print("✅ Permissões atualizadas com sucesso")
        else:
            print(f"❌ Falha: {result.get('message')}")
    else:
        print(f"❌ Erro HTTP: {response.status_code}")
    
    # 4. Verificar se as permissões foram salvas
    print(f"\n4. Verificando se as permissões foram salvas...")
    response = session.get(f"{BASE_URL}/api/admin/users/{user_id}")
    if response.status_code == 200:
        user_data = response.json()
        current_permissions = user_data.get('permissions', [])
        print(f"   Permissões atuais após salvar: {current_permissions}")
        
        # Verificar se todas as permissões enviadas estão presentes
        missing = set(test_permissions_list) - set(current_permissions)
        if not missing:
            print("✅ Todas as permissões foram salvas corretamente")
        else:
            print(f"❌ Permissões faltando: {missing}")
    else:
        print(f"❌ Erro ao verificar usuário: {response.text}")

if __name__ == "__main__":
    test_permissions()