import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { SagaConfirmVouchersCommand } from './saga-confirm-vouchers.command'
import type { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'
import { CACHE_EVENT, CACHE_RESOURCE, CACHE_TYPE } from '~/common/constants/cache.constant'

interface ConfirmVouchersResult {
  success: boolean
  error?: string
}

@CommandHandler(SagaConfirmVouchersCommand)
export class SagaConfirmVouchersHandler
  implements ICommandHandler<SagaConfirmVouchersCommand, ConfirmVouchersResult>
{
  constructor(
    @Inject(VOUCHER_USAGE_REPOSITORY)
    private readonly voucherUsageRepository: IVoucherUsageRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: SagaConfirmVouchersCommand): Promise<ConfirmVouchersResult> {
    const { userId, voucherIds } = command

    await this.voucherUsageRepository.confirmByUserAndVoucherIds(userId, voucherIds)

    // Invalidate cache cho các voucher đã confirm
    for (const voucherId of voucherIds) {
      this.eventEmitter.emit(CACHE_EVENT.INVALIDATE, {
        type: CACHE_TYPE.DETAIL,
        resource: CACHE_RESOURCE.VOUCHERS,
        id: voucherId,
      })
    }
    this.eventEmitter.emit(CACHE_EVENT.INVALIDATE, {
      type: CACHE_TYPE.LIST,
      resource: CACHE_RESOURCE.VOUCHERS,
    })

    return { success: true }
  }
}
