from flask import Flask, render_template, request, jsonify, redirect, url_for
import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime
import os

app = Flask(__name__)

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

@app.route('/')
def index():
    """Página principal do sistema"""
    return render_template('index.html')

@app.route('/produtos')
def produtos():
    """Página de gerenciamento de produtos"""
    return render_template('produtos.html')

@app.route('/estoque')
def estoque():
    """Página de controle de estoque"""
    return render_template('estoque.html')

@app.route('/relatorios')
def relatorios():
    """Página de relatórios"""
    return render_template('relatorios.html')

# API Routes
@app.route('/api/produtos', methods=['GET'])
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
def delete_produto(produto_id):
    """Deletar produto"""
    query = "DELETE FROM produtos WHERE id = %s"
    result = db.execute_query(query, (produto_id,))
    
    return jsonify({'success': result is not None})

@app.route('/api/estoque/<int:produto_id>/entrada', methods=['POST'])
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