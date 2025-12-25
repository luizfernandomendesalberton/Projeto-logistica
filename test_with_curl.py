#!/usr/bin/env python3
import subprocess
import time
import sys

def test_curl_login():
    """Testar login usando curl para não interferir com o servidor Flask"""
    print("🌐 Testando login com curl...")
    
    # Comando curl para login
    curl_cmd = [
        'curl', '-s', '-X', 'POST', 
        'http://127.0.0.1:5000/api/auth/login',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json',
        '-c', 'cookies.txt',  # salvar cookies
        '-d', '{"username":"admin","password":"admin123","remember":false,"is_admin":true}'
    ]
    
    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=10)
        
        print(f"📊 Status Code: {result.returncode}")
        print(f"📄 Response: {result.stdout}")
        
        if result.stderr:
            print(f"⚠️ Stderr: {result.stderr}")
        
        # Testar acesso ao admin
        if result.returncode == 0:
            print("\n🔍 Testando acesso ao /admin...")
            admin_cmd = [
                'curl', '-s', '-b', 'cookies.txt', 
                'http://127.0.0.1:5000/admin',
                '-w', '%{http_code}'
            ]
            
            admin_result = subprocess.run(admin_cmd, capture_output=True, text=True, timeout=10)
            print(f"📊 Admin Status: último 3 chars = {admin_result.stdout[-3:]}")
            
            if admin_result.stdout[-3:] == '200':
                print("✅ Acesso ao admin FUNCIONANDO!")
            else:
                print("❌ Acesso ao admin FALHOU")
                print(f"Response: {admin_result.stdout}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")

def test_server_status():
    """Verificar se o servidor está respondendo"""
    print("🔍 Verificando se servidor está ativo...")
    
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://127.0.0.1:5000/login'],
            capture_output=True, text=True, timeout=5
        )
        
        if result.stdout == '200':
            print("✅ Servidor está ativo e respondendo")
            return True
        else:
            print(f"❌ Servidor retornou código: {result.stdout}")
            return False
            
    except Exception as e:
        print(f"❌ Servidor não está acessível: {e}")
        return False

if __name__ == '__main__':
    if test_server_status():
        test_curl_login()
    else:
        print("⚠️ Servidor não está disponível - verifique se está rodando")