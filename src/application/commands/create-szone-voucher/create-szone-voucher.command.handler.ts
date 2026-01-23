import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateSzoneVoucherCommand } from '~/application/commands/create-szone-voucher/create-szone-voucher.command'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'


@CommandHandler(CreateSzoneVoucherCommand)
export class CreateSzoneVoucherHandler implements ICommandHandler<CreateSzoneVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
  ) {}

  async execute(command: CreateSzoneVoucherCommand) {
    const { body } = command

    const voucher = Voucher.create({
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

    // Xử lí business logic: Nếu scope là CATEGORY thì lưu thêm vào bảng VoucherCategory
    if (body.scope === 'CATEGORY' && body.selectedCategories && body.selectedCategories.length > 0) {
      await this.voucherRepository.createVoucherCategories(createdVoucher.id, body.selectedCategories)
    }
  }
}
