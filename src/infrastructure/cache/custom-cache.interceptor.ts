import { CacheInterceptor } from '@nestjs/cache-manager'
import { ExecutionContext, Injectable } from '@nestjs/common'
import { CACHE_TYPE_KEY } from '~/infrastructure/cache/cache-type.decorator'
import { type CacheTypeValue } from '~/common/constants/cache.constant'
import { CACHE_RESOURCE_KEY } from '~/infrastructure/cache/cache-prefix.decorator'

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest()

    // Chỉ cache GET requests
    if (request.method !== 'GET') return undefined

    const cacheType = this.reflector.get<CacheTypeValue>(CACHE_TYPE_KEY, context.getHandler())
    const cacheResource = this.reflector.get<string>(CACHE_RESOURCE_KEY, context.getHandler())

    // Nếu không có decorator @CacheType() và @CacheResource() thì không cache
    if (!cacheType || !cacheResource) return undefined

    const url: string = request.originalUrl
    const keySuffix = url.includes('?') ? url.split('?')[1] : url

    switch (cacheType) {
      case 'list': {
        return `cache:list:${cacheResource}:${keySuffix}`
      }

      case 'detail': {
        return `cache:detail:${cacheResource}:${request.params.id}`
      }

      case 'personal': {
        const userId = request.params.id || request.headers['x-user-id']
        return `cache:personal:${cacheResource}:${userId}`
      }

      default:
        return undefined
    }
  }

  protected isRequestCacheable(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    return request.method === 'GET'
  }
}
