import { Voucher as PrismaVoucher } from '@prisma/client'
import { Voucher } from '~/domain/entities/voucher.entity'

export class VoucherMapper {
  static toDomain(prismaVoucher: PrismaVoucher): Voucher {
    return new Voucher(
      prismaVoucher.id,
      prismaVoucher.shopId,
      prismaVoucher.code,
      prismaVoucher.name,
      prismaVoucher.description,
      prismaVoucher.discountType,
      prismaVoucher.discountValue,
      prismaVoucher.minOrderValue,
      prismaVoucher.maxDiscountValue,
      prismaVoucher.startDate,
      prismaVoucher.endDate,
      prismaVoucher.usageLimit,
      prismaVoucher.perUserLimit,
      prismaVoucher.scope,
      prismaVoucher.isDeleted,
      prismaVoucher.deletedBy,
      prismaVoucher.deletedAt,
      prismaVoucher.createdAt,
      prismaVoucher.updatedAt,
    )
  }

  static toPersistence(voucher: Voucher): PrismaVoucher {
    return {
      id: voucher.id,
      shopId: voucher.shopId,
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue,
      maxDiscountValue: voucher.maxDiscountValue,
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      usageLimit: voucher.usageLimit,
      perUserLimit: voucher.perUserLimit,
      scope: voucher.scope,
      isDeleted: voucher.isDeleted,
      deletedBy: voucher.deletedBy,
      deletedAt: voucher.deletedAt,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    }
  }
}
