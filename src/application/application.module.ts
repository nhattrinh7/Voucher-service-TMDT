import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { CreateShopVoucherHandler } from './commands/create-shop-voucher/create-shop-voucher.command.handler'
import { GetShopVouchersHandler } from './queries/get-shop-vouchers/get-shop-vouchers.query.handler'
import { SoftDeleteShopVoucherHandler } from './commands/soft-delete-shop-voucher/soft-delete-shop-voucher.command.handler'
import { UpdateShopVoucherHandler } from './commands/update-shop-voucher/update-shop-voucher.command.handler'
import { CreateSzoneVoucherHandler } from './commands/create-szone-voucher/create-szone-voucher.command.handler'
import { SoftDeleteSzoneVoucherHandler } from './commands/soft-delete-szone-voucher/soft-delete-szone-voucher.command.handler'
import { UpdateSzoneVoucherHandler } from './commands/update-szone-voucher/update-szone-voucher.command.handler'
import { GetSzoneVouchersHandler } from './queries/get-szone-vouchers/get-szone-vouchers.query.handler'
import { GetVoucherDetailByIdHandler } from './queries/get-voucher-detail-by-id/get-voucher-detail-by-id.query.handler'

const CommandHandlers = [
  CreateShopVoucherHandler,
  SoftDeleteShopVoucherHandler,
  UpdateShopVoucherHandler,
  CreateSzoneVoucherHandler,
  SoftDeleteSzoneVoucherHandler,
  UpdateSzoneVoucherHandler
]

const QueryHandlers = [
  GetShopVouchersHandler,
  GetSzoneVouchersHandler,
  GetVoucherDetailByIdHandler
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