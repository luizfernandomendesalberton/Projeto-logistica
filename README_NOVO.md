# 📦 Sistema de Logística de Estoque com NFC

Um sistema completo de gerenciamento de estoque com automação NFC, autenticação de usuários e painel administrativo.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)
![NFC](https://img.shields.io/badge/NFC-Web%20API-purple.svg)

## 🚀 Funcionalidades

### 📋 Gestão de Produtos
- ✅ Cadastro completo de produtos
- ✅ Categorização e código de barras
- ✅ Controle de preços e descrições
- ✅ Upload de imagens (futuro)

### 📊 Controle de Estoque
- ✅ Entrada e saída automatizada
- ✅ Níveis mínimos e máximos
- ✅ Alertas de estoque baixo
- ✅ Histórico de movimentações

### 🏷️ Automação NFC
- ✅ Login via cartão NFC
- ✅ Registro automático de produtos
- ✅ Movimentação de estoque por NFC
- ✅ Identificação rápida de itens

### 👥 Sistema de Usuários
- ✅ Autenticação segura (bcrypt)
- ✅ Níveis de acesso (Admin/Usuário)
- ✅ Sistema granular de permissões
- ✅ Gestão de sessões

### 🔧 Painel Administrativo
- ✅ Dashboard com estatísticas
- ✅ Gestão de usuários
- ✅ Configuração de permissões
- ✅ Relatórios detalhados

### 📊 Relatórios
- ✅ Estoque baixo
- ✅ Movimentações recentes
- ✅ Gráficos interativos
- ✅ Exportação de dados

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.8+** - Linguagem principal
- **Flask** - Framework web
- **MySQL** - Banco de dados
- **bcrypt** - Criptografia de senhas
- **mysql-connector-python** - Driver MySQL

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização responsiva
- **JavaScript ES6+** - Interatividade
- **Chart.js** - Gráficos
- **Font Awesome** - Ícones

### Integração
- **Web NFC API** - Comunicação NFC
- **Fetch API** - Requisições AJAX
- **Session Storage** - Gerenciamento de estado

## 📋 Pré-requisitos

### Software Necessário
- **Python 3.8+** 
- **MySQL 8.0+**
- **Git** (opcional)

### Navegador Compatível
- Chrome 89+ (com suporte a Web NFC)
- Edge 89+ 
- Firefox (experimental)

### Dispositivo NFC
- Smartphone com NFC habilitado
- Cartões/tags NFC programáveis
- Leitor NFC USB (opcional)

## ⚡ Instalação Rápida

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/Projeto-logistica.git
cd Projeto-logistica
```

### 2. Instale as Dependências
```bash
pip install flask mysql-connector-python bcrypt
```

### 3. Configure o MySQL
```sql
-- Criar usuário e banco (se necessário)
CREATE USER 'root'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure a Conexão
Edite o arquivo `app.py` na seção de configuração:
```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'logistica_estoque',
    'user': 'root',
    'password': 'SUA_SENHA_AQUI'
}
```

### 5. Inicialize o Banco de Dados
```bash
python init_database.py
```

### 6. Execute o Sistema
```bash
python app.py
```

### 7. Acesse o Sistema
Abra o navegador e vá para: http://localhost:5000/login

**Credenciais padrão:**
- Username: `admin`
- Senha: `admin123`

## 📁 Estrutura do Projeto

```
Projeto-logistica/
├── 📄 app.py                    # Servidor Flask principal
├── 📄 init_database.py          # Script de inicialização
├── 📄 README.md                 # Documentação
├── 📁 database/
│   ├── 📄 schema.sql            # Schema principal
│   └── 📄 auth_system.sql       # Sistema de autenticação
├── 📁 templates/
│   ├── 📄 index.html            # Dashboard principal
│   ├── 📄 produtos.html         # Gestão de produtos
│   ├── 📄 estoque.html          # Controle de estoque
│   ├── 📄 relatorios.html       # Relatórios
│   ├── 📄 login.html            # Página de login
│   └── 📄 admin.html            # Painel administrativo
├── 📁 static/
│   ├── 📁 css/
│   │   ├── 📄 style.css         # Estilos principais
│   │   ├── 📄 auth.css          # Estilos de autenticação
│   │   └── 📄 admin.css         # Estilos administrativos
│   └── 📁 js/
│       ├── 📄 main.js           # JavaScript principal
│       ├── 📄 produtos.js       # Gestão de produtos
│       ├── 📄 estoque.js        # Controle de estoque
│       ├── 📄 relatorios.js     # Relatórios
│       ├── 📄 nfc.js            # Integração NFC
│       ├── 📄 auth.js           # Sistema de autenticação
│       └── 📄 admin.js          # Painel administrativo
```

## 🔐 Sistema de Permissões

### Permissões Disponíveis

| Permissão | Descrição | Funcionalidades |
|-----------|-----------|-----------------|
| `manage_products` | Gerenciar Produtos | Criar, editar, excluir produtos |
| `manage_inventory` | Gerenciar Estoque | Entradas, saídas, ajustes |
| `view_reports` | Ver Relatórios | Acessar relatórios e estatísticas |
| `manage_users` | Gerenciar Usuários | CRUD de usuários (apenas admin) |
| `nfc_operations` | Operações NFC | Usar funcionalidades NFC |

### Níveis de Usuário

#### 👑 Administrador
- Acesso total ao sistema
- Gestão de usuários e permissões
- Configurações do sistema
- Todos os relatórios

#### 👤 Usuário Padrão
- Permissões configuráveis
- Acesso baseado em função
- Interface personalizada
- Operações específicas

## 🏷️ Configuração NFC

### 1. Preparar Tags NFC
- Use tags NTAG213/215/216
- Formate como NDEF
- Programe com dados únicos

### 2. Estrutura de Dados
```
Formato: USERID:12345 ou PRODUCT:ABC123
- USERID: Para login de usuário
- PRODUCT: Para produtos
```

### 3. Programar Tags
```javascript
// Exemplo de programação via Web NFC
const ndef = new NDEFReader();
await ndef.write({
    records: [{ recordType: "text", data: "USERID:12345" }]
});
```

### 4. Associar ao Sistema
1. Acesse o painel admin
2. Edite usuário/produto
3. Adicione ID NFC
4. Teste funcionalidade

## 📊 Dashboard e Relatórios

### Métricas Principais
- 📦 Total de produtos cadastrados
- 📊 Quantidade total em estoque
- 📈 Movimentações do mês
- ⚠️ Alertas de estoque baixo

### Relatórios Disponíveis
- **Estoque Baixo**: Produtos abaixo do mínimo
- **Movimentações**: Histórico de entradas/saídas
- **Produtos por Categoria**: Distribuição
- **Usuários Ativos**: Estatísticas de uso

### Gráficos Interativos
- Movimentações por período
- Distribuição de categorias
- Evolução do estoque
- Comparativos mensais

## 🔧 Configuração Avançada

### Personalizar Porta
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
```

### Configurar HTTPS
```python
app.run(debug=False, host='0.0.0.0', port=443, 
        ssl_context='adhoc')
```

### Backup Automático
```bash
# Adicione ao crontab
0 2 * * * mysqldump -u root -p logistica_estoque > backup_$(date +%Y%m%d).sql
```

## 🚨 Solução de Problemas

### Erro de Conexão MySQL
```bash
# Verificar status do MySQL
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql
```

### NFC não funciona
1. Verificar navegador compatível
2. Confirmar HTTPS (obrigatório)
3. Habilitar NFC no dispositivo
4. Testar com tag simples

### Erro de Permissões
1. Verificar usuário no admin panel
2. Confirmar permissões atribuídas
3. Fazer logout/login novamente
4. Verificar logs do servidor

### Problema de Performance
1. Otimizar queries MySQL
2. Adicionar índices necessários
3. Configurar cache
4. Monitorar recursos

## 🔒 Segurança

### Práticas Implementadas
- ✅ Senhas criptografadas (bcrypt)
- ✅ Sessões seguras
- ✅ Validação de entrada
- ✅ Controle de acesso baseado em funções
- ✅ Logs de auditoria

### Recomendações
1. **Alterar senha padrão** imediatamente
2. **Usar HTTPS** em produção
3. **Backup regular** do banco
4. **Monitorar logs** de acesso
5. **Atualizar dependências** regularmente

## 📈 Roadmap de Melhorias

### Versão 2.0
- [ ] API RESTful completa
- [ ] Interface mobile responsiva
- [ ] Integração com códigos de barras
- [ ] Exportação para Excel/PDF

### Versão 3.0
- [ ] Dashboard analytics avançado
- [ ] Integração com ERPs
- [ ] Módulo de compras
- [ ] Gestão de fornecedores

### Futuro
- [ ] Machine Learning para previsões
- [ ] IoT para monitoramento automático
- [ ] App mobile nativo
- [ ] Multi-tenancy

## 🤝 Contribuindo

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Padrões de Código
- Use PEP 8 para Python
- Comente código complexo
- Teste suas alterações
- Atualize a documentação

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autor

**Sistema de Logística**
- GitHub: [@projeto-logistica](https://github.com/projeto-logistica)

## 🙏 Agradecimentos

- Flask community pela excelente documentação
- Chart.js pelo sistema de gráficos
- Font Awesome pelos ícones
- MySQL pela robustez do banco
- Web NFC API pelos recursos de NFC

---

⭐ **Gostou do projeto? Deixe uma estrela!** ⭐