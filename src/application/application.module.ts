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
import { GetEligibleShopVouchersHandler } from './queries/get-eligible-shop-vouchers/get-eligible-shop-vouchers.query.handler'
import { GetEligibleSzoneVouchersHandler } from './queries/get-eligible-szone-vouchers/get-eligible-szone-vouchers.query.handler'
import { ValidateVoucherHandler } from './queries/validate-voucher/validate-voucher.query.handler'
import { ValidateVouchersBatchHandler } from './queries/validate-vouchers-batch/validate-vouchers-batch.query.handler'
import { ReserveVoucherUsageHandler } from './commands/reserve-voucher-usage/reserve-voucher-usage.command.handler'
import { CancelAllReservedHandler } from './commands/cancel-all-reserved/cancel-all-reserved.command.handler'

const CommandHandlers = [
  CreateShopVoucherHandler,
  SoftDeleteShopVoucherHandler,
  UpdateShopVoucherHandler,
  CreateSzoneVoucherHandler,
  SoftDeleteSzoneVoucherHandler,
  UpdateSzoneVoucherHandler,
  ReserveVoucherUsageHandler,
  CancelAllReservedHandler,
]

const QueryHandlers = [
  GetShopVouchersHandler,
  GetSzoneVouchersHandler,
  GetVoucherDetailByIdHandler,
  GetEligibleShopVouchersHandler,
  GetEligibleSzoneVouchersHandler,
  ValidateVoucherHandler,
  ValidateVouchersBatchHandler,
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