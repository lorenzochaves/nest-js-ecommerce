import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to cart successfully',
    schema: {
      example: {
        id: 1,
        userId: 1,
        productId: 1,
        quantity: 2,
        product: {
          id: 1,
          name: 'MacBook Air M2',
          price: 1299.99,
          imageUrl: 'https://example.com/macbook-air.jpg'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user cart with all items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart retrieved successfully',
    schema: {
      example: {
        items: [
          {
            id: 1,
            userId: 1,
            productId: 1,
            quantity: 2,
            product: {
              id: 1,
              name: 'MacBook Air M2',
              price: 1299.99,
              imageUrl: 'https://example.com/macbook-air.jpg'
            }
          },
          {
            id: 2,
            userId: 1,
            productId: 2,
            quantity: 1,
            product: {
              id: 2,
              name: 'iPhone 15 Pro',
              price: 999.99,
              imageUrl: 'https://example.com/iphone-15-pro.jpg'
            }
          }
        ],
        total: 3599.97
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific cart item' })
  @ApiParam({ name: 'id', description: 'Cart item ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item found',
    schema: {
      example: {
        id: 1,
        userId: 1,
        productId: 1,
        quantity: 2,
        product: {
          id: 1,
          name: 'MacBook Air M2',
          price: 1299.99,
          imageUrl: 'https://example.com/macbook-air.jpg'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async getCartItem(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.getCartItem(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', description: 'Cart item ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart item updated successfully',
    schema: {
      example: {
        id: 1,
        userId: 1,
        productId: 1,
        quantity: 3,
        product: {
          id: 1,
          name: 'MacBook Air M2',
          price: 1299.99,
          imageUrl: 'https://example.com/macbook-air.jpg'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateCartItem(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(req.user.id, id, updateCartItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'id', description: 'Cart item ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Item removed from cart successfully',
    schema: {
      example: {
        message: 'Item removed from cart'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeCartItem(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeCartItem(req.user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart cleared successfully',
    schema: {
      example: {
        message: 'Cart cleared successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
