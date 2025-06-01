import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsUrl } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Mac Book Air M4 Pro',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest MacBook with amazing features',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Product price in decimal format',
    example: 999.99,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
  })
  @IsNumber()
  @IsPositive()
  stock: number;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://cdn.tugatech.com.pt/imagens/artigos/2024/11/15/tugatech-4771-24891.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;
}