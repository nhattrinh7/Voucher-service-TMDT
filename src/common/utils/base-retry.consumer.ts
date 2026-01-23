// channel.publish(exchange, routingKey, content, options)

import { RmqContext } from '@nestjs/microservices'
import { env } from '~/configs/env.config'

export abstract class BaseRetryConsumer {
  protected readonly maxRetries = 3
  protected readonly baseDelay = 1000

  protected async handleWithRetry<T>(
    context: RmqContext,
    handler: () => Promise<T>,
  ): Promise<T | undefined> {
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0

    if (retryCount > this.maxRetries) {
      console.log(`❌ Max retries (${this.maxRetries}) exceeded, sending to DLQ`)

      const serviceName = env.config.SERVICE_NAME || 'unknown-service'
      channel.publish('events_exchange', `dlq.${serviceName}`, originalMsg.content, {
        persistent: true,
        headers: {
          'x-original-exchange': 'events_exchange',
          'x-original-routing-key': context.getPattern(),
          'x-service': serviceName,
          'x-retry-count': retryCount,
          'x-failed-at': new Date().toISOString(),
        },
      })

      channel.ack(originalMsg) // xóa message gốc khỏi queue chính
      return undefined
    }

    try {
      const result = await handler()
      channel.ack(originalMsg)
      console.log('✅ Acked, Message processed successfully')
      return result
    } catch (error) {
      // Exponential backoff: 1s, 2s, 4s
      const baseDelayForRetry = this.baseDelay * Math.pow(2, retryCount)

      // Bounded jitter: ±25% (từ 75% đến 125% của base delay)
      const minDelay = baseDelayForRetry * 0.75
      const maxDelay = baseDelayForRetry * 1.25
      const jitterDelay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay))

      // Lưu routing key gốc vào header từ lần đầu
      const originalRoutingKey =
        originalMsg.properties.headers?.['x-original-routing-key'] || context.getPattern()

      console.log(`🔄 Retry ${retryCount + 1}/${this.maxRetries} after ${jitterDelay}ms`)
      console.log('exchange:', 'events_exchange')
      console.log('routingKey:', originalRoutingKey)
      console.log('content:', originalMsg.content)
      
      setTimeout(() => {
        channel.publish(
          // publish lại message với cùng exchange, routingKey và cùng data
          'events_exchange',
          originalRoutingKey,
          originalMsg.content,
          {
            persistent: true,
            headers: {
              ...originalMsg.properties.headers,
              'x-retry-count': retryCount + 1,
              'x-original-routing-key': originalRoutingKey,
            },
          },
        )
      }, jitterDelay)

      channel.ack(originalMsg) // xóa message gốc vì đã publish message mới với retry count tăng lên rồi
      return undefined
    }
  }
}
