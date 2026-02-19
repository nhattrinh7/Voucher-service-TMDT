import { Controller } from '@nestjs/common'
import { Payload, Ctx, RmqContext, MessagePattern } from '@nestjs/microservices'
import { CommandBus } from '@nestjs/cqrs'
import { BaseRetryConsumer } from '~/common/utils/base-retry.consumer'
import { ReserveVoucherUsageCommand } from '~/application/commands/reserve-voucher-usage/reserve-voucher-usage.command'

interface ReserveVoucherUsagePayload {
  voucherId: string
  userId: string
}

@Controller()
export class ReserveVoucherUsageConsumer extends BaseRetryConsumer {
  constructor(
    private readonly commandBus: CommandBus,
  ) {
    super()
  }

  @MessagePattern('reserve.voucher.usage')
  async handleReserveVoucherUsage(
    @Payload() data: ReserveVoucherUsagePayload,
    @Ctx() context: RmqContext,
  ) {
    console.log('Event reserve.voucher.usage received:', data)

    const result = await this.handleWithRetry(context, async () => {
      return await this.commandBus.execute(new ReserveVoucherUsageCommand(
        data.voucherId,
        data.userId,
      ))
    })

    return result
  }
}
