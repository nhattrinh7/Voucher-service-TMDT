export class ValidateVouchersBatchQuery {
  constructor(
    public readonly userId: string,
    public readonly vouchers: Array<{
      voucherId: string
      orderValue: number
      items?: Array<{
        productId: string
        categoryId: string
      }>
    }>,
  ) {}
}
