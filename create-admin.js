// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');

// const prisma = new PrismaClient();

// async function createInitialAdmin() {
//   try {
//     // Verificar se já existe um admin
//     const existingAdmin = await prisma.user.findFirst({
//       where: { role: 'ADMIN' }
//     });

//     if (existingAdmin) {
//       console.log('Admin já existe:', existingAdmin.email);
//       return;
//     }

//     // Criar admin inicial
//     const hashedPassword = await bcrypt.hash('admin123', 10);
    
//     const admin = await prisma.user.create({
//       data: {
//         email: 'admin@example.com',
//         password: hashedPassword,
//         name: 'Admin User',
//         role: 'ADMIN'
//       }
//     });

//     console.log('Admin criado com sucesso:', {
//       id: admin.id,
//       email: admin.email,
//       name: admin.name,
//       role: admin.role
//     });

//   } catch (error) {
//     console.error('Erro ao criar admin:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// createInitialAdmin();
