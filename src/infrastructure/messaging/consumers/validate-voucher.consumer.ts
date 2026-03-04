import { Controller } from '@nestjs/common'
import { Payload, Ctx, RmqContext, MessagePattern } from '@nestjs/microservices'
import { QueryBus } from '@nestjs/cqrs'
import { BaseRetryConsumer } from '~/common/utils/base-retry.consumer'
import { ValidateVoucherQuery } from '~/application/queries/validate-voucher/validate-voucher.query'

interface ValidateVoucherPayload {
  voucherId: string
  userId: string
  orderValue: number
  items?: Array<{
    productId: string
    categoryId: string
  }>
}

@Controller()
export class ValidateVoucherConsumer extends BaseRetryConsumer {
  constructor(
    private readonly queryBus: QueryBus,
  ) {
    super()
  }

  @MessagePattern('validate.voucher')
  async handleValidateVoucher(
    @Payload() data: ValidateVoucherPayload,
    @Ctx() context: RmqContext,
  ) {
    const result = await this.handleWithRetry(context, async () => {
      this.logger.log(`Event validate.voucher received, voucherId=${data.voucherId}`)
      return await this.queryBus.execute(new ValidateVoucherQuery(
        data.voucherId,
        data.userId,
        data.orderValue,
        data.items
      ))
    })

    return result
  }
}
