import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VoucherMapper } from '~/infrastructure/database/mappers/voucher.mapper'
import {
  IVoucherRepository,
  VoucherWithUsedCount,
  VoucherWithDetails,
  PaginatedResult,
  EligibleVoucher,
} from '~/domain/repositories/voucher.repository.interface'

@Injectable()
export class VoucherRepository implements IVoucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Voucher | null> {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } })
    if (!voucher) return null

    return VoucherMapper.toDomain(voucher)
  }

  async findByIds(ids: string[]): Promise<Voucher[]> {
    const vouchers = await this.prisma.voucher.findMany({
      where: { id: { in: ids } },
    })
    return vouchers.map(v => VoucherMapper.toDomain(v))
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
      productIds: voucher.voucherProducts.map(vp => vp.productId),
      categoryIds: voucher.voucherCategories.map(vc => vc.categoryId),
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

  async create(voucher: Voucher, tx?: any): Promise<Voucher> {
    const client = tx ?? this.prisma
    const createdVoucher = await client.voucher.create({
      data: VoucherMapper.toPersistence(voucher),
    })

    return VoucherMapper.toDomain(createdVoucher)
  }

  async update(voucher: Voucher, tx?: any): Promise<Voucher> {
    const client = tx ?? this.prisma
    const updatedVoucher = await client.voucher.update({
      where: { id: voucher.id },
      data: VoucherMapper.toPersistence(voucher),
    })

    return VoucherMapper.toDomain(updatedVoucher)
  }

  async createVoucherProducts(voucherId: string, productIds: string[], tx?: any): Promise<void> {
    const client = tx ?? this.prisma
    await client.voucherProduct.createMany({
      data: productIds.map(productId => ({
        voucherId,
        productId,
      })),
    })
  }

  async createVoucherCategories(voucherId: string, categoryIds: string[], tx?: any): Promise<void> {
    const client = tx ?? this.prisma
    await client.voucherCategory.createMany({
      data: categoryIds.map(categoryId => ({
        voucherId,
        categoryId,
      })),
    })
  }

  async deleteVoucherProducts(voucherId: string, tx?: any): Promise<void> {
    const client = tx ?? this.prisma
    await client.voucherProduct.deleteMany({
      where: { voucherId },
    })
  }

  async deleteVoucherCategories(voucherId: string, tx?: any): Promise<void> {
    const client = tx ?? this.prisma
    await client.voucherCategory.deleteMany({
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
            endDate: { gte: now },
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

  async findEligibleShopVouchers(
    shopId: string,
    userId: string,
  ): Promise<Array<EligibleVoucher & { voucherProducts: { productId: string }[] }>> {
    const now = new Date()

    // Lấy tất cả voucher của shop còn hạn, chưa xóa
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        shopId,
        isDeleted: false,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        voucherProducts: true, // Cần để handler filter scope PRODUCT
        voucherUsages: {
          where: {
            status: {
              in: ['RESERVED', 'CONFIRMED'],
            },
          },
        },
      },
    })

    const eligibleVouchers: Array<EligibleVoucher & { voucherProducts: { productId: string }[] }> =
      []

    for (const voucher of vouchers) {
      // Kiểm tra usageLimit
      const totalUsage = voucher.voucherUsages.length
      if (totalUsage >= voucher.usageLimit) {
        continue
      }

      // Kiểm tra perUserLimit
      const userUsage = voucher.voucherUsages.filter(vu => vu.userId === userId).length
      if (userUsage >= voucher.perUserLimit) {
        continue
      }

      // Voucher còn lượt dùng - thêm vào danh sách
      // Không filter theo scope/minOrderValue ở đây - handler sẽ filter
      eligibleVouchers.push({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        maxDiscountValue: voucher.maxDiscountValue,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        scope: voucher.scope,
        usageLimit: voucher.usageLimit,
        remainingUsage: voucher.usageLimit - totalUsage,
        userRemainingUsage: voucher.perUserLimit - userUsage,
        voucherProducts: voucher.voucherProducts.map(vp => ({ productId: vp.productId })),
      })
    }

    return eligibleVouchers
  }

  async findEligibleSzoneVouchers(
    userId: string,
    orderValue: number,
  ): Promise<Array<EligibleVoucher & { voucherCategories: { categoryId: string }[] }>> {
    const now = new Date()

    // Lấy tất cả voucher sàn (shopId = null) còn hạn, chưa xóa
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        shopId: null, // Voucher sàn
        isDeleted: false,
        startDate: { lte: now },
        endDate: { gte: now },
        minOrderValue: { lte: orderValue }, // Đơn hàng đạt tối thiểu
      },
      include: {
        voucherCategories: true, // Cần để handler filter scope CATEGORY
        voucherUsages: {
          where: {
            status: {
              in: ['RESERVED', 'CONFIRMED'],
            },
          },
        },
      },
    })

    const eligibleVouchers: Array<
      EligibleVoucher & { voucherCategories: { categoryId: string }[] }
    > = []

    for (const voucher of vouchers) {
      // Kiểm tra usageLimit
      const totalUsage = voucher.voucherUsages.length
      if (totalUsage >= voucher.usageLimit) {
        continue
      }

      // Kiểm tra perUserLimit
      const userUsage = voucher.voucherUsages.filter(vu => vu.userId === userId).length
      if (userUsage >= voucher.perUserLimit) {
        continue
      }

      // Voucher eligible - thêm vào danh sách
      // Không filter theo scope ở đây - handler sẽ filter
      eligibleVouchers.push({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        maxDiscountValue: voucher.maxDiscountValue,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        scope: voucher.scope,
        usageLimit: voucher.usageLimit,
        remainingUsage: voucher.usageLimit - totalUsage,
        userRemainingUsage: voucher.perUserLimit - userUsage,
        voucherCategories: voucher.voucherCategories.map(vc => ({ categoryId: vc.categoryId })),
      })
    }

    return eligibleVouchers
  }

  async getVoucherProductIds(voucherId: string): Promise<string[]> {
    const voucherProducts = await this.prisma.voucherProduct.findMany({
      where: { voucherId },
      select: { productId: true },
    })
    return voucherProducts.map(vp => vp.productId)
  }

  async getVoucherCategoryIds(voucherId: string): Promise<string[]> {
    const voucherCategories = await this.prisma.voucherCategory.findMany({
      where: { voucherId },
      select: { categoryId: true },
    })
    return voucherCategories.map(vc => vc.categoryId)
  }
}
