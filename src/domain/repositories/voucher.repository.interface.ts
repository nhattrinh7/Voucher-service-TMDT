import { Voucher } from '~/domain/entities/voucher.entity'

export interface VoucherWithUsedCount extends Voucher {
  usedCount: number
}

export interface VoucherWithDetails extends Voucher {
  usedCount: number
  productIds: string[]
  categoryIds: string[]
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
  findByIdWithDetails(id: string): Promise<VoucherWithDetails | null>
  findByShopId(shopId: string): Promise<VoucherWithUsedCount[]>
  findSzoneVouchersPaginated(page: number, limit: number, status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED', search?: string): Promise<PaginatedResult<VoucherWithUsedCount>>
  create(voucher: Voucher): Promise<Voucher>
  update(voucher: Voucher): Promise<Voucher>
  createVoucherProducts(voucherId: string, productIds: string[]): Promise<void>
  createVoucherCategories(voucherId: string, categoryIds: string[]): Promise<void>
  deleteVoucherProducts(voucherId: string): Promise<void>
  deleteVoucherCategories(voucherId: string): Promise<void>
  softDelete(id: string, deletedBy: string): Promise<void>
}
export const VOUCHER_REPOSITORY = Symbol('IVoucherRepository')