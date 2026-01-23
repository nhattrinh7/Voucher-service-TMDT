import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SoftDeleteShopVoucherCommand } from '~/application/commands/soft-delete-shop-voucher/soft-delete-shop-voucher.command'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'


@CommandHandler(SoftDeleteShopVoucherCommand)
export class SoftDeleteShopVoucherHandler implements ICommandHandler<SoftDeleteShopVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(command: SoftDeleteShopVoucherCommand) {
    const { id, deletedById } = command

    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundException('Voucher not found')
    
    // Kiểm tra đây là voucher của shop (có shopId), không phải voucher sàn
    if (!voucher.shopId) throw new ForbiddenException('Cannot delete platform voucher using this API')
    
    // Soft delete voucher
    await this.voucherRepository.softDelete(id, deletedById)
  }
}
