import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ValidateVouchersBatchQuery } from './validate-vouchers-batch.query'
import type { IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'
import { VOUCHER_REPOSITORY } from '~/domain/repositories/voucher.repository.interface'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { RabbitMQPublisher } from '~/infrastructure/messaging/publishers/rabbitmq.publisher'

interface ValidateVoucherResult {
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
    applicableProductIds?: string[]
    applicableCategoryIds?: string[]
    shopId?: string
  }
  error?: string
}

interface ValidateVouchersBatchResponse {
  results: Record<string, ValidateVoucherResult>
}

// Batch validate nhiều vouchers cùng lúc, tối ưu DB queries
// Logic validate giống hệt ValidateVoucherHandler, chỉ khác là batch fetching
@QueryHandler(ValidateVouchersBatchQuery)
export class ValidateVouchersBatchHandler implements IQueryHandler<ValidateVouchersBatchQuery, ValidateVouchersBatchResponse> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: RabbitMQPublisher,
  ) {}

  async execute(query: ValidateVouchersBatchQuery): Promise<ValidateVouchersBatchResponse> {
    const { userId, vouchers: voucherRequests } = query

    const voucherIds = voucherRequests.map(v => v.voucherId)

    // 1. Batch fetch: lấy tất cả vouchers, total usages, user reserved, user confirmed cùng lúc
    const [allVouchers, totalUsagesMap, userReservedMap, userConfirmedMap] = await Promise.all([
      this.voucherRepository.findByIds(voucherIds),
      this.voucherUsageRepository.countByVoucherIds(voucherIds, ['RESERVED', 'CONFIRMED']),
      this.voucherUsageRepository.countByUserAndVoucherIds(userId, voucherIds, ['RESERVED']),
      this.voucherUsageRepository.countByUserAndVoucherIds(userId, voucherIds, ['CONFIRMED']),
    ])

    const vouchersMap = new Map(allVouchers.map(v => [v.id, v]))

    // 2. Validate từng voucher sử dụng data đã lấy batch
    const results: Record<string, ValidateVoucherResult> = {}

    for (const request of voucherRequests) {
      const { voucherId, orderValue, items } = request
      const voucher = vouchersMap.get(voucherId)

      // Check voucher tồn tại
      if (!voucher) {
        results[voucherId] = { valid: false, error: 'Voucher không tồn tại' }
        continue
      }

      // Check voucher còn hạn
      const now = new Date()
      if (now < voucher.startDate || now > voucher.endDate) {
        results[voucherId] = { valid: false, error: 'Voucher đã hết hạn hoặc chưa có hiệu lực' }
        continue
      }

      // Check minOrderValue
      if (orderValue < voucher.minOrderValue) {
        results[voucherId] = { valid: false, error: `Đơn hàng tối thiểu ${voucher.minOrderValue}đ` }
        continue
      }

      // Check usage limits (dùng data batch)
      const totalUsages = totalUsagesMap.get(voucherId) || 0
      const userReserved = userReservedMap.get(voucherId) || 0
      
      // Tổng lượng chiếm chỗ của mọi người TRỪ số ghế user này đang giữ
      if (totalUsages - userReserved >= voucher.usageLimit) {
        results[voucherId] = { valid: false, error: 'Voucher đã hết lượt sử dụng' }
        continue
      }

      // Check per user limit (dùng data batch)
      const userConfirmed = userConfirmedMap.get(voucherId) || 0
      if (userConfirmed >= voucher.perUserLimit) {
        results[voucherId] = { valid: false, error: 'Bạn đã hết lượt sử dụng voucher này' }
        continue
      }

      // Check scope nếu có items
      if (items && items.length > 0) {
        const isEligible = await this.checkScopeEligibility(voucher, items)
        if (!isEligible) {
          results[voucherId] = { valid: false, error: 'Đơn hàng không đủ điều kiện áp dụng voucher này' }
          continue
        }
      }

      // Build response với applicableProductIds/CategoryIds để order-service tính applicableSubtotal
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

      results[voucherId] = {
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

    return { results }
  }

  // Check xem voucher có áp dụng được cho items trong đơn hàng không
  // Logic giống hệt ValidateVoucherHandler.checkScopeEligibility
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
