import { IsNumber, IsPositive, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}
