import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ReserveVoucherUsageCommand } from './reserve-voucher-usage.command'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'
import { VoucherUsage } from '~/domain/entities/voucher-usage.entity'
import { v4 as uuidv4 } from 'uuid'

interface ReserveVoucherUsageResponse {
  success: boolean
  voucherUsageId?: string
  error?: string
}

@CommandHandler(ReserveVoucherUsageCommand)
export class ReserveVoucherUsageHandler
  implements ICommandHandler<ReserveVoucherUsageCommand, ReserveVoucherUsageResponse>
{
  constructor(
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
  ) {}

  async execute(command: ReserveVoucherUsageCommand): Promise<ReserveVoucherUsageResponse> {
    const { voucherId, userId } = command

    try {
      // Tạo VoucherUsage entity với status RESERVED
      const voucherUsage = VoucherUsage.create({
        id: uuidv4(),
        voucherId,
        userId,
        orderId: null, // Temporary orderId nếu chưa có
        status: 'RESERVED',
        appliedAt: new Date(),
      })

      // Lưu vào database qua repository
      await this.voucherUsageRepository.create(voucherUsage)

      return {
        success: true,
        voucherUsageId: voucherUsage.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Không thể reserve voucher',
      }
    }
  }
}
