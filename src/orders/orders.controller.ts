import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new order from cart items' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    schema: {
      example: {
        id: 1,
        userId: 1,
        total: 3599.97,
        status: 'PENDING',
        notes: 'Please deliver to the main entrance, Lorenzo will be waiting',
        items: [
          {
            id: 1,
            orderId: 1,
            productId: 1,
            quantity: 2,
            price: 1299.99,
            product: {
              id: 1,
              name: 'MacBook Air M2',
              imageUrl: 'https://example.com/macbook-air.jpg'
            }
          },
          {
            id: 2,
            orderId: 1,
            productId: 2,
            quantity: 1,
            price: 999.99,
            product: {
              id: 2,
              name: 'iPhone 15 Pro',
              imageUrl: 'https://example.com/iphone-15-pro.jpg'
            }
          }
        ],
        createdAt: '2025-06-01T10:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Cart is empty or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'User orders retrieved successfully',
    schema: {
      example: {
        orders: [
          {
            id: 1,
            userId: 1,
            total: 3599.97,
            status: 'PENDING',
            notes: 'Please deliver to the main entrance, Lorenzo will be waiting',
            createdAt: '2025-06-01T10:30:00Z',
            items: [
              {
                id: 1,
                quantity: 2,
                price: 1299.99,
                product: { id: 1, name: 'MacBook Air M2' }
              }
            ]
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          pages: 1
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserOrders(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.ordersService.getUserOrders(req.user.id, pageNum, limitNum);
  }

  @Get('my-orders/:id')
  @ApiOperation({ summary: 'Get specific order by ID (user can only see their own orders)' })
  @ApiParam({ name: 'id', description: 'Order ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Order found',
    schema: {
      example: {
        id: 1,
        userId: 1,
        total: 3599.97,
        status: 'PENDING',
        notes: 'Please deliver to the main entrance, Lorenzo will be waiting',
        items: [
          {
            id: 1,
            orderId: 1,
            productId: 1,
            quantity: 2,
            price: 1299.99,
            product: {
              id: 1,
              name: 'MacBook Air M2',
              description: 'Latest MacBook Air with M2 chip',
              imageUrl: 'https://example.com/macbook-air.jpg'
            }
          }
        ],
        createdAt: '2025-06-01T10:30:00Z',
        updatedAt: '2025-06-01T10:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getUserOrder(
    @Request() req,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.getOrderById(req.user.id, orderId);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all orders with pagination and filtering (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status', example: 'PENDING' })
  @ApiResponse({ 
    status: 200, 
    description: 'All orders retrieved successfully',
    schema: {
      example: {
        orders: [
          {
            id: 1,
            userId: 1,
            total: 3599.97,
            status: 'PENDING',
            notes: 'Please deliver to the main entrance, Lorenzo will be waiting',
            createdAt: '2025-06-01T10:30:00Z',
            user: {
              id: 1,
              name: 'Lorenzo Chaves',
              email: 'lorenzo@rocket.com'
            },
            items: [
              {
                id: 1,
                quantity: 2,
                price: 1299.99,
                product: { id: 1, name: 'MacBook Air M2' }
              }
            ]
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.ordersService.getAllOrders(pageNum, limitNum, status);
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status updated successfully',
    schema: {
      example: {
        id: 1,
        userId: 1,
        total: 3599.97,
        status: 'COMPLETED',
        notes: 'Order delivered successfully to Lorenzo at the main office',
        updatedAt: '2025-06-01T14:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order statistics retrieved successfully',
    schema: {
      example: {
        totalOrders: 25,
        pendingOrders: 8,
        completedOrders: 15,
        cancelledOrders: 2,
        totalRevenue: 45599.50,
        averageOrderValue: 1823.98
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }
}