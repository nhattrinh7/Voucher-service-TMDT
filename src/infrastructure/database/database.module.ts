import { Module } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { VOUCHER_REPOSITORY } from '~/domain/repositories/voucher.repository.interface'
import { VoucherRepository } from '~/infrastructure/database/repositories/voucher.repository'
import { VoucherUsageRepository } from '~/infrastructure/database/repositories/voucher-usage.repository'
import { VOUCHER_USAGE_REPOSITORY } from '~/domain/repositories/voucher-usage.repository.interface'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule],
  providers: [
    PrismaService,
    {
      provide: VOUCHER_REPOSITORY,
      useClass: VoucherRepository,
    },
    {
      provide: VOUCHER_USAGE_REPOSITORY,
      useClass: VoucherUsageRepository,
    },
  ],
  exports: [
    VOUCHER_REPOSITORY,
    VOUCHER_USAGE_REPOSITORY,
  ],
})
export class DatabaseModule {}
