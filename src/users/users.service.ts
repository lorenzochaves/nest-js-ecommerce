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

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.findUserById(userId);
    return this.selectUserFields(user);
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const { name, email, password } = updateProfileDto;
    const existingUser = await this.findUserById(userId);

    if (email && email !== existingUser.email) {
      await this.checkEmailAvailability(email);
    }

    const updateData = await this.buildUpdateData({ name, email, password });

    return await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

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
      pagination: this.buildPaginationResponse(page, limit, total),
    };
  }

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

  async updateUserRole(userId: number, updateUserRoleDto: UpdateUserRoleDto) {
    const { role } = updateUserRoleDto;
    const existingUser = await this.findUserById(userId);

    await this.validateAdminRoleChange(existingUser, role);

    return await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async deleteUser(userId: number) {
    const existingUser = await this.findUserById(userId);
    await this.validateAdminDeletion(existingUser);

    await this.prisma.$transaction(async (prisma) => {
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      await prisma.user.delete({
        where: { id: userId },
      });
    });

    return { message: 'User deleted successfully' };
  }

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

  private async findUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private selectUserFields(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private async checkEmailAvailability(email: string) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      throw new ConflictException('Email already in use');
    }
  }

  private async buildUpdateData(data: { name?: string; email?: string; password?: string }) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    }

    return updateData;
  }

  private buildPaginationResponse(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  private async validateAdminRoleChange(existingUser: any, newRole: string) {
    if (existingUser.role === 'ADMIN' && newRole === 'CLIENT') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin user');
      }
    }
  }

  private async validateAdminDeletion(existingUser: any) {
    if (existingUser.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }
  }
}
