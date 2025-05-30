# 🛒 NestJS E-commerce API

Uma API completa de sistema de compras online desenvolvida com NestJS, TypeScript, Prisma e SQLite.

## 📋 Descrição

Este projeto é uma API RESTful para um sistema de e-commerce que permite:

- ✅ Gerenciamento de usuários com autenticação JWT
- ✅ CRUD completo de produtos
- ✅ Sistema de carrinho de compras
- ✅ Finalização de pedidos
- ✅ Busca e filtragem de produtos

## 🚀 Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[Prisma](https://www.prisma.io/)** - ORM moderno para TypeScript
- **[SQLite](https://www.sqlite.org/)** - Banco de dados leve e eficiente
- **[JWT](https://jwt.io/)** - Autenticação baseada em tokens
- **[Passport](http://www.passportjs.org/)** - Middleware de autenticação
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hash de senhas

## 🏗️ Arquitetura

O projeto segue os princípios da Clean Architecture com uma estrutura modular:

```
src/
├── auth/          # Módulo de autenticação
├── users/         # Módulo de usuários
├── products/      # Módulo de produtos
├── cart/          # Módulo de carrinho
├── orders/        # Módulo de pedidos
└── prisma/        # Configuração do Prisma
```

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## 📦 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/lorenzochaves/nest-js-ecommerce.git
cd nest-js-ecommerce
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Configure o banco de dados:**
```bash
npx prisma generate
npx prisma db push
```

## 🚀 Como executar

```bash
# Desenvolvimento
pnpm run start:dev

# Produção
pnpm run build
pnpm run start:prod
```

A aplicação estará disponível em `http://localhost:3000`

## 🧪 Testes

```bash
# Testes unitários
pnpm run test

# Testes e2e
pnpm run test:e2e

# Cobertura de testes
pnpm run test:cov
```

## 📋 Endpoints da API

### Autenticação
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login de usuário

### Produtos
- `GET /products` - Listar produtos
- `GET /products/:id` - Buscar produto por ID
- `POST /products` - Criar produto
- `PUT /products/:id` - Atualizar produto
- `DELETE /products/:id` - Deletar produto

### Carrinho
- `GET /cart` - Ver carrinho do usuário
- `POST /cart` - Adicionar item ao carrinho
- `PUT /cart/:id` - Atualizar quantidade do item
- `DELETE /cart/:id` - Remover item do carrinho

### Pedidos
- `POST /orders` - Finalizar compra
- `GET /orders` - Listar pedidos do usuário
- `GET /orders/:id` - Detalhes do pedido

