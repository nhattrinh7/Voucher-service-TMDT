import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { VOUCHER_REPOSITORY, type IVoucherRepository, type EligibleVoucher } from '~/domain/repositories/voucher.repository.interface'
import { Inject } from '@nestjs/common'
import { GetEligibleShopVouchersQuery } from './get-eligible-shop-vouchers.query'

@QueryHandler(GetEligibleShopVouchersQuery)
export class GetEligibleShopVouchersHandler implements IQueryHandler<GetEligibleShopVouchersQuery, EligibleVoucher[]> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(query: GetEligibleShopVouchersQuery): Promise<EligibleVoucher[]> {
    const { userId, shopId, items } = query

    // 1. Tính tổng giá trị đơn hàng
    const orderValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // 2. Lấy danh sách unique productIds
    const productIds = [...new Set(items.map(item => item.productId))]

    // 3. Gọi repository để lấy tất cả vouchers với điều kiện cơ bản
    const allVouchers = await this.voucherRepository.findEligibleShopVouchers(shopId, userId)

    // 4. BUSINESS LOGIC: Filter vouchers
    const eligibleVouchers: EligibleVoucher[] = []

    for (const voucher of allVouchers) {
      // Check minOrderValue
      if (orderValue < voucher.minOrderValue) {
        continue
      }

      // Check scope
      if (voucher.scope === 'PRODUCT') {
        // Voucher sản phẩm: phải có ít nhất 1 productId trong items thuộc voucher
        const voucherProductIds = voucher.voucherProducts.map(vp=> vp.productId)
        const hasApplicableProduct = productIds.some(pid => voucherProductIds.includes(pid))
        
        if (!hasApplicableProduct) {
          continue  // Không áp dụng được
        }
      }
      // scope === 'ALL' thì luôn áp dụng được

      // Remove voucherProducts trước khi add vào result
      const { voucherProducts, ...voucherData } = voucher
      eligibleVouchers.push(voucherData)
    }

    return eligibleVouchers
  }
}
