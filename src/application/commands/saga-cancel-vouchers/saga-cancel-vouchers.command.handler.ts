import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { SagaCancelVouchersCommand } from './saga-cancel-vouchers.command'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'

@CommandHandler(SagaCancelVouchersCommand)
export class SagaCancelVouchersHandler implements ICommandHandler<SagaCancelVouchersCommand> {
  constructor(
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
  ) {}

  async execute(command: SagaCancelVouchersCommand): Promise<void> {
    const { userId, voucherIds } = command

    await this.voucherUsageRepository.cancelByUserAndVoucherIds(userId, voucherIds)
  }
}
