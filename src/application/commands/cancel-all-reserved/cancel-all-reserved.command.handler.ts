import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CancelAllReservedCommand } from './cancel-all-reserved.command'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'

interface CancelAllReservedResponse {
  success: boolean
  deletedCount: number
  error?: string
}

@CommandHandler(CancelAllReservedCommand)
export class CancelAllReservedHandler implements ICommandHandler<CancelAllReservedCommand, CancelAllReservedResponse> {
  constructor(
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
  ) {}

  async execute(command: CancelAllReservedCommand): Promise<CancelAllReservedResponse> {
    const { userId } = command

    try {
      const deletedCount = await this.voucherUsageRepository.deleteAllReservedByUserId(userId)

      return {
        success: true,
        deletedCount,
      }
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error.message || 'Không thể xóa các bản ghi RESERVED',
      }
    }
  }
}
