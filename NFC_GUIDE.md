# 📲 Sistema NFC - LogiStock

## Funcionalidades NFC Implementadas

O sistema agora possui integração completa com NFC (Near Field Communication) para automatizar o cadastro e movimentação de produtos.

### 🛠️ Funcionalidades Disponíveis

#### 1. **Cadastro de Produtos via NFC**
- Leitura automática de dados do produto através de tag NFC
- Preenchimento automático do formulário de cadastro
- Opção de cadastro automático ou revisão manual

#### 2. **Movimentação de Estoque via NFC**
- Entrada e saída de produtos através de tag NFC
- Busca automática do produto no sistema
- Execução automática ou manual da movimentação

#### 3. **Busca de Produtos via NFC**
- Localização rápida de produtos no sistema
- Filtros automáticos baseados nos dados da tag

### 📋 Formato de Dados NFC

#### Para Cadastro de Produtos:
```json
{
  "nome": "Notebook Dell Inspiron",
  "descricao": "Notebook para uso corporativo",
  "categoria": "Eletrônicos",
  "preco": 2500.00,
  "codigo_barras": "7891234567890",
  "quantidade": 10,
  "estoque_minimo": 5,
  "estoque_maximo": 30,
  "auto_cadastro": false
}
```

#### Para Movimentação de Estoque:
```json
{
  "produto_id": 1,
  "codigo_barras": "7891234567890",
  "tipo": "entrada",
  "quantidade": 5,
  "descricao": "Reposição de estoque",
  "auto_movimentacao": true
}
```

#### Para Busca de Produtos:
```json
{
  "produto_id": 1,
  "codigo_barras": "7891234567890",
  "nome": "Notebook Dell"
}
```

### 🎯 Como Usar

#### Na Página de Produtos:

1. **Cadastrar via NFC**:
   - Clique no botão "Cadastrar via NFC"
   - Aproxime a tag NFC do dispositivo
   - Revise os dados preenchidos automaticamente
   - Confirme o cadastro

2. **Buscar via NFC**:
   - Clique no botão "Buscar via NFC"
   - Aproxime a tag NFC do dispositivo
   - O sistema filtrará automaticamente a lista

#### Na Página de Estoque:

1. **Movimentar via NFC**:
   - Clique no botão "Movimentar via NFC"
   - Aproxime a tag NFC do dispositivo
   - Confirme ou revise a movimentação

2. **Buscar Estoque via NFC**:
   - Clique no botão "Buscar via NFC"
   - Aproxime a tag NFC do dispositivo
   - Visualize informações do produto

### ⚙️ Configuração de Tags NFC

#### Campos Obrigatórios:
- **Para cadastro**: `nome` OU `codigo_barras`
- **Para movimentação**: `produto_id` OU `codigo_barras`, `tipo`, `quantidade`
- **Para busca**: `produto_id` OU `codigo_barras` OU `nome`

#### Campos Opcionais:
- `auto_cadastro`: true/false (cadastro automático)
- `auto_movimentacao`: true/false (movimentação automática)
- `descricao`: texto livre para descrição

#### Tipos de Movimentação:
- `"entrada"`: Entrada de estoque
- `"saida"`: Saída de estoque

### 🔧 Exemplos Práticos

#### 1. Tag para Produto Novo (Cadastro Manual):
```json
{
  "nome": "Mouse Óptico USB",
  "categoria": "Eletrônicos",
  "preco": 25.90,
  "codigo_barras": "7891234567891",
  "quantidade": 50,
  "auto_cadastro": false
}
```

#### 2. Tag para Entrada Automática:
```json
{
  "codigo_barras": "7891234567891",
  "tipo": "entrada",
  "quantidade": 20,
  "descricao": "Reposição semanal",
  "auto_movimentacao": true
}
```

#### 3. Tag para Saída com Confirmação:
```json
{
  "produto_id": 2,
  "tipo": "saida",
  "quantidade": 1,
  "descricao": "Venda balcão",
  "auto_movimentacao": false
}
```

### 🛡️ Validações e Segurança

#### Validações Automáticas:
- ✅ Verificação de estoque suficiente para saídas
- ✅ Validação de dados obrigatórios
- ✅ Confirmação antes de movimentações automáticas
- ✅ Verificação de existência do produto

#### Tratamento de Erros:
- ❌ Tag NFC mal formatada
- ❌ Produto não encontrado
- ❌ Estoque insuficiente
- ❌ Dados incompletos

### 📱 Compatibilidade

#### Navegadores Suportados:
- ✅ Chrome/Chromium 89+ (Android)
- ✅ Edge 89+ (Android)
- ✅ Samsung Internet
- ❌ Safari/iOS (não suportado)
- ❌ Firefox (suporte experimental)

#### Dispositivos:
- ✅ Smartphones Android com NFC
- ✅ Tablets Android com NFC
- ❌ iPhones (limitação da Apple)
- ❌ Computadores desktop/laptop

### 🚨 Solução de Problemas

#### "NFC não é suportado neste navegador"
- Verifique se está usando Chrome/Edge no Android
- Ative o NFC nas configurações do dispositivo
- Certifique-se de estar em HTTPS (obrigatório)

#### "Erro ao interpretar os dados da tag NFC"
- Verifique o formato JSON da tag
- Confirme se todos os campos obrigatórios estão presentes
- Teste a tag com um leitor NFC genérico

#### "Produto não encontrado no sistema"
- Verifique se o produto foi cadastrado
- Confirme se o `produto_id` ou `codigo_barras` está correto
- Teste buscar o produto manualmente primeiro

### 💡 Dicas de Uso

1. **Para melhor experiência**, configure tags com `auto_movimentacao: true` para operações rotineiras
2. **Use códigos de barras** como identificador principal - mais confiável que IDs
3. **Teste as tags** antes de implementar em produção
4. **Configure alertas visuais** para movimentações automáticas importantes
5. **Mantenha backup** dos dados das tags em local seguro

### 🔄 Fluxo de Trabalho Recomendado

1. **Setup inicial**: Cadastre produtos normalmente no sistema
2. **Criação de tags**: Configure tags NFC com dados dos produtos
3. **Teste**: Valide funcionamento das tags criadas
4. **Treinamento**: Ensine equipe a usar botões NFC
5. **Monitoramento**: Acompanhe movimentações e ajuste conforme necessário