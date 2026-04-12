import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateSzoneVoucherCommand } from '~/application/commands/update-szone-voucher/update-szone-voucher.command'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
} from '~/domain/repositories/voucher.repository.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'

@CommandHandler(UpdateSzoneVoucherCommand)
export class UpdateSzoneVoucherHandler implements ICommandHandler<UpdateSzoneVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: UpdateSzoneVoucherCommand) {
    const { id, data } = command

    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundException('Voucher not found')

    // Kiểm tra đây là voucher của sàn (không có shopId), không phải voucher của shop
    if (voucher.shopId) throw new ForbiddenException('Cannot update shop voucher using this API')

    // Update entity trước
    voucher.update(data)

    // Wrap tất cả DB writes trong transaction
    await this.prismaService.transaction(async tx => {
      // Lưu vào database
      await this.voucherRepository.update(voucher, tx)

      // Xử lý cập nhật VoucherCategory nếu scope là CATEGORY
      if (data.scope === 'CATEGORY' && data.selectedCategories) {
        // Xóa các category cũ
        await this.voucherRepository.deleteVoucherCategories(id, tx)
        // Thêm các category mới
        if (data.selectedCategories.length > 0) {
          await this.voucherRepository.createVoucherCategories(id, data.selectedCategories, tx)
        }
      }
    })
  }
}
