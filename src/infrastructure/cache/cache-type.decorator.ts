import { SetMetadata } from '@nestjs/common'
import { type CacheTypeValue } from '~/common/constants/cache.constant'

export const CACHE_TYPE_KEY = 'cacheType'
export const CacheType = (type: CacheTypeValue) => SetMetadata(CACHE_TYPE_KEY, type)
