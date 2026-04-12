import { ICommand } from '@nestjs/cqrs'
import { CreateVoucherBodyDto } from '~/presentation/dtos/voucher.dto'

export class CreateShopVoucherCommand implements ICommand {
  constructor(public readonly body: CreateVoucherBodyDto) {}
}
