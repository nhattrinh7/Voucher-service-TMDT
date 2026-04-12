export const CACHE_TYPE = {
  LIST: 'list',
  DETAIL: 'detail',
  PERSONAL: 'personal',
} as const

export type CacheTypeValue = (typeof CACHE_TYPE)[keyof typeof CACHE_TYPE]

export const CACHE_RESOURCE = {
  VOUCHERS: 'vouchers',
} as const

export type CacheResourceValue = (typeof CACHE_RESOURCE)[keyof typeof CACHE_RESOURCE]

export const CACHE_EVENT = {
  INVALIDATE: 'cache.invalidate',
} as const
