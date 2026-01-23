import { ICommand } from '@nestjs/cqrs'
import { UpdateVoucherBodyDto } from '~/presentation/dtos/voucher.dto'

export class UpdateSzoneVoucherCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateVoucherBodyDto,
  ) {}
}
