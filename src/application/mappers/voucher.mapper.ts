import { Voucher } from '~/domain/entities/voucher.entity'
import { VoucherDto } from '~/presentation/dtos/voucher.dto'

export class VoucherMapper {
  static toVoucherResponse(voucher: Voucher): VoucherDto {
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