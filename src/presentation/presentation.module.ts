import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { VoucherController } from '~/presentation/v1/controllers/voucher.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [VoucherController],
  exports: [],
})
export class PresentationModule {}
