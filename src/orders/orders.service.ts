import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const cartItems = await this.getCartItemsOrThrow(userId);
    await this.validateStockForAllItems(cartItems);
    
    const total = this.calculateTotal(cartItems);

    const result = await this.prisma.$transaction(async (prisma) => {
      const order = await this.createOrderRecord(prisma, userId, total);
      await this.createOrderItems(prisma, order.id, cartItems);
      await this.updateProductStock(prisma, cartItems, 'decrement');
      await this.clearUserCart(prisma, userId);
      
      return order;
    });

    return this.getOrderById(userId, result.id);
  }

  async getUserOrders(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: this.getOrderIncludeOptions(),
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return this.buildPaginatedResponse(orders, page, limit, total);
  }

  async getOrderById(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: this.getDetailedOrderInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getAllOrders(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: this.getAdminOrderInclude(),
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return this.buildPaginatedResponse(orders, page, limit, total);
  }

  async updateOrderStatus(orderId: number, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status } = updateOrderStatusDto;
    const existingOrder = await this.findOrderOrThrow(orderId);

    if (this.shouldRestoreStock(status, existingOrder.status)) {
      await this.cancelOrderAndRestoreStock(orderId);
    } else {
      await this.updateOrderStatusOnly(orderId, status);
    }

    return this.getOrderByIdAdmin(orderId);
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }

  // Métodos privados para reutilização
  private async getCartItemsOrThrow(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return cartItems;
  }

  private async validateStockForAllItems(cartItems: any[]) {
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}, Requested: ${item.quantity}`
        );
      }
    }
  }

  private calculateTotal(cartItems: any[]): number {
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    return Number(total.toFixed(2));
  }

  private async createOrderRecord(prisma: any, userId: number, total: number) {
    return prisma.order.create({
      data: {
        userId,
        total,
        status: OrderStatus.PENDING,
      },
    });
  }

  private async createOrderItems(prisma: any, orderId: number, cartItems: any[]) {
    return Promise.all(
      cartItems.map(item =>
        prisma.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        })
      )
    );
  }

  private async updateProductStock(prisma: any, cartItems: any[], operation: 'increment' | 'decrement') {
    return Promise.all(
      cartItems.map(item =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              [operation]: item.quantity,
            },
          },
        })
      )
    );
  }

  private async clearUserCart(prisma: any, userId: number) {
    return prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  private async findOrderOrThrow(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private shouldRestoreStock(newStatus: string, currentStatus: string): boolean {
    return newStatus === OrderStatus.CANCELLED && currentStatus !== OrderStatus.CANCELLED;
  }

  private async cancelOrderAndRestoreStock(orderId: number) {
    await this.prisma.$transaction(async (prisma) => {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      });

      await this.updateProductStock(prisma, orderItems, 'increment');
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }

  private async updateOrderStatusOnly(orderId: number, status: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  private async getOrderByIdAdmin(orderId: number) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.getDetailedOrderInclude(),
    });
  }

  private getOrderIncludeOptions() {
    return {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    };
  }

  private getDetailedOrderInclude() {
    return {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }

  private getAdminOrderInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    };
  }

  private buildPaginatedResponse(data: any[], page: number, limit: number, total: number) {
    return {
      orders: data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}