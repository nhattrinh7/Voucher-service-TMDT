import { ICommand } from '@nestjs/cqrs'

export class SoftDeleteShopVoucherCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly deletedById: string,
  ) {}
}
