import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: createProductDto,
      });
    } catch (error) {
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = this.buildSearchFilter(search);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: this.buildPaginationResponse(page, limit, total),
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error) {
      throw new BadRequestException('Failed to update product');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.prisma.product.delete({
        where: { id },
      });
      return { message: `Product with ID ${id} has been deleted` };
    } catch (error) {
      throw new BadRequestException('Failed to delete product');
    }
  }

  async updateStock(id: number, quantity: number) {
    const product = await this.findOne(id);
    
    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        stock: product.stock - quantity,
      },
    });
  }

  private buildSearchFilter(search?: string): Prisma.ProductWhereInput {
    if (!search) return {};

    return {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    };
  }

  private buildPaginationResponse(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }
}
