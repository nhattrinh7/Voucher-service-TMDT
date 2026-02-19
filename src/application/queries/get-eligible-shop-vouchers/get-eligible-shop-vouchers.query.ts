import { IQuery } from '@nestjs/cqrs'

interface CartItem {
  productId: string
  productVariantId: string
  quantity: number
  price: number
}

export class GetEligibleShopVouchersQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly shopId: string,
    public readonly items: CartItem[],
  ) {}
}
