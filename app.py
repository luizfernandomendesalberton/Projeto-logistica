from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime, timedelta
import os
import bcrypt
import secrets
from functools import wraps

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # Chave secreta para sessões

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'logistica_estoque',
    'user': 'root',
    'password': 'ecalfma'
}

class DatabaseManager:
    def __init__(self, config):
        self.config = config

    def get_connection(self):
        try:
            connection = mysql.connector.connect(**self.config)
            return connection
        except Error as e:
            print(f"Erro ao conectar com MySQL: {e}")
            return None

    def execute_query(self, query, params=None):
        connection = self.get_connection()
        if connection is None:
            return None
        
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(query, params)
            
            if query.strip().lower().startswith('select'):
                result = cursor.fetchall()
            else:
                connection.commit()
                result = cursor.lastrowid
            
            return result
        except Error as e:
            print(f"Erro na execução da query: {e}")
            return None
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()

db = DatabaseManager(DB_CONFIG)

# Funções de Autenticação e Autorização
def hash_password(password):
    """Gerar hash da senha"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    """Verificar senha"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8') if isinstance(hashed, str) else hashed)

def login_required(f):
    """Decorator para exigir login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator para exigir privilégios de admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        
        # Verificar se é admin
        user = get_user_by_id(session['user_id'])
        if not user or user.get('tipo') != 'admin':
            if request.is_json:
                return jsonify({'error': 'Admin privileges required'}), 403
            return redirect(url_for('login'))
        
        return f(*args, **kwargs)
    return decorated_function

def permission_required(permission):
    """Decorator para exigir permissão específica"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                if request.is_json:
                    return jsonify({'error': 'Authentication required'}), 401
                return redirect(url_for('login'))
            
            user = get_user_by_id(session['user_id'])
            if not user:
                if request.is_json:
                    return jsonify({'error': 'User not found'}), 401
                return redirect(url_for('login'))
            
            # Admin tem todas as permissões
            if user.get('tipo') == 'admin':
                return f(*args, **kwargs)
            
            # Verificar permissão específica
            if not user_has_permission(user['id'], permission):
                if request.is_json:
                    return jsonify({'error': f'Permission {permission} required'}), 403
                return redirect(url_for('login'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_by_id(user_id):
    """Obter usuário por ID"""
    query = "SELECT * FROM usuarios WHERE id = %s AND ativo = 1"
    users = db.execute_query(query, (user_id,))
    return users[0] if users else None

def get_user_by_username(username):
    """Obter usuário por nome de usuário"""
    query = "SELECT * FROM usuarios WHERE username = %s AND ativo = 1"
    users = db.execute_query(query, (username,))
    return users[0] if users else None

def get_user_by_nfc(nfc_data):
    """Obter usuário por dados NFC"""
    query = "SELECT * FROM usuarios WHERE nfc_id = %s AND ativo = 1"
    users = db.execute_query(query, (nfc_data,))
    return users[0] if users else None

def user_has_permission(user_id, permission):
    """Verificar se usuário tem permissão específica"""
    query = """
    SELECT COUNT(*) as count FROM usuario_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE up.usuario_id = %s AND p.nome = %s
    """
    result = db.execute_query(query, (user_id, permission))
    return result[0]['count'] > 0 if result else False

def get_user_permissions(user_id):
    """Obter todas as permissões do usuário"""
    query = """
    SELECT p.nome FROM usuario_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE up.usuario_id = %s
    """
    permissions = db.execute_query(query, (user_id,))
    return [p['nome'] for p in permissions] if permissions else []

def create_session(user_id, remember=False):
    """Criar sessão do usuário"""
    session['user_id'] = user_id
    session['created_at'] = datetime.now().isoformat()
    
    if remember:
        session.permanent = True
        app.permanent_session_lifetime = timedelta(days=30)
    else:
        app.permanent_session_lifetime = timedelta(hours=8)
    
    # Atualizar último login
    query = "UPDATE usuarios SET data_ultimo_login = NOW() WHERE id = %s"
    db.execute_query(query, (user_id,))
    
    # Registrar na tabela de sessões
    session_id = secrets.token_urlsafe(32)
    session_query = """
    INSERT INTO sessoes (id, usuario_id, data_criacao, data_expiracao, ativo)
    VALUES (%s, %s, NOW(), DATE_ADD(NOW(), INTERVAL %s HOUR), 1)
    """
    hours = 720 if remember else 8  # 30 dias ou 8 horas
    db.execute_query(session_query, (session_id, user_id, hours))
    
    session['session_id'] = session_id
    return session_id

def destroy_session():
    """Destruir sessão atual"""
    if 'session_id' in session:
        # Marcar sessão como inativa no banco
        query = "UPDATE sessoes SET ativo = 0 WHERE id = %s"
        db.execute_query(query, (session['session_id'],))
    
    session.clear()

# Rotas de Autenticação
@app.route('/login')
def login():
    """Página de login"""
    if 'user_id' in session:
        user = get_user_by_id(session['user_id'])
        if user:
            # Usuário já logado, redirecionar para dashboard principal
            return redirect('/')
    return render_template('login.html')

@app.route('/admin')
@admin_required
def admin_panel():
    """Painel administrativo"""
    return render_template('admin.html')

@app.route('/admin/permissions')
@admin_required
def admin_permissions_page():
    """Página de gerenciamento de permissões"""
    return render_template('admin_permissions.html')

@app.route('/admin/logs')
@admin_required
def admin_logs_page():
    """Página de logs do sistema"""
    return render_template('admin_logs.html')

@app.route('/test')
def test_page():
    """Página de teste"""
    return render_template('test_page.html')

@app.route('/testlogin')
def test_login_page():
    """Página de teste de login simples"""
    return render_template('test_login.html')

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """API de login"""
    try:
        print(f"[LOGIN] Recebida requisição de login")
        data = request.json
        print(f"[LOGIN] Dados recebidos: {data}")
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        remember = data.get('remember', False)
        is_admin = data.get('is_admin', False)
        
        print(f"[LOGIN] Username: {username}, Is_admin: {is_admin}")
        
        if not username or not password:
            print(f"[LOGIN] ERRO: Campos obrigatórios em branco")
            return jsonify({'success': False, 'message': 'Usuário e senha são obrigatórios'}), 400
        
        # Buscar usuário
        user = get_user_by_username(username)
        print(f"[LOGIN] Usuário encontrado: {user is not None}")
        
        if not user:
            print(f"[LOGIN] ERRO: Usuário não encontrado")
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 401
        
        # Verificar senha
        password_valid = verify_password(password, user['password_hash'])
        print(f"[LOGIN] Senha válida: {password_valid}")
        
        if not password_valid:
            print(f"[LOGIN] ERRO: Senha incorreta")
            return jsonify({'success': False, 'message': 'Senha incorreta'}), 401
        
        # Verificar se está ativo
        if not user['ativo']:
            print(f"[LOGIN] ERRO: Usuário inativo")
            return jsonify({'success': False, 'message': 'Usuário inativo'}), 401
        
        # Se for acesso admin, verificar privilégios
        if is_admin and user['tipo'] != 'admin':
            print(f"[LOGIN] ERRO: Sem privilégios admin. Tipo: {user['tipo']}")
            return jsonify({'success': False, 'message': 'Usuário não possui privilégios administrativos'}), 403
        
        # Criar sessão
        session_id = create_session(user['id'], remember)
        print(f"[LOGIN] Sessão criada: {session_id}")
        
        # Preparar dados do usuário para retorno
        user_data = {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'is_admin': user['tipo'] == 'admin',
            'permissions': get_user_permissions(user['id'])
        }
        
        print(f"[LOGIN] SUCESSO! User data: {user_data}")
        
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso',
            'user': user_data
        })
        
    except Exception as e:
        print(f"[LOGIN] EXCEÇÃO: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500

@app.route('/api/auth/nfc-login', methods=['POST'])
def api_nfc_login():
    """API de login via NFC"""
    data = request.json
    nfc_data = data.get('nfc_data', '').strip()
    is_admin = data.get('is_admin', False)
    
    if not nfc_data:
        return jsonify({'success': False, 'message': 'Dados NFC são obrigatórios'}), 400
    
    # Buscar usuário pelo NFC
    user = get_user_by_nfc(nfc_data)
    
    if not user:
        return jsonify({'success': False, 'message': 'Cartão NFC não autorizado'}), 401
    
    # Verificar se está ativo
    if not user['ativo']:
        return jsonify({'success': False, 'message': 'Usuário inativo'}), 401
    
    # Se for acesso admin, verificar privilégios
    if is_admin and user['tipo'] != 'admin':
        return jsonify({'success': False, 'message': 'Cartão não possui privilégios administrativos'}), 403
    
    # Criar sessão
    create_session(user['id'], False)
    
    # Preparar dados do usuário para retorno
    user_data = {
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'is_admin': user['tipo'] == 'admin',
        'permissions': get_user_permissions(user['id'])
    }
    
    return jsonify({
        'success': True,
        'message': 'Login NFC realizado com sucesso',
        'user': user_data
    })

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """API de logout"""
    destroy_session()
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso'})

@app.route('/logout', methods=['GET'])
def logout():
    """Logout via GET (redirecionamento)"""
    destroy_session()
    return redirect(url_for('login'))

@app.route('/api/auth/check-session', methods=['GET'])
def check_session():
    """Verificar sessão ativa"""
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401
    
    user = get_user_by_id(session['user_id'])
    if not user:
        destroy_session()
        return jsonify({'authenticated': False}), 401
    
    user_data = {
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'is_admin': user['tipo'] == 'admin',
        'permissions': get_user_permissions(user['id'])
    }
    
    return jsonify({
        'authenticated': True,
        'user': user_data
    })

# Rotas do Sistema Principal (com autenticação)

# Rotas do Sistema Principal (com autenticação)
@app.route('/')
@login_required
def index():
    """Página principal do sistema"""
    return render_template('index.html')

@app.route('/produtos')
@login_required
def produtos():
    """Página de gerenciamento de produtos"""
    return render_template('produtos.html')

@app.route('/estoque')
@login_required
def estoque():
    """Página de controle de estoque"""
    return render_template('estoque.html')

@app.route('/relatorios')
@login_required
def relatorios():
    """Página de relatórios"""
    return render_template('relatorios.html')

# API Routes Administrativas
@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    """Estatísticas para o painel administrativo"""
    stats = {}
    
    # Total de usuários
    result = db.execute_query("SELECT COUNT(*) as count FROM usuarios WHERE ativo = 1")
    stats['total_users'] = result[0]['count'] if result else 0
    
    # Total de administradores
    result = db.execute_query("SELECT COUNT(*) as count FROM usuarios WHERE tipo = 'admin' AND ativo = 1")
    stats['total_admins'] = result[0]['count'] if result else 0
    
    # Usuários online (com sessão ativa nas últimas 24h)
    result = db.execute_query("""
        SELECT COUNT(DISTINCT usuario_id) as count FROM sessoes 
        WHERE ativo = 1 AND data_criacao >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    """)
    stats['users_online'] = result[0]['count'] if result else 0
    
    # Total de produtos (se a tabela existir)
    try:
        result = db.execute_query("SELECT COUNT(*) as count FROM produtos")
        stats['total_products'] = result[0]['count'] if result else 0
    except:
        stats['total_products'] = 0
    
    return jsonify(stats)

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    """Listar todos os usuários"""
    print("[ADMIN] Carregando lista de usuários")
    query = """
    SELECT id, username, nome, email, ativo, tipo, data_criacao, data_ultimo_login
    FROM usuarios ORDER BY data_criacao DESC
    """
    users = db.execute_query(query)
    print(f"[ADMIN] Encontrados {len(users or [])} usuários")
    
    # Adicionar permissões e ajustar formato para cada usuário
    for user in users or []:
        user['active'] = user['ativo']  # Compatibilidade com frontend
        user['is_admin'] = user['tipo'] == 'admin'
        user['created_at'] = user['data_criacao']
        user['last_login'] = user['data_ultimo_login']
        user['permissions'] = get_user_permissions(user['id'])
    
    return jsonify(users or [])

@app.route('/api/admin/permissions', methods=['GET'])
@admin_required
def admin_get_permissions():
    """Listar todas as permissões disponíveis"""
    print("[ADMIN] Carregando lista de permissões")
    
    permissions = get_predefined_permissions()
    
    print(f"[ADMIN] Retornando {len(permissions)} permissões")
    return jsonify(permissions)

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def admin_get_user(user_id):
    """Obter usuário específico"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Remover dados sensíveis e ajustar campos
    user.pop('password_hash', None)
    user['active'] = user['ativo']  # Compatibilidade com frontend
    user['is_admin'] = user['tipo'] == 'admin'
    user['created_at'] = user['data_criacao']
    user['last_login'] = user['data_ultimo_login']
    user['permissions'] = get_user_permissions(user['id'])
    
    return jsonify(user)

@app.route('/api/admin/users', methods=['POST'])
@admin_required
def admin_create_user():
    """Criar novo usuário"""
    data = request.json
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    nome = data.get('nome', '').strip() or username  # Se não informado, usar username
    email = data.get('email', '').strip()
    is_admin = data.get('is_admin', False)
    active = data.get('active', True)
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Usuário e senha são obrigatórios'}), 400
    
    # Verificar se usuário já existe
    if get_user_by_username(username):
        return jsonify({'success': False, 'message': 'Usuário já existe'}), 400
    
    # Criar hash da senha
    password_hash = hash_password(password)
    
    # Inserir usuário
    query = """
    INSERT INTO usuarios (username, password_hash, nome, email, ativo, tipo, data_criacao)
    VALUES (%s, %s, %s, %s, %s, %s, NOW())
    """
    
    try:
        tipo = 'admin' if is_admin else 'usuario'
        user_id = db.execute_query(query, (username, password_hash, nome, email, active, tipo))
        if user_id:
            return jsonify({'success': True, 'message': 'Usuário criado com sucesso', 'user_id': user_id})
        else:
            return jsonify({'success': False, 'message': 'Erro ao criar usuário'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao criar usuário: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def admin_update_user(user_id):
    """Atualizar usuário"""
    data = request.json
    
    # Verificar se usuário existe
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    username = data.get('username', '').strip()
    nome = data.get('nome', '').strip() or username  # Se não informado, usar username
    email = data.get('email', '').strip()
    is_admin = data.get('is_admin', False)
    active = data.get('active', True)
    
    if not username:
        return jsonify({'success': False, 'message': 'Nome de usuário é obrigatório'}), 400
    
    # Verificar se outro usuário já usa esse username
    existing_user = get_user_by_username(username)
    if existing_user and existing_user['id'] != user_id:
        return jsonify({'success': False, 'message': 'Nome de usuário já está em uso'}), 400
    
    # Atualizar usuário
    query = """
    UPDATE usuarios SET username = %s, nome = %s, email = %s, tipo = %s, ativo = %s
    WHERE id = %s
    """
    
    try:
        tipo = 'admin' if is_admin else 'usuario'
        db.execute_query(query, (username, nome, email, tipo, active, user_id))
        return jsonify({'success': True, 'message': 'Usuário atualizado com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao atualizar usuário: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    """Excluir usuário (desativar)"""
    # Verificar se usuário existe
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    # Não permitir auto-exclusão
    if user_id == session['user_id']:
        return jsonify({'success': False, 'message': 'Não é possível excluir seu próprio usuário'}), 400
    
    # Não permitir exclusão de admin se for o último
    if user['tipo'] == 'admin':
        admin_count = db.execute_query("SELECT COUNT(*) as count FROM usuarios WHERE tipo = 'admin' AND ativo = 1")
        if admin_count and admin_count[0]['count'] <= 1:
            return jsonify({'success': False, 'message': 'Não é possível excluir o último administrador'}), 400
    
    try:
        # Marcar como inativo em vez de excluir
        query = "UPDATE usuarios SET ativo = 0 WHERE id = %s"
        db.execute_query(query, (user_id,))
        
        # Desativar todas as sessões do usuário
        session_query = "UPDATE sessoes SET ativo = 0 WHERE usuario_id = %s"
        db.execute_query(session_query, (user_id,))
        
        return jsonify({'success': True, 'message': 'Usuário excluído com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao excluir usuário: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>/permissions', methods=['PUT'])
@admin_required
def admin_update_user_permissions(user_id):
    """Atualizar permissões do usuário"""
    try:
        data = request.json
        permissions = data.get('permissions', [])
        
        print(f"[ADMIN] Recebida solicitação para atualizar permissões do usuário {user_id}")
        print(f"[ADMIN] Permissões recebidas: {permissions}")
        
        # Verificar se usuário existe
        user = get_user_by_id(user_id)
        if not user:
            print(f"[ADMIN] Usuário {user_id} não encontrado")
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
        
        print(f"[ADMIN] Usuário encontrado: {user['username']}")
        
        # Primeiro, garantir que as permissões existam na tabela permissoes
        for permission_id in permissions:
            # Verificar se a permissão existe, se não, criar
            check_query = "SELECT id FROM permissoes WHERE nome = %s"
            existing = db.execute_query(check_query, (permission_id,))
            
            if not existing:
                print(f"[ADMIN] Criando permissão {permission_id}")
                # Criar a permissão
                insert_perm_query = "INSERT INTO permissoes (nome, descricao) VALUES (%s, %s)"
                # Encontrar descrição da permissão na lista predefinida
                perm_info = next((p for p in get_predefined_permissions() if p['id'] == permission_id), None)
                description = perm_info['description'] if perm_info else f'Permissão {permission_id}'
                db.execute_query(insert_perm_query, (permission_id, description))
            else:
                print(f"[ADMIN] Permissão {permission_id} já existe")
        
        # Remover permissões antigas do usuário
        print(f"[ADMIN] Removendo permissões antigas do usuário {user_id}")
        delete_query = "DELETE FROM usuario_permissoes WHERE usuario_id = %s"
        result = db.execute_query(delete_query, (user_id,))
        print(f"[ADMIN] Permissões antigas removidas")
        
        # Adicionar novas permissões
        if permissions:
            admin_user_id = session.get('user_id', 1)  # ID do admin que está fazendo a alteração
            print(f"[ADMIN] Adicionando {len(permissions)} novas permissões")
            
            for permission_id in permissions:
                # Buscar ID da permissão
                perm_query = "SELECT id FROM permissoes WHERE nome = %s"
                perm_result = db.execute_query(perm_query, (permission_id,))
                
                if perm_result:
                    # Inserir permissão do usuário
                    insert_query = "INSERT INTO usuario_permissoes (usuario_id, permissao_id, concedida_por) VALUES (%s, %s, %s)"
                    result = db.execute_query(insert_query, (user_id, perm_result[0]['id'], admin_user_id))
                    print(f"[ADMIN] Permissão {permission_id} adicionada (ID: {perm_result[0]['id']})")
                else:
                    print(f"[ADMIN] ERRO: Permissão {permission_id} não encontrada após criação")
        else:
            print(f"[ADMIN] Nenhuma permissão para adicionar (lista vazia)")
        
        print(f"[ADMIN] Permissões do usuário {user_id} atualizadas com sucesso: {permissions}")
        return jsonify({'success': True, 'message': 'Permissões atualizadas com sucesso'})
        
    except Exception as e:
        print(f"[ADMIN] ERRO ao atualizar permissões: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro ao atualizar permissões: {str(e)}'}), 500

def get_predefined_permissions():
    """Retorna lista de permissões predefinidas"""
    return [
        {
            'id': 'visualizar_dashboard',
            'name': 'Visualizar Dashboard',
            'description': 'Permite visualizar o dashboard principal'
        },
        {
            'id': 'gerenciar_produtos',
            'name': 'Gerenciar Produtos',
            'description': 'Permite criar, editar e excluir produtos'
        },
        {
            'id': 'visualizar_produtos',
            'name': 'Visualizar Produtos',
            'description': 'Permite visualizar a lista de produtos'
        },
        {
            'id': 'gerenciar_estoque',
            'name': 'Gerenciar Estoque',
            'description': 'Permite modificar quantidades em estoque'
        },
        {
            'id': 'visualizar_estoque',
            'name': 'Visualizar Estoque',
            'description': 'Permite visualizar informações de estoque'
        },
        {
            'id': 'visualizar_relatorios',
            'name': 'Visualizar Relatórios',
            'description': 'Permite visualizar relatórios do sistema'
        },
        {
            'id': 'exportar_dados',
            'name': 'Exportar Dados',
            'description': 'Permite exportar dados em diversos formatos'
        },
        {
            'id': 'usar_nfc',
            'name': 'Usar NFC',
            'description': 'Permite usar funcionalidades NFC'
        },
        {
            'id': 'gerenciar_usuarios',
            'name': 'Gerenciar Usuários',
            'description': 'Permite criar, editar e excluir usuários'
        },
        {
            'id': 'alterar_permissoes',
            'name': 'Alterar Permissões',
            'description': 'Permite modificar permissões de outros usuários'
        }
    ]

@app.route('/api/admin/users/<int:user_id>/logs', methods=['GET'])
@admin_required
def admin_get_user_logs(user_id):
    """Obter logs de atividade do usuário"""
    try:
        # Por enquanto, retornar logs mockados da tabela sessoes e movimentacoes
        logs = []
        
        # Logs de sessões (logins)
        session_logs = db.execute_query("""
            SELECT 'LOGIN' as tipo, data_login as data_hora, 
                   CONCAT('Login realizado de ', ip_address) as mensagem,
                   'Login do usuário' as detalhes
            FROM sessoes 
            WHERE user_id = %s 
            ORDER BY data_login DESC 
            LIMIT 50
        """, (user_id,))
        
        if session_logs:
            logs.extend(session_logs)
        
        # Logs de movimentações (se o usuário fez movimentações)
        movement_logs = db.execute_query("""
            SELECT 'MOVIMENTACAO' as tipo, data_movimentacao as data_hora,
                   CONCAT('Movimentação: ', tipo_movimentacao, ' - Produto ID ', produto_id) as mensagem,
                   CONCAT('Quantidade: ', quantidade, ', Observação: ', COALESCE(observacoes, 'Nenhuma')) as detalhes
            FROM movimentacoes 
            WHERE usuario_id = %s 
            ORDER BY data_movimentacao DESC 
            LIMIT 50
        """, (user_id,))
        
        if movement_logs:
            logs.extend(movement_logs)
        
        # Ordenar logs por data
        logs.sort(key=lambda x: x['data_hora'] if x['data_hora'] else '', reverse=True)
        
        return jsonify(logs[:100])  # Limitar a 100 logs mais recentes
        
    except Exception as e:
        print(f"[ADMIN] Erro ao buscar logs do usuário {user_id}: {e}")
        return jsonify({'success': False, 'message': f'Erro ao buscar logs: {str(e)}'}), 500

# API Routes (com autenticação)
# API Routes (com autenticação)
@app.route('/api/produtos', methods=['GET'])
@login_required
def get_produtos():
    """Obter lista de produtos"""
    query = """
    SELECT p.*, e.quantidade, e.estoque_minimo, e.estoque_maximo
    FROM produtos p
    LEFT JOIN estoque e ON p.id = e.produto_id
    ORDER BY p.nome
    """
    produtos = db.execute_query(query)
    return jsonify(produtos if produtos else [])

@app.route('/api/produtos', methods=['POST'])
@login_required
@permission_required('manage_products')
def add_produto():
    """Adicionar novo produto"""
    data = request.json
    
    # Inserir produto
    query = """
    INSERT INTO produtos (nome, descricao, categoria, preco, codigo_barras)
    VALUES (%(nome)s, %(descricao)s, %(categoria)s, %(preco)s, %(codigo_barras)s)
    """
    produto_id = db.execute_query(query, data)
    
    if produto_id:
        # Criar entrada no estoque
        estoque_query = """
        INSERT INTO estoque (produto_id, quantidade, estoque_minimo, estoque_maximo)
        VALUES (%(produto_id)s, %(quantidade)s, %(estoque_minimo)s, %(estoque_maximo)s)
        """
        estoque_data = {
            'produto_id': produto_id,
            'quantidade': data.get('quantidade', 0),
            'estoque_minimo': data.get('estoque_minimo', 10),
            'estoque_maximo': data.get('estoque_maximo', 100)
        }
        db.execute_query(estoque_query, estoque_data)
        
        return jsonify({'success': True, 'id': produto_id})
    
    return jsonify({'success': False, 'error': 'Erro ao criar produto'})

@app.route('/api/produtos/<int:produto_id>', methods=['PUT'])
@login_required
@permission_required('manage_products')
def update_produto(produto_id):
    """Atualizar produto"""
    data = request.json
    query = """
    UPDATE produtos 
    SET nome=%(nome)s, descricao=%(descricao)s, categoria=%(categoria)s, 
        preco=%(preco)s, codigo_barras=%(codigo_barras)s
    WHERE id=%(id)s
    """
    data['id'] = produto_id
    result = db.execute_query(query, data)
    
    return jsonify({'success': result is not None})

@app.route('/api/produtos/<int:produto_id>', methods=['DELETE'])
@login_required
@permission_required('manage_products')
def delete_produto(produto_id):
    """Deletar produto"""
    query = "DELETE FROM produtos WHERE id = %s"
    result = db.execute_query(query, (produto_id,))
    
    return jsonify({'success': result is not None})

@app.route('/api/estoque/<int:produto_id>/entrada', methods=['POST'])
@login_required
@permission_required('manage_inventory')
def entrada_estoque(produto_id):
    """Registrar entrada de estoque"""
    data = request.json
    quantidade = data['quantidade']
    
    # Atualizar estoque
    query = """
    UPDATE estoque 
    SET quantidade = quantidade + %s
    WHERE produto_id = %s
    """
    db.execute_query(query, (quantidade, produto_id))
    
    # Registrar movimentação
    mov_query = """
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, descricao, data_movimento)
    VALUES (%s, 'ENTRADA', %s, %s, NOW())
    """
    db.execute_query(mov_query, (produto_id, quantidade, data.get('descricao', 'Entrada de estoque')))
    
    return jsonify({'success': True})

@app.route('/api/estoque/<int:produto_id>/saida', methods=['POST'])
@login_required
@permission_required('manage_inventory')
def saida_estoque(produto_id):
    """Registrar saída de estoque"""
    data = request.json
    quantidade = data['quantidade']
    
    # Verificar se há estoque suficiente
    check_query = "SELECT quantidade FROM estoque WHERE produto_id = %s"
    result = db.execute_query(check_query, (produto_id,))
    
    if not result or result[0]['quantidade'] < quantidade:
        return jsonify({'success': False, 'error': 'Estoque insuficiente'})
    
    # Atualizar estoque
    query = """
    UPDATE estoque 
    SET quantidade = quantidade - %s
    WHERE produto_id = %s
    """
    db.execute_query(query, (quantidade, produto_id))
    
    # Registrar movimentação
    mov_query = """
    INSERT INTO movimentacoes (produto_id, tipo, quantidade, descricao, data_movimento)
    VALUES (%s, 'SAIDA', %s, %s, NOW())
    """
    db.execute_query(mov_query, (produto_id, quantidade, data.get('descricao', 'Saída de estoque')))
    
    return jsonify({'success': True})

@app.route('/api/movimentacoes/<int:produto_id>')
@login_required
def get_movimentacoes(produto_id):
    """Obter histórico de movimentações de um produto"""
    query = """
    SELECT m.*, p.nome as produto_nome
    FROM movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    WHERE m.produto_id = %s
    ORDER BY m.data_movimento DESC
    LIMIT 50
    """
    movimentacoes = db.execute_query(query, (produto_id,))
    return jsonify(movimentacoes if movimentacoes else [])

@app.route('/api/relatorio/estoque-baixo')
@login_required
@permission_required('view_reports')
def relatorio_estoque_baixo():
    """Relatório de produtos com estoque baixo"""
    query = """
    SELECT p.nome, p.categoria, e.quantidade, e.estoque_minimo
    FROM produtos p
    JOIN estoque e ON p.id = e.produto_id
    WHERE e.quantidade <= e.estoque_minimo
    ORDER BY e.quantidade ASC
    """
    produtos = db.execute_query(query)
    return jsonify(produtos if produtos else [])

@app.route('/api/relatorio/movimentacoes')
@login_required
@permission_required('view_reports')
def relatorio_movimentacoes():
    """Relatório de movimentações recentes"""
    query = """
    SELECT m.*, p.nome as produto_nome, p.categoria
    FROM movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    ORDER BY m.data_movimento DESC
    LIMIT 100
    """
    movimentacoes = db.execute_query(query)
    return jsonify(movimentacoes if movimentacoes else [])

@app.route('/admin_test')
@admin_required
def admin_test_page():
    """Página de teste do admin"""
    return render_template('admin_test.html')

@app.route('/test_admin.html')
def test_admin_page():
    """Página de teste do admin"""
    with open('test_admin.html', 'r', encoding='utf-8') as f:
        return f.read()

if __name__ == '__main__':
    print("Iniciando servidor Flask em http://127.0.0.1:5000")
    try:
        app.run(
            debug=True, 
            host='127.0.0.1',  # Apenas localhost
            port=5000,
            threaded=True,      # Melhor performance
            use_reloader=True   # Auto-reload em desenvolvimento
        )
    except Exception as e:
        print(f"Erro ao iniciar servidor: {e}")
    finally:
        print("Servidor finalizado")