import { VoucherUsage } from '~/domain/entities/voucher-usage.entity'

export class VoucherUsageMapper {
  static toDomain(raw: any): VoucherUsage {
    return VoucherUsage.reconstitute({
      id: raw.id,
      voucherId: raw.voucherId,
      userId: raw.userId,
      orderId: raw.orderId,
      status: raw.status,
      appliedAt: raw.appliedAt,
    })
  }

  static toPersistence(voucherUsage: VoucherUsage): any {
    const plain = voucherUsage.toPlainObject()
    return {
      id: plain.id,
      voucherId: plain.voucherId,
      userId: plain.userId,
      orderId: plain.orderId,
      status: plain.status,
      appliedAt: plain.appliedAt,
    }
  }
}
