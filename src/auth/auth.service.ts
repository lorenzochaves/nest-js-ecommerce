import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const DEFAULT_USER_ROLE = 'CLIENT';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    await this.checkEmailExists(email);
    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: DEFAULT_USER_ROLE,
      },
    });

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.findUserByEmail(email);
    await this.validatePassword(password, user.password);

    return this.generateAuthResponse(user);
  }

  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async createAdmin(email: string, password: string, name: string) {
    await this.checkEmailExists(email);
    const hashedPassword = await this.hashPassword(password);

    const admin = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    return {
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  // métodos privados pra ficar mais organizado e facilitar testes unitários futuramente...
  private async checkEmailExists(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  private async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<void> {
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private generateAuthResponse(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}