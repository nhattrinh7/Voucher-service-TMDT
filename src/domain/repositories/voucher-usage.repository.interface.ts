import { VoucherUsage } from '~/domain/entities/voucher-usage.entity'

export interface IVoucherUsageRepository {
  create(voucherUsage: VoucherUsage): Promise<void>
  findById(id: string): Promise<VoucherUsage | null>
  findByVoucherIdAndUserId(voucherId: string, userId: string): Promise<VoucherUsage[]>
  updateStatus(id: string, status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED'): Promise<void>
  updateOrderId(id: string, orderId: string): Promise<void>
  
  // Count methods for validation
  countByVoucherId(voucherId: string, statuses?: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[]): Promise<number>
  countByUserAndVoucher(userId: string, voucherId: string, statuses?: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[]): Promise<number>

  // Batch count methods for batch validation
  countByVoucherIds(voucherIds: string[], statuses?: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[]): Promise<Map<string, number>>
  countByUserAndVoucherIds(userId: string, voucherIds: string[], statuses?: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[]): Promise<Map<string, number>>

  // Cleanup methods
  deleteAllReservedByUserId(userId: string): Promise<number>
}

export const VOUCHER_USAGE_REPOSITORY = Symbol('IVoucherUsageRepository')
