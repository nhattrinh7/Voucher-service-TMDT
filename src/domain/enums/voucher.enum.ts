export const DiscountType = {
  FIXED: 'FIXED',
  PERCENT: 'PERCENT',
} as const
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]

export const VoucherScopeType = {
  ALL: 'ALL',
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
} as const
export type VoucherScopeType = (typeof VoucherScopeType)[keyof typeof VoucherScopeType]
