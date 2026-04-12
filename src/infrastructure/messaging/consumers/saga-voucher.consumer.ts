import { Controller, Inject } from '@nestjs/common'
import { Payload, Ctx, RmqContext, EventPattern } from '@nestjs/microservices'
import { CommandBus } from '@nestjs/cqrs'
import { BaseRetryConsumer } from '~/common/utils/base-retry.consumer'
import { SagaValidateVouchersCommand } from '~/application/commands/saga-validate-vouchers/saga-validate-vouchers.command'
import { SagaConfirmVouchersCommand } from '~/application/commands/saga-confirm-vouchers/saga-confirm-vouchers.command'
import { SagaCancelVouchersCommand } from '~/application/commands/saga-cancel-vouchers/saga-cancel-vouchers.command'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'

interface ValidateVouchersPayload {
  sagaId: string
  userId: string
  shopVouchers: Array<{
    voucherId: string
    orderValue: number
    items: Array<{ productId: string; categoryId: string }>
  }>
  szoneVoucher?: {
    voucherId: string
    orderValue: number
    items: Array<{ productId: string; categoryId: string }>
  }
}

interface ConfirmVouchersPayload {
  sagaId: string
  userId: string
  voucherIds: string[]
}

interface CancelVouchersPayload {
  sagaId: string
  userId: string
  voucherIds: string[]
}

@Controller()
export class SagaVoucherConsumer extends BaseRetryConsumer {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {
    super()
  }

  @EventPattern('saga.validate-vouchers')
  async handleValidateVouchers(
    @Payload() data: ValidateVouchersPayload,
    @Ctx() context: RmqContext,
  ) {
    await this.handleWithRetry(context, async () => {
      this.logger.log(`Event saga.validate-vouchers received, sagaId=${data.sagaId}`)
      try {
        const result = await this.commandBus.execute(
          new SagaValidateVouchersCommand(
            data.sagaId,
            data.userId,
            data.shopVouchers,
            data.szoneVoucher,
          ),
        )

        if (result.success) {
          this.messagePublisher.emitToSagaOrchestrator('saga.result.validate-vouchers', {
            sagaId: data.sagaId,
            success: true,
            shopVoucherResults: result.shopVoucherResults,
            szoneVoucherResult: result.szoneVoucherResult,
          })
        } else {
          this.messagePublisher.emitToSagaOrchestrator('saga.result.validate-vouchers', {
            sagaId: data.sagaId,
            success: false,
            error: result.error,
          })
        }
      } catch (error: any) {
        this.messagePublisher.emitToSagaOrchestrator('saga.result.validate-vouchers', {
          sagaId: data.sagaId,
          success: false,
          error: error.message || 'Lỗi validate vouchers',
        })
      }
    })
  }

  @EventPattern('saga.confirm-vouchers')
  async handleConfirmVouchers(@Payload() data: ConfirmVouchersPayload, @Ctx() context: RmqContext) {
    await this.handleWithRetry(context, async () => {
      this.logger.log(`Event saga.confirm-vouchers received, sagaId=${data.sagaId}`)
      try {
        await this.commandBus.execute(
          new SagaConfirmVouchersCommand(data.sagaId, data.userId, data.voucherIds),
        )

        this.messagePublisher.emitToSagaOrchestrator('saga.result.confirm-vouchers', {
          sagaId: data.sagaId,
          success: true,
        })
      } catch (error: any) {
        this.messagePublisher.emitToSagaOrchestrator('saga.result.confirm-vouchers', {
          sagaId: data.sagaId,
          success: false,
          error: error.message || 'Lỗi confirm vouchers',
        })
      }
    })
  }

  @EventPattern('saga.cancel-vouchers')
  async handleCancelVouchers(@Payload() data: CancelVouchersPayload, @Ctx() context: RmqContext) {
    await this.handleWithRetry(context, async () => {
      this.logger.log(`Event saga.cancel-vouchers received, sagaId=${data.sagaId}`)
      try {
        await this.commandBus.execute(new SagaCancelVouchersCommand(data.userId, data.voucherIds))
      } catch (error: any) {
        this.logger.error(`Cancel vouchers failed: ${error.message}`)
      }
    })
  }
}
