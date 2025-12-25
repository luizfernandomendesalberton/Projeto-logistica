import requests
import json

def test_admin_login():
    """Testar login administrativo via API"""
    url = 'http://localhost:5000/api/auth/login'
    
    # Dados do admin
    data = {
        'username': 'admin',
        'password': 'admin123',
        'remember': False,
        'is_admin': True
    }
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        
        print(f"🌐 Status Code: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        if response.headers.get('Content-Type', '').startswith('application/json'):
            response_data = response.json()
            print(f"📄 Response JSON: {json.dumps(response_data, indent=2)}")
        else:
            print(f"📄 Response Text: {response.text[:500]}")
            
        if response.status_code == 200:
            print("✅ Login administrativo funcionou!")
        else:
            print("❌ Login administrativo falhou!")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")

if __name__ == '__main__':
    test_admin_login()