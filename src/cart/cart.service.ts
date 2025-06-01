import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    const product = await this.findProductOrThrow(productId);
    await this.validateStock(product, quantity);

    const existingCartItem = await this.findExistingCartItem(userId, productId);

    if (existingCartItem) {
      return this.updateExistingCartItem(existingCartItem, quantity, product);
    }

    return this.createNewCartItem(userId, productId, quantity);
  }

  async getCart(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: this.getProductSelect() },
      orderBy: { id: 'desc' },
    });

    return this.buildCartSummary(cartItems);
  }

  async updateCartItem(userId: number, itemId: number, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    const cartItem = await this.findCartItemOrThrow(userId, itemId);
    await this.validateStock(cartItem.product, quantity);

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: this.getProductSelect() },
    });
  }

  async removeCartItem(userId: number, itemId: number) {
    await this.findCartItemOrThrow(userId, itemId);

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: 'Item removed from cart successfully' };
  }

  async clearCart(userId: number) {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return { message: 'Cart cleared successfully' };
  }

  async getCartItem(userId: number, itemId: number) {
    return this.findCartItemOrThrow(userId, itemId);
  }

  // Métodos privados para reutilização
  private async findProductOrThrow(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async validateStock(product: any, requestedQuantity: number) {
    if (product.stock < requestedQuantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${requestedQuantity}`
      );
    }
  }

  private async findExistingCartItem(userId: number, productId: number) {
    return this.prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
  }

  private async findCartItemOrThrow(userId: number, itemId: number) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return cartItem;
  }

  private async updateExistingCartItem(existingItem: any, additionalQuantity: number, product: any) {
    const newQuantity = existingItem.quantity + additionalQuantity;
    await this.validateStock(product, newQuantity);

    return this.prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
      include: { product: this.getProductSelect() },
    });
  }

  private async createNewCartItem(userId: number, productId: number, quantity: number) {
    return this.prisma.cartItem.create({
      data: { userId, productId, quantity },
      include: { product: this.getProductSelect() },
    });
  }

  private getProductSelect() {
    return {
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
      },
    };
  }

  private buildCartSummary(cartItems: any[]) {
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: cartItems,
      summary: {
        itemCount,
        total: Number(total.toFixed(2)),
      },
    };
  }
}