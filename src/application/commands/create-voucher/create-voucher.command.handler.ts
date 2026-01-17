import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateVoucherCommand } from '~/application/commands/create-voucher/create-voucher.command'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'


@CommandHandler(CreateVoucherCommand)
export class CreateVoucherHandler implements ICommandHandler<CreateVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(command: CreateVoucherCommand) {
    const { body } = command

    const voucher = Voucher.create({
      shopId: body.shopId,
      code: body.code,
      name: body.name,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      startDate: body.startDate,
      endDate: body.endDate,
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit,
      scope: body.scope,
    })

    // Tạo voucher
    const createdVoucher = await this.voucherRepository.create(voucher)

    // Xử lí business logic: Nếu scope là PRODUCT thì lưu thêm vào bảng VoucherProduct
    if (body.scope === 'PRODUCT' && body.selectedProducts && body.selectedProducts.length > 0) {
      await this.voucherRepository.createVoucherProducts(createdVoucher.id, body.selectedProducts)
    }
  }
}
