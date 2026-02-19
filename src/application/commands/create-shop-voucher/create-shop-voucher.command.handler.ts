import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateShopVoucherCommand } from '~/application/commands/create-shop-voucher/create-shop-voucher.command'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'


@CommandHandler(CreateShopVoucherCommand)
export class CreateShopVoucherHandler implements ICommandHandler<CreateShopVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: CreateShopVoucherCommand) {
    const { body } = command

    const voucher = Voucher.create({
      shopId: body.shopId,
      code: body.code,
      name: body.name,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderValue: body.minOrderValue,
      maxDiscountValue: body.maxDiscountValue,
      startDate: body.startDate,
      endDate: body.endDate,
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit,
      scope: body.scope,
    })

    // Wrap tất cả DB writes trong transaction
    await this.prismaService.transaction(async (tx) => {
      // Tạo voucher
      const createdVoucher = await this.voucherRepository.create(voucher, tx)

      // Xử lí business logic: Nếu scope là PRODUCT thì lưu thêm vào bảng VoucherProduct
      if (body.scope === 'PRODUCT' && body.selectedProducts && body.selectedProducts.length > 0) {
        await this.voucherRepository.createVoucherProducts(createdVoucher.id, body.selectedProducts, tx)
      }
    })
  }
}
