import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Obter perfil do usuário logado
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Atualizar perfil do usuário
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const { name, email, password } = updateProfileDto;

    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Se está alterando email, verificar se já existe
    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Atualizar usuário
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return updatedUser;
  }

  // Listar todos os usuários (admin only)
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Obter usuário por ID (admin only)
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            orders: true,
            cartItems: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Atualizar role do usuário (admin only)
  async updateUserRole(userId: number, updateUserRoleDto: UpdateUserRoleDto) {
    const { role } = updateUserRoleDto;

    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Não permitir que o último admin seja rebaixado
    if (existingUser.role === 'ADMIN' && role === 'CLIENT') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin user');
      }
    }

    // Atualizar role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return updatedUser;
  }

  // Deletar usuário (admin only)
  async deleteUser(userId: number) {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Não permitir deletar o último admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    // Usar transação para deletar usuário e dados relacionados
    await this.prisma.$transaction(async (prisma) => {
      // Deletar itens do carrinho
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      // Note: Orders são mantidos para histórico, apenas desvinculados
      // Se quiser deletar orders também, descomente a linha abaixo:
      // await prisma.order.deleteMany({ where: { userId } });

      // Deletar usuário
      await prisma.user.delete({
        where: { id: userId },
      });
    });

    return { message: 'User deleted successfully' };
  }

  // Obter estatísticas de usuários (admin only)
  async getUserStats() {
    const [totalUsers, adminUsers, clientUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
    ]);

    return {
      totalUsers,
      adminUsers,
      clientUsers,
    };
  }
}
