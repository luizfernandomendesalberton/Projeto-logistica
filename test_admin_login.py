import mysql.connector
import bcrypt

def test_admin_login():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            database='logistica_estoque',
            user='root',
            password='ecalfma'
        )
        cursor = conn.cursor(dictionary=True)

        # Buscar usuário admin
        cursor.execute('SELECT * FROM usuarios WHERE username = %s', ('admin',))
        user = cursor.fetchone()

        if user:
            print('👤 Usuário encontrado:')
            print(f'  Username: {user["username"]}')
            print(f'  Tipo: {user["tipo"]}')
            print(f'  Ativo: {user["ativo"]}')
            print(f'  ID: {user["id"]}')
            
            # Testar senha
            password_hash = user['password_hash']
            if isinstance(password_hash, str):
                password_hash = password_hash.encode('latin-1')
            
            try:
                password_check = bcrypt.checkpw('admin123'.encode('utf-8'), password_hash)
                print(f'  ✅ Senha válida: {password_check}')
                
                # Simular o processo de login
                if password_check and user['tipo'] == 'admin' and user['ativo'] == 1:
                    print('  ✅ Login deve funcionar!')
                else:
                    print('  ❌ Falha na validação do login')
                    print(f'    - Password check: {password_check}')
                    print(f'    - Tipo é admin: {user["tipo"] == "admin"}')
                    print(f'    - Ativo: {user["ativo"] == 1}')
                    
            except Exception as e:
                print(f'  ❌ Erro ao verificar senha: {e}')
                print(f'    Hash type: {type(password_hash)}')
                print(f'    Hash value: {password_hash}')
        else:
            print('❌ Usuário não encontrado')

        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f'❌ Erro na conexão: {e}')

if __name__ == '__main__':
    test_admin_login()