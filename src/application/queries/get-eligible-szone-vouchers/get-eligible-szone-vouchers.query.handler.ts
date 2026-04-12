import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
  type EligibleVoucher,
} from '~/domain/repositories/voucher.repository.interface'
import { GetEligibleSzoneVouchersQuery } from './get-eligible-szone-vouchers.query'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { RabbitMQPublisher } from '~/infrastructure/messaging/publishers/rabbitmq.publisher'

interface ProductWithLevel1Category {
  productId: string
  categoryId: string
  level1CategoryId: string
}

@QueryHandler(GetEligibleSzoneVouchersQuery)
export class GetEligibleSzoneVouchersHandler
  implements IQueryHandler<GetEligibleSzoneVouchersQuery, EligibleVoucher[]>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: RabbitMQPublisher,
  ) {}

  async execute(query: GetEligibleSzoneVouchersQuery): Promise<EligibleVoucher[]> {
    const { userId, items } = query

    // 1. Tính tổng giá trị đơn hàng
    const orderValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // 2. Lấy danh sách unique productIds
    const productIds = [...new Set(items.map(item => item.productId))]

    // 3. Gọi catalog-service để lấy level1CategoryIds qua RabbitMQ
    const productsWithCategories = await this.messagePublisher.sendToCatalogService<
      { productIds: string[] },
      ProductWithLevel1Category[]
    >('get.products.with.level1.categories', { productIds })

    // Lấy danh sách unique level1CategoryIds
    const level1CategoryIds = [...new Set(productsWithCategories.map(p => p.level1CategoryId))]

    // 4. Gọi repository để lấy tất cả vouchers với điều kiện cơ bản
    const allVouchers = await this.voucherRepository.findEligibleSzoneVouchers(userId, orderValue)

    // 5. BUSINESS LOGIC: Filter vouchers theo scope
    const eligibleVouchers: EligibleVoucher[] = []

    for (const voucher of allVouchers) {
      // Scope ALL: Luôn eligible
      if (voucher.scope === 'ALL') {
        // Remove voucherCategories trước khi add vào result
        const { voucherCategories, ...voucherData } = voucher
        eligibleVouchers.push(voucherData)
        continue
      }

      // Scope CATEGORY: Phải có ít nhất 1 product thuộc category được hỗ trợ
      if (voucher.scope === 'CATEGORY') {
        const voucherCategoryIds = voucher.voucherCategories.map(vc => vc.categoryId)

        // Check intersection: voucher categories có chứa bất kỳ level1CategoryId nào không
        const hasMatchingCategory = level1CategoryIds.some(catId =>
          voucherCategoryIds.includes(catId),
        )

        if (hasMatchingCategory) {
          // Remove voucherCategories trước khi add vào result
          const { voucherCategories, ...voucherData } = voucher
          eligibleVouchers.push(voucherData)
        }
      }
    }

    return eligibleVouchers
  }
}
