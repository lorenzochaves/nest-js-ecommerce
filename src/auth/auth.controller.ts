import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    const { email, password, name } = createAdminDto;
    return this.authService.createAdmin(email, password, name);
  }

  @Post('bootstrap-admin')
  async bootstrapAdmin(@Body() createAdminDto: CreateAdminDto) {
    const { email, password, name } = createAdminDto;
    return this.authService.bootstrapFirstAdmin(email, password, name);
  }
}
