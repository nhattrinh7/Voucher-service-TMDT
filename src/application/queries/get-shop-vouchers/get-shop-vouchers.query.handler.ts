import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
  VoucherWithUsedCount,
} from '~/domain/repositories/voucher.repository.interface'
import { Inject } from '@nestjs/common'
import { GetShopVouchersQuery } from '~/application/queries/get-shop-vouchers/get-shop-vouchers.query'

@QueryHandler(GetShopVouchersQuery)
export class GetShopVouchersHandler
  implements IQueryHandler<GetShopVouchersQuery, VoucherWithUsedCount[]>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(query: GetShopVouchersQuery): Promise<VoucherWithUsedCount[]> {
    const { shopId } = query

    const vouchers = await this.voucherRepository.findByShopId(shopId)

    return vouchers
  }
}
