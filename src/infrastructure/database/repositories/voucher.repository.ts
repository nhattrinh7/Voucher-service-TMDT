import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VoucherMapper } from '~/infrastructure/database/mappers/voucher.mapper'
import { IVoucherRepository, VoucherWithUsedCount, VoucherWithDetails, PaginatedResult } from '~/domain/repositories/voucher.repository.interface'

@Injectable()
export class VoucherRepository implements IVoucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Voucher | null> {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } })
    if (!voucher) return null

    return VoucherMapper.toDomain(voucher)
  }

  async findByIdWithDetails(id: string): Promise<VoucherWithDetails | null> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id, isDeleted: false },
      include: {
        voucherProducts: true,
        voucherCategories: true,
        _count: {
          select: {
            voucherUsages: true,
          },
        },
      },
    })
    if (!voucher) return null

    const voucherDomain = VoucherMapper.toDomain(voucher)
    return {
      ...voucherDomain,
      usedCount: voucher._count.voucherUsages,
      productIds: voucher.voucherProducts.map((vp) => vp.productId),
      categoryIds: voucher.voucherCategories.map((vc) => vc.categoryId),
    } as VoucherWithDetails
  }

  async findByShopId(shopId: string): Promise<VoucherWithUsedCount[]> {
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        shopId,
        isDeleted: false,
      },
      include: {
        _count: {
          select: {
            voucherUsages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return vouchers.map(voucher => {
      const voucherDomain = VoucherMapper.toDomain(voucher)
      return {
        id: voucherDomain.id,
        shopId: voucherDomain.shopId,
        code: voucherDomain.code,
        name: voucherDomain.name,
        description: voucherDomain.description,
        discountType: voucherDomain.discountType,
        discountValue: voucherDomain.discountValue,
        startDate: voucherDomain.startDate,
        endDate: voucherDomain.endDate,
        usageLimit: voucherDomain.usageLimit,
        perUserLimit: voucherDomain.perUserLimit,
        scope: voucherDomain.scope,
        isDeleted: voucherDomain.isDeleted,
        deletedBy: voucherDomain.deletedBy,
        deletedAt: voucherDomain.deletedAt,
        createdAt: voucherDomain.createdAt,
        updatedAt: voucherDomain.updatedAt,
        usedCount: voucher._count.voucherUsages,
      } as VoucherWithUsedCount
    })
  }

  async create(voucher: Voucher): Promise<Voucher> {
    const createdVoucher = await this.prisma.voucher.create({
      data: VoucherMapper.toPersistence(voucher),
    })

    return VoucherMapper.toDomain(createdVoucher)
  }

  async update(voucher: Voucher): Promise<Voucher> {
    const updatedVoucher = await this.prisma.voucher.update({
      where: { id: voucher.id },
      data: VoucherMapper.toPersistence(voucher),
    })

    return VoucherMapper.toDomain(updatedVoucher)
  }

  async createVoucherProducts(voucherId: string, productIds: string[]): Promise<void> {
    await this.prisma.voucherProduct.createMany({
      data: productIds.map((productId) => ({
        voucherId,
        productId,
      })),
    })
  }

  async createVoucherCategories(voucherId: string, categoryIds: string[]): Promise<void> {
    await this.prisma.voucherCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        voucherId,
        categoryId,
      })),
    })
  }

  async deleteVoucherProducts(voucherId: string): Promise<void> {
    await this.prisma.voucherProduct.deleteMany({
      where: { voucherId },
    })
  }

  async deleteVoucherCategories(voucherId: string): Promise<void> {
    await this.prisma.voucherCategory.deleteMany({
      where: { voucherId },
    })
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.voucher.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    })
  }
 
  async findSzoneVouchersPaginated(
    page: number,
    limit: number,
    status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED',
    search?: string,
  ): Promise<PaginatedResult<VoucherWithUsedCount>> {
    const skip = (page - 1) * limit
    const now = new Date()

    // Build status filter based on startDate and endDate
    const getStatusFilter = () => {
      switch (status) {
        case 'UPCOMING':
          return { startDate: { gt: now } } // Chưa diễn ra
        case 'ACTIVE':
          return { 
            startDate: { lte: now }, 
            endDate: { gte: now } 
          } // Đang diễn ra
        case 'EXPIRED':
          return { endDate: { lt: now } } // Đã kết thúc
        default:
          return {}
      }
    }

    const whereCondition = {
      shopId: null, // Szone vouchers không thuộc shop nào
      isDeleted: false,
      ...getStatusFilter(),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [vouchers, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: {
              voucherUsages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.voucher.count({ where: whereCondition }),
    ])

    const data = vouchers.map(voucher => {
      const voucherDomain = VoucherMapper.toDomain(voucher)
      return {
        id: voucherDomain.id,
        shopId: voucherDomain.shopId,
        code: voucherDomain.code,
        name: voucherDomain.name,
        description: voucherDomain.description,
        discountType: voucherDomain.discountType,
        discountValue: voucherDomain.discountValue,
        startDate: voucherDomain.startDate,
        endDate: voucherDomain.endDate,
        usageLimit: voucherDomain.usageLimit,
        perUserLimit: voucherDomain.perUserLimit,
        scope: voucherDomain.scope,
        isDeleted: voucherDomain.isDeleted,
        deletedBy: voucherDomain.deletedBy,
        deletedAt: voucherDomain.deletedAt,
        createdAt: voucherDomain.createdAt,
        updatedAt: voucherDomain.updatedAt,
        usedCount: voucher._count.voucherUsages,
      } as VoucherWithUsedCount
    })

    return {
      vouchers: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
