import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Criar pedido do carrinho atual
  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const { notes } = createOrderDto;

    // Buscar itens do carrinho
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verificar estoque de todos os produtos
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${item.product.name}". Available: ${item.product.stock}, Requested: ${item.quantity}`
        );
      }
    }

    // Calcular total
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Usar transação para garantir consistência
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Criar o pedido
      const order = await prisma.order.create({
        data: {
          userId,
          total: Number(total.toFixed(2)),
          status: 'PENDING',
        },
      });

      // 2. Criar os itens do pedido
      const orderItems = await Promise.all(
        cartItems.map(item =>
          prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            },
          })
        )
      );

      // 3. Reduzir estoque dos produtos
      await Promise.all(
        cartItems.map(item =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        )
      );

      // 4. Limpar carrinho
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      return { order, orderItems };
    });

    // Buscar pedido completo para retorno
    return this.getOrderById(userId, result.order.id);
  }

  // Listar pedidos do usuário
  async getUserOrders(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
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
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: { userId },
      }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Obter pedido específico
  async getOrderById(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
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
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Listar todos os pedidos (admin only)
  async getAllOrders(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
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
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Atualizar status do pedido (admin only)
  async updateOrderStatus(orderId: number, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status, notes } = updateOrderStatusDto;

    // Verificar se pedido existe
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    // Se cancelando pedido, devolver estoque
    if (status === OrderStatus.CANCELLED && existingOrder.status !== OrderStatus.CANCELLED) {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar itens do pedido
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId },
        });

        // Devolver estoque
        await Promise.all(
          orderItems.map(item =>
            prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            })
          )
        );

        // Atualizar status
        await prisma.order.update({
          where: { id: orderId },
          data: { status },
        });
      });
    } else {
      // Apenas atualizar status
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
    }

    // Retornar pedido atualizado
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Obter estatísticas (admin only)
  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED' },
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
}
