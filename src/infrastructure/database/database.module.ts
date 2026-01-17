import { Module } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { VOUCHER_REPOSITORY } from '~/domain/repositories/voucher.repository.interface'
import { VoucherRepository } from '~/infrastructure/database/repositories/voucher.repository'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule],
  providers: [
    PrismaService,
    {
      provide: VOUCHER_REPOSITORY,
      useClass: VoucherRepository,
    },
  ],
  exports: [
    VOUCHER_REPOSITORY,
  ],
})
export class DatabaseModule {}
