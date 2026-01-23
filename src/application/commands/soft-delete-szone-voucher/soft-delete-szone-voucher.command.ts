import { ICommand } from '@nestjs/cqrs'

export class SoftDeleteSzoneVoucherCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly deletedById: string,
  ) {}
}
