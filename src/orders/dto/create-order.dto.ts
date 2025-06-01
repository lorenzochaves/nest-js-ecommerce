import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Optional notes for the order',
    example: 'Please deliver to the main entrance, Lorenzo will be waiting',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
