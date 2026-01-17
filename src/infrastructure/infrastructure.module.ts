import { Module } from '@nestjs/common'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure//messaging/messaging.module'

@Module({
  imports: [DatabaseModule, MessagingModule],
  providers: [],
  exports: [],
})
export class InfrastructureModule {}
