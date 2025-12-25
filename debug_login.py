import requests
import json

def debug_login_process():
    """Debug completo do processo de login administrativo"""
    base_url = 'http://localhost:5000'
    
    # Criar sessão para manter cookies
    session = requests.Session()
    
    print("🔍 === DEBUG DO PROCESSO DE LOGIN ADMINISTRATIVO ===\n")
    
    # 1. Primeiro, acessar a página de login para obter cookies de sessão
    print("1️⃣ Acessando página de login...")
    try:
        response = session.get(f'{base_url}/login')
        print(f"   Status: {response.status_code}")
        print(f"   Cookies: {dict(response.cookies)}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return
    
    # 2. Verificar se existe sessão ativa
    print("\n2️⃣ Verificando sessão ativa...")
    try:
        response = session.get(f'{base_url}/api/auth/check-session')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Resposta: {response.json()}")
        else:
            print(f"   Nenhuma sessão ativa (esperado)")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # 3. Tentar login administrativo
    print("\n3️⃣ Tentando login administrativo...")
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
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Cookies após login: {dict(response.cookies)}")
        print(f"   Todos os cookies da sessão: {dict(session.cookies)}")
        
        if response.headers.get('Content-Type', '').startswith('application/json'):
            response_data = response.json()
            print(f"   Resposta JSON:")
            print(f"   {json.dumps(response_data, indent=4, ensure_ascii=False)}")
            
            if response.status_code == 200 and response_data.get('success'):
                print("\n   ✅ LOGIN REALIZADO COM SUCESSO!")
                
                # 4. Verificar sessão após login
                print("\n4️⃣ Verificando sessão após login...")
                check_response = session.get(f'{base_url}/api/auth/check-session')
                print(f"   Status: {check_response.status_code}")
                if check_response.status_code == 200:
                    check_data = check_response.json()
                    print(f"   Dados da sessão:")
                    print(f"   {json.dumps(check_data, indent=4, ensure_ascii=False)}")
                    
                    if check_data.get('authenticated') and check_data.get('user', {}).get('is_admin'):
                        print("\n   ✅ SESSÃO ADMINISTRATIVA ATIVA!")
                        
                        # 5. Tentar acessar área administrativa
                        print("\n5️⃣ Tentando acessar área administrativa...")
                        admin_response = session.get(f'{base_url}/admin')
                        print(f"   Status: {admin_response.status_code}")
                        if admin_response.status_code == 200:
                            print("   ✅ ACESSO À ÁREA ADMINISTRATIVA PERMITIDO!")
                        else:
                            print(f"   ❌ Acesso negado: {admin_response.status_code}")
                            print(f"   Resposta: {admin_response.text[:200]}...")
                    else:
                        print("   ❌ Usuário não é administrador na sessão")
                else:
                    print(f"   ❌ Erro ao verificar sessão: {check_response.status_code}")
            else:
                print(f"\n   ❌ LOGIN FALHOU!")
                if 'message' in response_data:
                    print(f"   Motivo: {response_data['message']}")
        else:
            print(f"   ❌ Resposta não é JSON: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Erro na requisição de login: {e}")

if __name__ == '__main__':
    debug_login_process()