import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { VoucherController } from '~/presentation/v1/controllers/voucher.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { AdminController } from '~/presentation/v1/controllers/admin.controller'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [VoucherController, AdminController],
  exports: [],
})
export class PresentationModule {}
