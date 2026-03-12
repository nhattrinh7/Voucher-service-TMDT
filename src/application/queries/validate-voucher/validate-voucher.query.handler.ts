import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ValidateVoucherQuery } from './validate-voucher.query'
import type { IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'
import { VOUCHER_REPOSITORY } from '~/domain/repositories/voucher.repository.interface'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { RabbitMQPublisher } from '~/infrastructure/messaging/publishers/rabbitmq.publisher'

interface ValidateVoucherResponse {
  valid: boolean
  voucher?: {
    id: string
    code: string
    type: 'SHOP' | 'SZONE'
    discountType: 'PERCENT' | 'FIXED'
    discountValue: number
    maxDiscountValue?: number
    minOrderValue: number
    scope: 'ALL' | 'CATEGORY' | 'PRODUCT'
    applicableProductIds?: string[]  // Cần để tính applicableSubtotal
    applicableCategoryIds?: string[] // Cần để tính applicableSubtotal
    shopId?: string
  }
  error?: string
}

// Chỉ validate tính đúng đắn của voucher, check xem có áp mã được không và trả về thông tin voucher nếu voucher valid thôi
// không tính toán discount hay gì hết
@QueryHandler(ValidateVoucherQuery)
export class ValidateVoucherHandler implements IQueryHandler<ValidateVoucherQuery, ValidateVoucherResponse> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: RabbitMQPublisher,
  ) {}

  async execute(query: ValidateVoucherQuery): Promise<ValidateVoucherResponse> {
    const { voucherId, userId, orderValue, items } = query

    // 1. Lấy voucher
    const voucher = await this.voucherRepository.findById(voucherId)
    
    if (!voucher) {
      return {
        valid: false,
        error: 'Voucher không tồn tại',
      }
    }

    // 2. Check voucher còn hạn không
    const now = new Date()
    if (now < voucher.startDate || now > voucher.endDate) {
      return {
        valid: false,
        error: 'Voucher đã hết hạn hoặc chưa có hiệu lực',
      }
    }

    // 3. Check minOrderValue
    if (orderValue < voucher.minOrderValue) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${voucher.minOrderValue}đ`,
      }
    }

    // 4. Check usage limits
    const totalUsages = await this.voucherUsageRepository.countByVoucherId(voucherId, ['RESERVED', 'CONFIRMED'])
    // Loại trừ số lượng RESERVED của chính User hiện tại ra khỏi logic check vượt giới hạn tổng
    const userReserved = await this.voucherUsageRepository.countByUserAndVoucher(userId, voucherId, ['RESERVED'])

    if (totalUsages - userReserved >= voucher.usageLimit) {
      return {
        valid: false,
        error: 'Voucher đã hết lượt sử dụng',
      }
    }

    // 5. Check per user limit
    // Chỉ kiểm tra số lượt đã thực dùng (CONFIRMED) của User
    const userConfirmed = await this.voucherUsageRepository.countByUserAndVoucher(userId, voucherId, ['CONFIRMED'])
    if (userConfirmed >= voucher.perUserLimit) {
      return {
        valid: false,
        error: 'Bạn đã hết lượt sử dụng voucher này',
      }
    }

    // 6. Check scope nếu có items
    if (items && items.length > 0) {
      const isEligible = await this.checkScopeEligibility(voucher, items)
      if (!isEligible) {
        return {
          valid: false,
          error: 'Đơn hàng không đủ điều kiện áp dụng voucher này',
        }
      }
    }

    // 7. Build response với applicableProductIds/CategoryIds để order-service tính applicableSubtotal
    const voucherProducts = voucher.scope === 'PRODUCT' 
      ? await this.voucherRepository.getVoucherProductIds(voucherId)
      : undefined

    // VoucherCategory lưu categoryId cấp 1, nhưng product.categoryId là cấp lá
    // Cần expand level1 → tất cả descendant IDs để order-service so sánh trực tiếp
    let voucherCategories: string[] | undefined = undefined
    if (voucher.scope === 'CATEGORY') {
      const level1CategoryIds = await this.voucherRepository.getVoucherCategoryIds(voucherId)
      voucherCategories = await this.messagePublisher.sendToCatalogService<
        { categoryIds: string[] },
        string[]
      >('get.descendant.category.ids', { categoryIds: level1CategoryIds })
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        type: voucher.shopId ? 'SHOP' : 'SZONE',
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountValue: voucher.maxDiscountValue ?? undefined,
        minOrderValue: voucher.minOrderValue,
        scope: voucher.scope,
        applicableProductIds: voucherProducts,
        applicableCategoryIds: voucherCategories,
        shopId: voucher.shopId ?? undefined,
      },
    }
  }

  // Check xem voucher có áp dụng được cho items trong đơn hàng không
  private async checkScopeEligibility(voucher: any, items: Array<{ productId: string; categoryId: string }>): Promise<boolean> {
    if (voucher.scope === 'ALL') {
      return true
    }

    if (voucher.scope === 'PRODUCT') {
      const productIds = await this.voucherRepository.getVoucherProductIds(voucher.id)
      return items.some(item => productIds.includes(item.productId))
    }

    if (voucher.scope === 'CATEGORY') {
      // VoucherCategory lưu categoryId cấp 1, expand ra tất cả con/cháu để so sánh với leaf categoryId
      const level1CategoryIds = await this.voucherRepository.getVoucherCategoryIds(voucher.id)
      const allDescendantIds = await this.messagePublisher.sendToCatalogService<
        { categoryIds: string[] },
        string[]
      >('get.descendant.category.ids', { categoryIds: level1CategoryIds })
      return items.some(item => allDescendantIds.includes(item.categoryId))
    }

    return false
  }
}
