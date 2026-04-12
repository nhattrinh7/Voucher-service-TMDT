import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
  VoucherWithDetails,
} from '~/domain/repositories/voucher.repository.interface'
import { Inject, NotFoundException } from '@nestjs/common'
import { GetVoucherDetailByIdQuery } from '~/application/queries/get-voucher-detail-by-id/get-voucher-detail-by-id.query'

@QueryHandler(GetVoucherDetailByIdQuery)
export class GetVoucherDetailByIdHandler
  implements IQueryHandler<GetVoucherDetailByIdQuery, VoucherWithDetails>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(query: GetVoucherDetailByIdQuery): Promise<VoucherWithDetails> {
    const { id } = query

    const voucher = await this.voucherRepository.findByIdWithDetails(id)

    if (!voucher) {
      throw new NotFoundException(`Voucher with id ${id} not found`)
    }

    return voucher
  }
}
