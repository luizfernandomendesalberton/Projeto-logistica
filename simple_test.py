import requests
import json

# Testar apenas o endpoint de login
url = 'http://localhost:5000/api/auth/login'

data = {
    'username': 'admin',
    'password': 'admin123',
    'remember': False,
    'is_admin': True
}

print("🔍 Testando login administrativo...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
    
    print(f"\n📊 RESULTADO:")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.headers.get('Content-Type', '').startswith('application/json'):
        response_data = response.json()
        print(f"Response JSON:")
        print(json.dumps(response_data, indent=2, ensure_ascii=False))
    else:
        print(f"Response Text: {response.text}")
        
except Exception as e:
    print(f"❌ Erro: {e}")