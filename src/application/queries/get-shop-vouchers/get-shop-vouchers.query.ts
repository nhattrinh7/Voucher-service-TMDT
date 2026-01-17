import { IQuery } from '@nestjs/cqrs'

export class GetShopVouchersQuery implements IQuery {
  constructor(
    public readonly shopId: string, 
  ) {}
}
