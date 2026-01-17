import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { CreateVoucherHandler } from './commands/create-voucher/create-voucher.command.handler'
import { GetShopVouchersHandler } from './queries/get-shop-vouchers/get-shop-vouchers.query.handler'
import { DeleteVoucherHandler } from './commands/delete-voucher/delete-voucher.command.handler'

const CommandHandlers = [
  CreateVoucherHandler,
  DeleteVoucherHandler
]

const QueryHandlers = [
  GetShopVouchersHandler
]

const EventHandlers = [

]
 
@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    MessagingModule
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [],
})
export class ApplicationModule {}