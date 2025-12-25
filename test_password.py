import mysql.connector
import bcrypt

def test_verify_password_function():
    """Testar a função de verificação de senha isoladamente"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            database='logistica_estoque',
            user='root',
            password='ecalfma'
        )
        cursor = conn.cursor(dictionary=True)

        # Buscar o hash da senha do admin
        cursor.execute('SELECT password_hash FROM usuarios WHERE username = %s', ('admin',))
        result = cursor.fetchone()
        
        if result:
            stored_hash = result['password_hash']
            test_password = 'admin123'
            
            print(f"🔍 Testando função verify_password:")
            print(f"  Password: '{test_password}'")
            print(f"  Stored hash type: {type(stored_hash)}")
            print(f"  Stored hash length: {len(stored_hash) if stored_hash else 'None'}")
            print(f"  Stored hash preview: {str(stored_hash)[:50]}..." if stored_hash else "None")
            
            # Teste 1: Função bcrypt direta
            try:
                if isinstance(stored_hash, str):
                    hash_bytes = stored_hash.encode('utf-8')
                else:
                    hash_bytes = stored_hash
                
                result1 = bcrypt.checkpw(test_password.encode('utf-8'), hash_bytes)
                print(f"  ✅ bcrypt direto: {result1}")
            except Exception as e:
                print(f"  ❌ bcrypt direto: {e}")
            
            # Teste 2: Conversão latin-1 (como era antes)
            try:
                if isinstance(stored_hash, str):
                    hash_bytes = stored_hash.encode('latin-1')
                else:
                    hash_bytes = stored_hash
                
                result2 = bcrypt.checkpw(test_password.encode('utf-8'), hash_bytes)
                print(f"  ✅ bcrypt com latin-1: {result2}")
            except Exception as e:
                print(f"  ❌ bcrypt com latin-1: {e}")
            
            # Teste 3: Função como está no app.py
            try:
                def verify_password(password, hashed):
                    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8') if isinstance(hashed, str) else hashed)
                
                result3 = verify_password(test_password, stored_hash)
                print(f"  ✅ verify_password atual: {result3}")
            except Exception as e:
                print(f"  ❌ verify_password atual: {e}")
                
        else:
            print("❌ Usuário admin não encontrado")

        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")

if __name__ == '__main__':
    test_verify_password_function()