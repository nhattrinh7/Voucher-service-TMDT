import { Voucher } from '~/domain/entities/voucher.entity'

export interface VoucherWithUsedCount extends Voucher {
  usedCount: number
}

export interface VoucherWithDetails extends Voucher {
  usedCount: number
  productIds: string[]
  categoryIds: string[]
}

export interface EligibleVoucher {
  id: string
  code: string
  name: string
  discountType: string
  discountValue: number
  minOrderValue: number
  maxDiscountValue: number | null
  startDate: Date
  endDate: Date
  scope: string
  usageLimit: number
  remainingUsage: number
  userRemainingUsage: number
}

export interface PaginatedResult<T> {
  vouchers: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface IVoucherRepository {
  findById(id: string): Promise<Voucher | null>
  findByIds(ids: string[]): Promise<Voucher[]>
  findByIdWithDetails(id: string): Promise<VoucherWithDetails | null>
  findByShopId(shopId: string): Promise<VoucherWithUsedCount[]>
  findSzoneVouchersPaginated(page: number, limit: number, status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED', search?: string): Promise<PaginatedResult<VoucherWithUsedCount>>
  create(voucher: Voucher, tx?: any): Promise<Voucher>
  update(voucher: Voucher, tx?: any): Promise<Voucher>
  createVoucherProducts(voucherId: string, productIds: string[], tx?: any): Promise<void>
  createVoucherCategories(voucherId: string, categoryIds: string[], tx?: any): Promise<void>
  deleteVoucherProducts(voucherId: string, tx?: any): Promise<void>
  deleteVoucherCategories(voucherId: string, tx?: any): Promise<void>
  softDelete(id: string, deletedBy: string): Promise<void>
  findEligibleShopVouchers(shopId: string, userId: string): Promise<Array<EligibleVoucher & { voucherProducts: { productId: string }[] }>>
  findEligibleSzoneVouchers(userId: string, orderValue: number): Promise<Array<EligibleVoucher & { voucherCategories: { categoryId: string }[] }>>
  
  // Methods for scope checking
  getVoucherProductIds(voucherId: string): Promise<string[]>
  getVoucherCategoryIds(voucherId: string): Promise<string[]>
}
export const VOUCHER_REPOSITORY = Symbol('IVoucherRepository')