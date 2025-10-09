# E-Commerce Platform

Uma plataforma completa de e-commerce que conecta vendedores e compradores, permitindo cadastro de produtos, gerenciamento de carrinho de compras, favoritos e processamento de pedidos.

**Contexto:** Este projeto foi desenvolvido como parte de um teste técnico.

## Tecnologias Utilizadas

- **Frontend:** Next.js 15, Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **Autenticação:** JWT (JSON Web Tokens) com bcryptjs
- **Utilitários:** PapaParse (manipulação de CSV), ESLint
- **Gerenciador de Pacotes:** npm

## Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PostgreSQL instalado e configurado
- npm ou yarn

### Passo a passo

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd casetest
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env na raiz do projeto
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ecommerce"
JWT_SECRET="sua-chave-secreta-jwt"
```

4. **Execute as migrações do banco de dados**
```bash
npx prisma migrate dev
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

### Scripts disponíveis
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm start` - Executa a versão de produção
- `npm run lint` - Executa verificação de código

## Funcionalidades

### Para Compradores (CLIENTE)
- **Autenticação:** Registro e login de usuários
- **Catálogo:** Visualização e busca de produtos
- **Carrinho:** Adição, remoção e gerenciamento de itens
- **Favoritos:** Sistema de produtos favoritos
- **Pedidos:** Finalização de compras e histórico de pedidos

### Para Vendedores (VENDEDOR)
- **Gestão de Produtos:** Cadastro, edição e desabilitação de produtos
- **Dashboard:** Visão geral de vendas e estatísticas
- **Vendas:** Relatório de vendas realizadas
- **Upload em Lote:** Importação de produtos via CSV

### Recursos Gerais
- **Interface Responsiva:** Design adaptável para diferentes dispositivos
- **Modo Escuro:** Interface com tema escuro
- **Gerenciamento de Conta:** Habilitação/desabilitação de contas
- **Sistema de Roles:** Diferenciação entre clientes e vendedores

## Estrutura de Pastas

```
├── prisma/                  # Configuração e migrações do banco
│   ├── schema.prisma        # Schema do banco de dados
│   └── migrations/          # Migrações do Prisma
├── src/
│   ├── app/                 # App Router do Next.js
│   │   ├── api/             # API Routes
│   │   │   ├── auth/        # Endpoints de autenticação
│   │   │   ├── products/    # Endpoints de produtos
│   │   │   ├── cart/        # Endpoints do carrinho
│   │   │   ├── orders/      # Endpoints de pedidos
│   │   │   └── ...          # Outros endpoints
│   │   ├── components/      # Componentes React
│   │   ├── styles/          # Arquivos de estilo
│   │   └── [pages]/         # Páginas da aplicação
│   ├── contexts/            # Contextos React (AuthContext)
│   └── lib/                 # Utilitários e configurações
│       ├── auth.js          # Funções de autenticação
│       ├── prisma.js        # Cliente Prisma
│       └── utils.js         # Funções utilitárias
├── package.json             # Dependências e scripts
├── CSV-para-Testes          # CSV para Testes de upload
└── README.md                # Documentação do projeto
```

## Autor

Desenvolvido por **Alan Rodrigues da Silva**  
[GitHub](https://github.com/Artimuz)
