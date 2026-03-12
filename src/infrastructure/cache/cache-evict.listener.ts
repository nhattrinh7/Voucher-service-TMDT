import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import type { RedisStore } from 'cache-manager-redis-yet'
import { CACHE_EVENT, type CacheTypeValue } from '~/common/constants/cache.constant'

export interface CacheInvalidatePayload {
  type: CacheTypeValue
  resource: string
  id?: string // Cho detail/personal: xóa chính xác 1 key. Nếu không có thì xóa theo pattern
}

@Injectable()
export class CacheEvictListener {
  private readonly logger = new Logger(CacheEvictListener.name)

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @OnEvent(CACHE_EVENT.INVALIDATE)
  async handleCacheInvalidate(payload: CacheInvalidatePayload) {
    try {
      const { type, resource, id } = payload

      if (id) {
        // Xóa chính xác 1 key (detail hoặc personal)
        const key = `cache:${type}:${resource}:${id}`
        await this.cacheManager.del(key)
        this.logger.log(`Cache invalidated: ${key}`)
      } else {
        // Xóa theo pattern (list) — SCAN + batch DEL
        const pattern = `cache:${type}:${resource}:*`
        const deletedCount = await this.deleteByPattern(pattern)
        this.logger.log(`Cache invalidated pattern "${pattern}": ${deletedCount} keys deleted`)
      }
    } catch (error) {
      this.logger.error(`Cache invalidation failed: ${error.message}`)
    }
  }

  /**
   * Xóa cache theo pattern bằng SCAN + batch DEL
   * Không dùng KEYS vì blocking Redis
   */
  private async deleteByPattern(pattern: string): Promise<number> {
    const redisStore = (this.cacheManager as any).store as RedisStore
    const redisClient = redisStore.client

    let cursor = 0
    let totalDeleted = 0

    do {
      // 1. Quét một đợt
      const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 })

      // 2. Cập nhật con trỏ cho đợt tiếp theo
      cursor = result.cursor

      // 3. Nếu tìm thấy keys trong đợt này thì xóa
      if (result.keys.length > 0) {
        await redisClient.del(result.keys)
        totalDeleted += result.keys.length
      }
    } while (cursor !== 0) // Tiếp tục cho đến khi Redis trả về cursor = 0 (đã quét hết)

    return totalDeleted
  }
}

/**
 * Đầu tiên phải nói đến việc Redis là single thread nên phải tránh blocking nếu ko thì toi, làm gì còn luồng khác để chạy khi 1 luồng bị block.
 * Với lệnh KEYS: Redis sẽ dừng MỌI hoạt động khác để quét toàn bộ RedisDB để tìm ra các key khớp với pattern mà mình chỉ định. Sau khi tìm ra đống
 * key khớp đó thì cầm cục đó để chạy lệnh DEL. Thời gian để xử lí lệnh KEYS có thể mất đến cả chục giây, các request khác đến Redis bị timeout hàng loạt
 * và thôi bỏ mẹ rồi.
 * 
 * Với SCAN 100 thì chỉ tìm 100 key xem có khớp hay không thôi nên chạy rất nhanh rồi nghỉ tay để Redis xử lí tiếp các lệnh khác đang xếp hàng. 
 * Thế nên sẽ ko gây blocking.
 * 
 * Hiện tại với Cache Detail hay Personal thì với key cụ thể, ví dụ: cache:detail:users:123, mình đã biết đích xác key là gì rồi nên tìm rất nhanh
 * nên ko gây blocking.
 * Về mặt kĩ thuật thì Redis lưu key bằng hash table siêu tối ưu. Thế nên khi nhận được 1 giá trị key đích xác, Redis ném key và hàm băm rồi bùm 1 phát
 * tính ra ngay lập tức vị trí vật lí của cái key đó nằm ở hộc số mấy trong kho. Nó đi thẳng tới và thẳng tay xóa.
 * 
 * Còn việc phải xóa HẾT các biến thể của cache list theo pattern là vì ví dụ:
 * Admin thêm/sửa/xóa 1 category -> các cache của /api/v1/categories, /api/v1/categories?page=1&limit=10, /api/v1/categories?page=2&limit=10,...
 * đều bị stale thì phải xóa hết đi đúng ko. Và khi invalidate theo pattern như này thì đâu phải kiểu biết đích xác key là gì để tìm và xóa nhanh được đâu.
 * Đó là lí do mà phải dùng SCAN + batch DEL.
 */ 