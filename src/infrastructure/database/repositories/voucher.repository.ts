import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VoucherMapper } from '~/infrastructure/database/mappers/voucher.mapper'
import { IVoucherRepository, VoucherWithUsedCount } from '~/domain/repositories/voucher.repository.interface'

@Injectable()
export class VoucherRepository implements IVoucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Voucher | null> {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } })
    if (!voucher) return null

    return VoucherMapper.toDomain(voucher)
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

  async createVoucherProducts(voucherId: string, productIds: string[]): Promise<void> {
    await this.prisma.voucherProduct.createMany({
      data: productIds.map((productId) => ({
        voucherId,
        productId,
      })),
    })
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.voucher.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    })
  }
}
