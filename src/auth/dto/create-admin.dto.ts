import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'lorenzo@rocket.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin password (minimum 6 characters)',
    example: 'adminSecure123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Admin full name',
    example: 'Lorenzo Chaves',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
