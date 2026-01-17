import { Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { DeleteVoucherCommand } from '~/application/commands/delete-voucher/delete-voucher.command'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'


@CommandHandler(DeleteVoucherCommand)
export class DeleteVoucherHandler implements ICommandHandler<DeleteVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(command: DeleteVoucherCommand) {
    const { id, deletedById } = command

    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundException('Voucher not found')
    
    // Soft delete voucher
    await this.voucherRepository.delete(id, deletedById)
  }
}
