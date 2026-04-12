import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { SagaValidateVouchersCommand } from './saga-validate-vouchers.command'
import type { IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'
import { VOUCHER_REPOSITORY } from '~/domain/repositories/voucher.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'

interface ShopVoucherResult {
  shopId: string
  voucherId: string
  discount: number
}

interface SzoneVoucherResult {
  voucherId: string
  discount: number
}

interface ValidateVouchersResult {
  success: boolean
  shopVoucherResults?: ShopVoucherResult[]
  szoneVoucherResult?: SzoneVoucherResult | null
  error?: string
}

@CommandHandler(SagaValidateVouchersCommand)
export class SagaValidateVouchersHandler
  implements ICommandHandler<SagaValidateVouchersCommand, ValidateVouchersResult>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
  ) {}

  async execute(command: SagaValidateVouchersCommand): Promise<ValidateVouchersResult> {
    const { userId, shopVouchers, szoneVoucher } = command

    // Không xóa RESERVED cũ, không tạo RESERVED mới
    // Tái sử dụng bản ghi RESERVED đã được tạo bởi calculatePrice
    // Chỉ đếm CONFIRMED khi check limit (bỏ qua RESERVED vì đó là của chính phiên checkout này)
    try {
      const shopVoucherResults: ShopVoucherResult[] = []

      // Validate shop vouchers
      for (const sv of shopVouchers || []) {
        const voucher = await this.voucherRepository.findByIdWithDetails(sv.voucherId)

        if (!voucher) {
          throw new Error(`Voucher ${sv.voucherId} không tồn tại`)
        }

        const now = new Date()
        if (now < voucher.startDate || now > voucher.endDate) {
          throw new Error(`Voucher ${voucher.code} đã hết hạn`)
        }

        // Check usage limit — chỉ đếm CONFIRMED (RESERVED là của phiên checkout hiện tại)
        const usageCount = await this.voucherUsageRepository.countByVoucherId(voucher.id, [
          'CONFIRMED',
        ])
        if (usageCount >= voucher.usageLimit) {
          throw new Error(`Voucher ${voucher.code} đã hết lượt sử dụng`)
        }

        // Check per user limit — chỉ đếm CONFIRMED
        const userUsageCount = await this.voucherUsageRepository.countByUserAndVoucher(
          userId,
          voucher.id,
          ['CONFIRMED'],
        )
        if (userUsageCount >= voucher.perUserLimit) {
          throw new Error(`Bạn đã hết lượt dùng voucher ${voucher.code}`)
        }

        if (sv.orderValue < voucher.minOrderValue) {
          throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu cho voucher ${voucher.code}`)
        }

        let discount = 0
        if (voucher.discountType === 'PERCENT') {
          discount = Math.floor((sv.orderValue * voucher.discountValue) / 100)
          if (voucher.maxDiscountValue && discount > voucher.maxDiscountValue) {
            discount = voucher.maxDiscountValue
          }
        } else {
          discount = voucher.discountValue
        }

        shopVoucherResults.push({
          shopId: voucher.shopId!,
          voucherId: voucher.id,
          discount,
        })
      }

      // Validate szone voucher
      let szoneVoucherResult: SzoneVoucherResult | null = null
      if (szoneVoucher) {
        const voucher = await this.voucherRepository.findByIdWithDetails(szoneVoucher.voucherId)

        if (!voucher) {
          throw new Error(`Szone voucher không tồn tại`)
        }

        const now = new Date()
        if (now < voucher.startDate || now > voucher.endDate) {
          throw new Error(`Szone voucher ${voucher.code} đã hết hạn`)
        }

        // Chỉ đếm CONFIRMED
        const usageCount = await this.voucherUsageRepository.countByVoucherId(voucher.id, [
          'CONFIRMED',
        ])
        if (usageCount >= voucher.usageLimit) {
          throw new Error(`Szone voucher ${voucher.code} đã hết lượt`)
        }

        // Chỉ đếm CONFIRMED
        const userUsageCount = await this.voucherUsageRepository.countByUserAndVoucher(
          userId,
          voucher.id,
          ['CONFIRMED'],
        )
        if (userUsageCount >= voucher.perUserLimit) {
          throw new Error(`Bạn đã hết lượt dùng szone voucher ${voucher.code}`)
        }

        if (szoneVoucher.orderValue < voucher.minOrderValue) {
          throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu cho szone voucher`)
        }

        let discount = 0
        if (voucher.discountType === 'PERCENT') {
          discount = Math.floor((szoneVoucher.orderValue * voucher.discountValue) / 100)
          if (voucher.maxDiscountValue && discount > voucher.maxDiscountValue) {
            discount = voucher.maxDiscountValue
          }
        } else {
          discount = voucher.discountValue
        }

        szoneVoucherResult = { voucherId: voucher.id, discount }
      }

      // Validate OK → giữ nguyên RESERVED records từ calculatePrice
      return { success: true, shopVoucherResults, szoneVoucherResult }
    } catch (error: any) {
      // Validate fail → xóa tất cả RESERVED của user
      await this.voucherUsageRepository.deleteAllReservedByUserId(userId)
      return { success: false, error: error.message }
    }
  }
}
