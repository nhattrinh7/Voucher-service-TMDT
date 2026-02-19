export class ValidateVoucherQuery {
  constructor(
    public readonly voucherId: string,
    public readonly userId: string,
    public readonly orderValue: number,
    public readonly items?: Array<{
      productId: string
      categoryId: string
    }>,
  ) {}
}
