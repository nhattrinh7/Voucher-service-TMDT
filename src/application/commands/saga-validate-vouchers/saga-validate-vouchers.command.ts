export class SagaValidateVouchersCommand {
  constructor(
    public readonly sagaId: string,
    public readonly userId: string,
    public readonly shopVouchers: Array<{
      voucherId: string
      orderValue: number
      items: Array<{ productId: string; categoryId: string }>
    }>,
    public readonly szoneVoucher?: {
      voucherId: string
      orderValue: number
      items: Array<{ productId: string; categoryId: string }>
    },
  ) {}
}
