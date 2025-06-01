import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new product (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully',
    schema: {
      example: {
        id: 1,
        name: 'MacBook Air M2',
        description: 'Latest MacBook Air with M2 chip, perfect for developers',
        price: 1299.99,
        stock: 25,
        imageUrl: 'https://example.com/macbook-air.jpg'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term', example: 'MacBook' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products retrieved successfully',
    schema: {
      example: {
        products: [
          {
            id: 1,
            name: 'MacBook Air M2',
            description: 'Latest MacBook Air with M2 chip',
            price: 1299.99,
            stock: 25,
            imageUrl: 'https://example.com/macbook-air.jpg'
          },
          {
            id: 2,
            name: 'iPhone 15 Pro',
            description: 'Professional iPhone with titanium design',
            price: 999.99,
            stock: 50,
            imageUrl: 'https://example.com/iphone-15-pro.jpg'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          pages: 5
        }
      }
    }
  })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.productsService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Product found',
    schema: {
      example: {
        id: 1,
        name: 'MacBook Air M2',
        description: 'Latest MacBook Air with M2 chip, perfect for developers',
        price: 1299.99,
        stock: 25,
        imageUrl: 'https://example.com/macbook-air.jpg'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Product updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'MacBook Air M2 - Updated',
        description: 'Latest MacBook Air with M2 chip, now with more storage',
        price: 1399.99,
        stock: 30,
        imageUrl: 'https://example.com/macbook-air-updated.jpg'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Product deleted successfully',
    schema: {
      example: {
        message: 'Product with ID 1 has been deleted'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product stock (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Stock updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'MacBook Air M2',
        description: 'Latest MacBook Air with M2 chip',
        price: 1299.99,
        stock: 20,
        imageUrl: 'https://example.com/macbook-air.jpg'
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.productsService.updateStock(id, quantity);
  }
}
