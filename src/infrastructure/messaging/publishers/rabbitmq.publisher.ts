import { Injectable, Inject } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'

@Injectable()
export class RabbitMQPublisher implements IMessagePublisher {
  constructor(@Inject('NOTIFICATION_CLIENT') private readonly notificationClient: ClientProxy) {}

  publish<T>(pattern: string, event: T): void {
    this.notificationClient.emit(pattern, event)
  }
}