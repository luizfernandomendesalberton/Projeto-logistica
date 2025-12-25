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
        if not user or not user.get('is_admin'):
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
            if user.get('is_admin'):
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
    query = "SELECT * FROM users WHERE id = %s AND active = 1"
    users = db.execute_query(query, (user_id,))
    return users[0] if users else None

def get_user_by_username(username):
    """Obter usuário por nome de usuário"""
    query = "SELECT * FROM users WHERE username = %s AND active = 1"
    users = db.execute_query(query, (username,))
    return users[0] if users else None

def get_user_by_nfc(nfc_data):
    """Obter usuário por dados NFC"""
    query = "SELECT * FROM users WHERE nfc_id = %s AND active = 1"
    users = db.execute_query(query, (nfc_data,))
    return users[0] if users else None

def user_has_permission(user_id, permission):
    """Verificar se usuário tem permissão específica"""
    query = """
    SELECT COUNT(*) as count FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = %s AND p.name = %s
    """
    result = db.execute_query(query, (user_id, permission))
    return result[0]['count'] > 0 if result else False

def get_user_permissions(user_id):
    """Obter todas as permissões do usuário"""
    query = """
    SELECT p.name FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = %s
    """
    permissions = db.execute_query(query, (user_id,))
    return [p['name'] for p in permissions] if permissions else []

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
    query = "UPDATE users SET last_login = NOW() WHERE id = %s"
    db.execute_query(query, (user_id,))
    
    # Registrar na tabela de sessões
    session_id = secrets.token_urlsafe(32)
    session_query = """
    INSERT INTO sessions (session_id, user_id, created_at, expires_at, active)
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
        query = "UPDATE sessions SET active = 0 WHERE session_id = %s"
        db.execute_query(query, (session['session_id'],))
    
    session.clear()

# Rotas de Autenticação
@app.route('/login')
def login():
    """Página de login"""
    if 'user_id' in session:
        user = get_user_by_id(session['user_id'])
        if user:
            if user.get('is_admin'):
                return redirect('/admin')
            else:
                return redirect('/')
    return render_template('login.html')

@app.route('/admin')
@admin_required
def admin_panel():
    """Painel administrativo"""
    return render_template('admin.html')

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """API de login"""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    remember = data.get('remember', False)
    is_admin = data.get('is_admin', False)
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Usuário e senha são obrigatórios'}), 400
    
    # Buscar usuário
    user = get_user_by_username(username)
    
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 401
    
    # Verificar senha
    if not verify_password(password, user['password_hash']):
        return jsonify({'success': False, 'message': 'Senha incorreta'}), 401
    
    # Verificar se está ativo
    if not user['active']:
        return jsonify({'success': False, 'message': 'Usuário inativo'}), 401
    
    # Se for acesso admin, verificar privilégios
    if is_admin and not user['is_admin']:
        return jsonify({'success': False, 'message': 'Usuário não possui privilégios administrativos'}), 403
    
    # Criar sessão
    create_session(user['id'], remember)
    
    # Preparar dados do usuário para retorno
    user_data = {
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'is_admin': user['is_admin'],
        'permissions': get_user_permissions(user['id'])
    }
    
    return jsonify({
        'success': True,
        'message': 'Login realizado com sucesso',
        'user': user_data
    })

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
    if not user['active']:
        return jsonify({'success': False, 'message': 'Usuário inativo'}), 401
    
    # Se for acesso admin, verificar privilégios
    if is_admin and not user['is_admin']:
        return jsonify({'success': False, 'message': 'Cartão não possui privilégios administrativos'}), 403
    
    # Criar sessão
    create_session(user['id'], False)
    
    # Preparar dados do usuário para retorno
    user_data = {
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'is_admin': user['is_admin'],
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
        'is_admin': user['is_admin'],
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
    result = db.execute_query("SELECT COUNT(*) as count FROM users WHERE active = 1")
    stats['total_users'] = result[0]['count'] if result else 0
    
    # Total de produtos
    result = db.execute_query("SELECT COUNT(*) as count FROM produtos")
    stats['total_products'] = result[0]['count'] if result else 0
    
    # Total de movimentações do mês
    result = db.execute_query("""
        SELECT COUNT(*) as count FROM movimentacao_estoque 
        WHERE DATE(data_movimentacao) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    """)
    stats['total_movements'] = result[0]['count'] if result else 0
    
    # Alertas de estoque baixo
    result = db.execute_query("""
        SELECT COUNT(*) as count FROM estoque e
        JOIN produtos p ON e.produto_id = p.id
        WHERE e.quantidade <= e.estoque_minimo
    """)
    stats['total_alerts'] = result[0]['count'] if result else 0
    
    return jsonify(stats)

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    """Listar todos os usuários"""
    query = """
    SELECT id, username, email, active, is_admin, created_at, last_login
    FROM users ORDER BY created_at DESC
    """
    users = db.execute_query(query)
    
    # Adicionar permissões para cada usuário
    for user in users or []:
        user['permissions'] = get_user_permissions(user['id'])
    
    return jsonify(users or [])

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def admin_get_user(user_id):
    """Obter usuário específico"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Remover dados sensíveis
    user.pop('password_hash', None)
    user['permissions'] = get_user_permissions(user['id'])
    
    return jsonify(user)

@app.route('/api/admin/users', methods=['POST'])
@admin_required
def admin_create_user():
    """Criar novo usuário"""
    data = request.json
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
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
    INSERT INTO users (username, password_hash, email, active, is_admin, created_at)
    VALUES (%s, %s, %s, %s, %s, NOW())
    """
    
    try:
        user_id = db.execute_query(query, (username, password_hash, email, active, is_admin))
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
    UPDATE users SET username = %s, email = %s, is_admin = %s, active = %s
    WHERE id = %s
    """
    
    try:
        db.execute_query(query, (username, email, is_admin, active, user_id))
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
    if user['is_admin']:
        admin_count = db.execute_query("SELECT COUNT(*) as count FROM users WHERE is_admin = 1 AND active = 1")
        if admin_count and admin_count[0]['count'] <= 1:
            return jsonify({'success': False, 'message': 'Não é possível excluir o último administrador'}), 400
    
    try:
        # Marcar como inativo em vez de excluir
        query = "UPDATE users SET active = 0 WHERE id = %s"
        db.execute_query(query, (user_id,))
        
        # Desativar todas as sessões do usuário
        session_query = "UPDATE sessions SET active = 0 WHERE user_id = %s"
        db.execute_query(session_query, (user_id,))
        
        return jsonify({'success': True, 'message': 'Usuário excluído com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao excluir usuário: {str(e)}'}), 500

@app.route('/api/admin/permissions', methods=['GET'])
@admin_required
def admin_get_permissions():
    """Listar todas as permissões disponíveis"""
    query = "SELECT * FROM permissions ORDER BY name"
    permissions = db.execute_query(query)
    return jsonify(permissions or [])

@app.route('/api/admin/users/<int:user_id>/permissions', methods=['PUT'])
@admin_required
def admin_update_user_permissions(user_id):
    """Atualizar permissões do usuário"""
    data = request.json
    permissions = data.get('permissions', [])
    
    # Verificar se usuário existe
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    try:
        # Remover permissões antigas
        delete_query = "DELETE FROM user_permissions WHERE user_id = %s"
        db.execute_query(delete_query, (user_id,))
        
        # Adicionar novas permissões
        if permissions:
            # Buscar IDs das permissões
            placeholders = ','.join(['%s'] * len(permissions))
            perm_query = f"SELECT id, name FROM permissions WHERE name IN ({placeholders})"
            perm_results = db.execute_query(perm_query, permissions)
            
            if perm_results:
                # Inserir permissões do usuário
                insert_query = "INSERT INTO user_permissions (user_id, permission_id) VALUES (%s, %s)"
                for perm in perm_results:
                    db.execute_query(insert_query, (user_id, perm['id']))
        
        return jsonify({'success': True, 'message': 'Permissões atualizadas com sucesso'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao atualizar permissões: {str(e)}'}), 500

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)