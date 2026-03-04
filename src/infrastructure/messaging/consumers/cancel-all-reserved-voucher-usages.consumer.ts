import { Controller } from '@nestjs/common'
import { Payload, Ctx, RmqContext, MessagePattern } from '@nestjs/microservices'
import { CommandBus } from '@nestjs/cqrs'
import { BaseRetryConsumer } from '~/common/utils/base-retry.consumer'
import { CancelAllReservedCommand } from '~/application/commands/cancel-all-reserved/cancel-all-reserved.command'

interface CancelAllReservedPayload {
  userId: string
}

@Controller()
export class CancelAllReservedVoucherUsagesConsumer extends BaseRetryConsumer {
  constructor(
    private readonly commandBus: CommandBus,
  ) {
    super()
  }

  @MessagePattern('cancel.all.reserved.voucher.usages')
  async handleCancelAllReservedVoucherUsages(
    @Payload() data: CancelAllReservedPayload,
    @Ctx() context: RmqContext,
  ) {
    const result = await this.handleWithRetry(context, async () => {
      this.logger.log(`Event cancel.all.reserved.voucher.usages received, userId=${data.userId}`)
      return await this.commandBus.execute(new CancelAllReservedCommand(
        data.userId,
      ))
    })

    return result
  }
}
