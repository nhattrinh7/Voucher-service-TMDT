import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SoftDeleteSzoneVoucherCommand } from '~/application/commands/soft-delete-szone-voucher/soft-delete-szone-voucher.command'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
} from '~/domain/repositories/voucher.repository.interface'

@CommandHandler(SoftDeleteSzoneVoucherCommand)
export class SoftDeleteSzoneVoucherHandler
  implements ICommandHandler<SoftDeleteSzoneVoucherCommand, void>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(command: SoftDeleteSzoneVoucherCommand) {
    const { id, deletedById } = command

    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundException('Voucher not found')

    // Kiểm tra đây là voucher của sàn (không có shopId), không phải voucher của shop
    if (voucher.shopId) throw new ForbiddenException('Cannot delete shop voucher using this API')

    // Soft delete voucher
    await this.voucherRepository.softDelete(id, deletedById)
  }
}
