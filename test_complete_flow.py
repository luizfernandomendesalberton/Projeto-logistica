import requests
import json

def test_complete_login_flow():
    """Teste completo do fluxo de login administrativo"""
    base_url = 'http://127.0.0.1:5000'
    
    # Usar sessão para manter cookies
    session = requests.Session()
    
    print("🧪 TESTE COMPLETO DO LOGIN ADMINISTRATIVO\n")
    
    # Etapa 1: Acessar página de login
    print("1️⃣ Acessando página de login...")
    try:
        response = session.get(f'{base_url}/login')
        print(f"   ✅ Status: {response.status_code}")
        print(f"   🍪 Cookies recebidos: {list(session.cookies.keys())}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False
    
    # Etapa 2: Realizar login administrativo
    print("\n2️⃣ Realizando login administrativo...")
    login_data = {
        'username': 'admin',
        'password': 'admin123',
        'remember': False,
        'is_admin': True
    }
    
    try:
        response = session.post(f'{base_url}/api/auth/login', 
                               json=login_data,
                               headers={'Content-Type': 'application/json'})
        
        print(f"   📊 Status: {response.status_code}")
        print(f"   🍪 Cookies após login: {list(session.cookies.keys())}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Resposta: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if data.get('success'):
                print("   🎉 LOGIN REALIZADO COM SUCESSO!")
            else:
                print(f"   ❌ Login falhou: {data.get('message', 'Erro desconhecido')}")
                return False
        else:
            print(f"   ❌ Erro HTTP: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
        return False
    
    # Etapa 3: Verificar sessão
    print("\n3️⃣ Verificando sessão ativa...")
    try:
        response = session.get(f'{base_url}/api/auth/check-session')
        print(f"   📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Dados da sessão:")
            print(f"   {json.dumps(data, indent=6, ensure_ascii=False)}")
            
            if data.get('authenticated') and data.get('user', {}).get('is_admin'):
                print("   🔥 USUÁRIO AUTENTICADO COMO ADMIN!")
            else:
                print("   ❌ Usuário não está autenticado como admin")
                return False
        else:
            print(f"   ❌ Sessão inválida: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erro ao verificar sessão: {e}")
        return False
    
    # Etapa 4: Tentar acessar área administrativa
    print("\n4️⃣ Tentando acessar área administrativa...")
    try:
        response = session.get(f'{base_url}/admin')
        print(f"   📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   🏆 ACESSO À ÁREA ADMINISTRATIVA PERMITIDO!")
            print(f"   📄 Conteúdo recebido: {len(response.text)} caracteres")
            return True
        elif response.status_code == 302:
            print(f"   🔀 Redirecionamento: {response.headers.get('Location', 'N/A')}")
            return False
        else:
            print(f"   ❌ Acesso negado: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erro ao acessar admin: {e}")
        return False
    
    return False

if __name__ == '__main__':
    sucesso = test_complete_login_flow()
    print(f"\n{'='*50}")
    if sucesso:
        print("🎊 TESTE COMPLETO: SUCESSO!")
    else:
        print("💥 TESTE COMPLETO: FALHA!")
    print(f"{'='*50}")