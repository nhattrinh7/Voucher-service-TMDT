import { Controller } from '@nestjs/common'
import { Payload, Ctx, RmqContext, MessagePattern } from '@nestjs/microservices'
import { QueryBus } from '@nestjs/cqrs'
import { BaseRetryConsumer } from '~/common/utils/base-retry.consumer'
import { ValidateVouchersBatchQuery } from '~/application/queries/validate-vouchers-batch/validate-vouchers-batch.query'

interface ValidateVouchersBatchPayload {
  userId: string
  vouchers: Array<{
    voucherId: string
    orderValue: number
    items?: Array<{
      productId: string
      categoryId: string
    }>
  }>
}

@Controller()
export class ValidateVouchersBatchConsumer extends BaseRetryConsumer {
  constructor(private readonly queryBus: QueryBus) {
    super()
  }

  @MessagePattern('validate.vouchers.batch')
  async handleValidateVouchersBatch(
    @Payload() data: ValidateVouchersBatchPayload,
    @Ctx() context: RmqContext,
  ) {
    const result = await this.handleWithRetry(context, async () => {
      this.logger.log(`Event validate.vouchers.batch received, count=${data.vouchers?.length}`)
      return await this.queryBus.execute(new ValidateVouchersBatchQuery(data.userId, data.vouchers))
    })

    return result
  }
}
