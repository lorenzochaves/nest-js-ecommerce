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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Criar pedido do carrinho atual (usuário autenticado)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  // Listar pedidos do usuário
  @Get('my-orders')
  async getUserOrders(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.ordersService.getUserOrders(req.user.id, pageNum, limitNum);
  }

  // Obter pedido específico do usuário
  @Get('my-orders/:id')
  async getUserOrder(
    @Request() req,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.getOrderById(req.user.id, orderId);
  }

  // === ADMIN ROUTES ===

  // Listar todos os pedidos (admin only)
  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.ordersService.getAllOrders(pageNum, limitNum, status);
  }

  // Atualizar status do pedido (admin only)
  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  async updateOrderStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto);
  }

  // Obter estatísticas de pedidos (admin only)
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }
}
