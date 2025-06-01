import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Obter perfil do usuário logado
  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  // Atualizar perfil do usuário logado
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  // === ADMIN ROUTES ===

  // Listar todos os usuários (admin only)
  @Get()
  @UseGuards(AdminGuard)
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getAllUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  // Obter usuário por ID (admin only)
  @Get(':id')
  @UseGuards(AdminGuard)
  async getUserById(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.getUserById(userId);
  }

  // Atualizar role do usuário (admin only)
  @Patch(':id/role')
  @UseGuards(AdminGuard)
  async updateUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(userId, updateUserRoleDto);
  }

  // Deletar usuário (admin only)
  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) userId: number) {
    await this.usersService.deleteUser(userId);
  }

  // Obter estatísticas de usuários (admin only)
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getUserStats() {
    return this.usersService.getUserStats();
  }
}
