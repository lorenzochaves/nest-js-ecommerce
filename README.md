# 🛒 NestJS E-commerce API

Uma API completa de e-commerce desenvolvida com **NestJS**, **Prisma** e **SQLite**

## 🚀 Tecnologias

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[Prisma](https://prisma.io/)** - ORM moderno para TypeScript
- **[SQLite](https://sqlite.org/)** - Banco de dados embarcado
- **[JWT](https://jwt.io/)** - Autenticação stateless
- **[Swagger](https://swagger.io/)** - Documentação de API
- **[Class Validator](https://github.com/typestack/class-validator)** - Validação de dados
- **[Bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Hash de senhas

## 📦 Instalação

### Pré-requisitos
- Node.js (v18 ou superior)
- pnpm (recomendado) ou npm

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/lorenzochaves/nest-js-ecommerce.git
cd nest-js-ecommerce
```

2. **Setup completo: dependências + prisma + sqlite config**
```bash
pnpm run setup
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-jwt-super-secreta-aqui"
```

5. **Inicie o servidor**
```bash
pnpm run start:dev
```

A API estará disponível em: http://localhost:3000

📚 **Documentação Swagger**: http://localhost:3000/api

## 🎯 Primeiros Passos

### 1. Criar o primeiro admin
```bash
curl -X POST http://localhost:3000/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "admin123456",
    "name": "Administrador"
  }'
```

### 2. Fazer login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "admin123456"
  }'
```

### 3. Criar um produto
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "MacBook Air M2",
    "description": "Notebook Apple com chip M2",
    "price": 1299.99,
    "stock": 10,
    "imageUrl": "https://exemplo.com/macbook.jpg"
  }'
```
Veja a documentação fornecida para explorar mais funcionalidades :)

