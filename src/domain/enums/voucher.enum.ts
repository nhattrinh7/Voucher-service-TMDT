export const ScopeType = {
  ALL: 'ALL',
  CATEGORY: 'CATEGORY',
  PRODUCT: 'PRODUCT'
} as const
export type ScopeType = (typeof ScopeType)[keyof typeof ScopeType]

export const DiscountType = {
  FIXED: 'FIXED',
  PERCENT: 'PERCENT'
} as const
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]