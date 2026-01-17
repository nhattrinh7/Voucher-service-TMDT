import { ICommand } from '@nestjs/cqrs'

export class DeleteVoucherCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly deletedById: string,
  ) {}
}
