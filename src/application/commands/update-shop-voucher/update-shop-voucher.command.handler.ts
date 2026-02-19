import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpdateShopVoucherCommand } from '~/application/commands/update-shop-voucher/update-shop-voucher.command'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'


@CommandHandler(UpdateShopVoucherCommand)
export class UpdateShopVoucherHandler implements ICommandHandler<UpdateShopVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: UpdateShopVoucherCommand) {
    const { id, data } = command

    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundException('Voucher not found')
    
    // Kiểm tra đây là voucher của shop (có shopId), không phải voucher sàn
    if (!voucher.shopId) throw new ForbiddenException('Cannot update platform voucher using this API')
    
    // Update entity trước
    voucher.update(data)
    
    // Wrap tất cả DB writes trong transaction
    await this.prismaService.transaction(async (tx) => {
      // Lưu vào database
      await this.voucherRepository.update(voucher, tx)

      // Xử lý cập nhật VoucherProduct nếu scope là PRODUCT
      if (data.scope === 'PRODUCT' && data.selectedProducts) {
        // Xóa các product cũ
        await this.voucherRepository.deleteVoucherProducts(id, tx)
        // Thêm các product mới
        if (data.selectedProducts.length > 0) {
          await this.voucherRepository.createVoucherProducts(id, data.selectedProducts, tx)
        }
      }
    })
  }
}
