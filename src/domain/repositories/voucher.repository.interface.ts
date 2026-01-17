import { Voucher } from '~/domain/entities/voucher.entity'

export interface VoucherWithUsedCount extends Voucher {
  usedCount: number
}

export interface IVoucherRepository {
  findById(id: string): Promise<Voucher | null>
  findByShopId(shopId: string): Promise<VoucherWithUsedCount[]>
  create(voucher: Voucher): Promise<Voucher>
  createVoucherProducts(voucherId: string, productIds: string[]): Promise<void>
  delete(id: string, deletedBy: string): Promise<void>
}
export const VOUCHER_REPOSITORY = Symbol('IVoucherRepository')