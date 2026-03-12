import { SetMetadata } from '@nestjs/common'
import { type CacheResourceValue } from '~/common/constants/cache.constant'

export const CACHE_RESOURCE_KEY = 'cacheResource'
export const CacheResource = (resource: CacheResourceValue) => SetMetadata(CACHE_RESOURCE_KEY, resource)
