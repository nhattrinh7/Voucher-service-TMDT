import { IQuery } from '@nestjs/cqrs'

export class GetVoucherDetailByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
