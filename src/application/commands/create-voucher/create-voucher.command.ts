import { ICommand } from '@nestjs/cqrs'
import { CreateVoucherBodyDto } from '~/presentation/dtos/voucher.dto';

export class CreateVoucherCommand implements ICommand {
  constructor(
    public readonly body: CreateVoucherBodyDto,
  ) {}
}
