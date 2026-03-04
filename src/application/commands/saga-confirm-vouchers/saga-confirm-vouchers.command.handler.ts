import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { SagaConfirmVouchersCommand } from './saga-confirm-vouchers.command'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'

interface ConfirmVouchersResult {
  success: boolean
  error?: string
}

@CommandHandler(SagaConfirmVouchersCommand)
export class SagaConfirmVouchersHandler implements ICommandHandler<SagaConfirmVouchersCommand, ConfirmVouchersResult> {
  constructor(
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
  ) {}

  async execute(command: SagaConfirmVouchersCommand): Promise<ConfirmVouchersResult> {
    const { userId, voucherIds } = command

    await this.voucherUsageRepository.confirmByUserAndVoucherIds(userId, voucherIds)

    return { success: true }
  }
}
