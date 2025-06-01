import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 1,
          email: 'lorenzo@rocket.com',
          name: 'Lorenzo Chaves',
          role: 'CLIENT'
        }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 1,
          email: 'lorenzo@rocket.com',
          name: 'Lorenzo Chaves',
          role: 'CLIENT'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new admin user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    const { email, password, name } = createAdminDto;
    return this.authService.createAdmin(email, password, name);
  }

  @Post('bootstrap-admin')
  @ApiOperation({ summary: 'Create first admin user (no auth required)' })
  @ApiResponse({ status: 201, description: 'First admin created successfully' })
  @ApiResponse({ status: 400, description: 'Admin already exists' })
  async bootstrapAdmin(@Body() createAdminDto: CreateAdminDto) {
    const { email, password, name } = createAdminDto;
    return this.authService.bootstrapFirstAdmin(email, password, name);
  }
}