import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
  VoucherWithUsedCount,
  PaginatedResult,
} from '~/domain/repositories/voucher.repository.interface'
import { Inject } from '@nestjs/common'
import { GetSzoneVouchersQuery } from '~/application/queries/get-szone-vouchers/get-szone-vouchers.query'

@QueryHandler(GetSzoneVouchersQuery)
export class GetSzoneVouchersHandler
  implements IQueryHandler<GetSzoneVouchersQuery, PaginatedResult<VoucherWithUsedCount>>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(query: GetSzoneVouchersQuery): Promise<PaginatedResult<VoucherWithUsedCount>> {
    const { page, limit, status, search } = query

    const result = await this.voucherRepository.findSzoneVouchersPaginated(
      page,
      limit,
      status,
      search,
    )

    return result
  }
}
