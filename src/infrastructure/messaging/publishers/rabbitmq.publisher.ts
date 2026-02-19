import { Injectable, Inject } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'

@Injectable()
export class RabbitMQPublisher implements IMessagePublisher {
  constructor(
    @Inject('NOTIFICATION_CLIENT') private readonly notificationClient: ClientProxy,
    @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
  ) {}

  publish<T>(pattern: string, event: T): void {
    this.notificationClient.emit(pattern, event)
  }

  async sendToCatalogService<T, R = any>(pattern: string, data: T): Promise<R> {
    const response$ = this.catalogClient.send<R, T>(pattern, data)
    return lastValueFrom(response$)
  }
}