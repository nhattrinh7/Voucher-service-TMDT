export type VoucherUsageStatus = 'RESERVED' | 'CONFIRMED' | 'CANCELLED'

interface VoucherUsageProps {
  id: string
  voucherId: string
  userId: string
  orderId: string | null
  status: VoucherUsageStatus
  appliedAt: Date
}

export class VoucherUsage {
  private constructor(private readonly props: VoucherUsageProps) {}

  static create(props: VoucherUsageProps): VoucherUsage {
    return new VoucherUsage(props)
  }

  static reconstitute(props: VoucherUsageProps): VoucherUsage {
    return new VoucherUsage(props)
  }

  get id(): string {
    return this.props.id
  }

  get voucherId(): string {
    return this.props.voucherId
  }

  get userId(): string {
    return this.props.userId
  }

  get orderId(): string | null {
    return this.props.orderId
  }

  get status(): VoucherUsageStatus {
    return this.props.status
  }

  get appliedAt(): Date {
    return this.props.appliedAt
  }

  updateStatus(status: VoucherUsageStatus): void {
    this.props.status = status
  }

  updateOrderId(orderId: string): void {
    this.props.orderId = orderId
  }

  toPlainObject(): VoucherUsageProps {
    return {
      id: this.props.id,
      voucherId: this.props.voucherId,
      userId: this.props.userId,
      orderId: this.props.orderId,
      status: this.props.status,
      appliedAt: this.props.appliedAt,
    }
  }
}
