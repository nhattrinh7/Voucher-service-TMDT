import { Injectable, Inject, Logger } from '@nestjs/common'
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { getKongRequestId } from '~/common/context/request-context'

@Injectable()
export class RabbitMQPublisher implements IMessagePublisher {
  private readonly logger = new Logger(RabbitMQPublisher.name)

  constructor(
    @Inject('NOTIFICATION_CLIENT') private readonly notificationClient: ClientProxy,
    @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
    @Inject('SAGA_CLIENT') private readonly sagaClient: ClientProxy,
  ) {}

  private buildRecord<T>(event: T) {
    return new RmqRecordBuilder(event)
      .setOptions({
        headers: { 'kong-request-id': getKongRequestId() },
      })
      .build()
  }

  publish<T>(pattern: string, event: T): void {
    this.logger.debug(`[${getKongRequestId()}] Emit ${pattern} → notification-service`)
    this.notificationClient.emit(pattern, this.buildRecord(event))
  }

  emitToSagaOrchestrator<T>(pattern: string, event: T): void {
    this.logger.debug(`[${getKongRequestId()}] Emit ${pattern} → saga-orchestrator`)
    this.sagaClient.emit(pattern, this.buildRecord(event))
  }

  async sendToCatalogService<T, R = any>(pattern: string, data: T): Promise<R> {
    this.logger.debug(`[${getKongRequestId()}] Send ${pattern} → catalog-service`)
    const response$ = this.catalogClient.send<R, T>(pattern, this.buildRecord(data) as any)
    return lastValueFrom(response$)
  }
}