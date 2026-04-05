import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CqrsModule } from '@nestjs/cqrs'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { RabbitMQPublisher } from '~/infrastructure/messaging/publishers/rabbitmq.publisher'
import { ValidateVoucherConsumer } from '~/infrastructure/messaging/consumers/validate-voucher.consumer'
import { ValidateVouchersBatchConsumer } from '~/infrastructure/messaging/consumers/validate-vouchers-batch.consumer'
import { ReserveVoucherUsageConsumer } from '~/infrastructure/messaging/consumers/reserve-voucher-usage.consumer'
import { CancelAllReservedVoucherUsagesConsumer } from '~/infrastructure/messaging/consumers/cancel-all-reserved-voucher-usages.consumer'
import { SagaVoucherConsumer } from '~/infrastructure/messaging/consumers/saga-voucher.consumer'

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://admin:admin123@${process.env.RABBITMQ_HOST || 'localhost'}:5672`],
          queue: 'notification_queue',
          persistent: true,
        },
      },
      {
        name: 'CATALOG_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://admin:admin123@${process.env.RABBITMQ_HOST || 'localhost'}:5672`],
          queue: 'catalog_queue',
          persistent: true,
        },
      },
      {
        name: 'SAGA_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://admin:admin123@${process.env.RABBITMQ_HOST || 'localhost'}:5672`],
          queue: 'saga_queue',
          persistent: true,
        },
      },
    ]),
  ],
  controllers: [
    ValidateVoucherConsumer,
    ValidateVouchersBatchConsumer,
    ReserveVoucherUsageConsumer,
    CancelAllReservedVoucherUsagesConsumer,
    SagaVoucherConsumer,
  ],
  providers: [
    {
      provide: MESSAGE_PUBLISHER,
      useClass: RabbitMQPublisher,
    },
  ],
  exports: [ClientsModule, MESSAGE_PUBLISHER],
})
export class MessagingModule {}
