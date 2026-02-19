import { IQuery } from '@nestjs/cqrs'

interface CartItem {
  productId: string
  productVariantId: string
  quantity: number
  price: number
}

export class GetEligibleSzoneVouchersQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly items: CartItem[],
  ) {}
}
