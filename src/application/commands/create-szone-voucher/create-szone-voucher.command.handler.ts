import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateSzoneVoucherCommand } from '~/application/commands/create-szone-voucher/create-szone-voucher.command'
import { Voucher } from '~/domain/entities/voucher.entity'
import { VOUCHER_REPOSITORY, type IVoucherRepository } from '~/domain/repositories/voucher.repository.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'


@CommandHandler(CreateSzoneVoucherCommand)
export class CreateSzoneVoucherHandler implements ICommandHandler<CreateSzoneVoucherCommand, void> {
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: CreateSzoneVoucherCommand) {
    const { body } = command

    const voucher = Voucher.create({
      shopId: null, // Szone voucher không có shopId
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

      // Xử lí business logic: Nếu scope là CATEGORY thì lưu thêm vào bảng VoucherCategory
      if (body.scope === 'CATEGORY' && body.selectedCategories && body.selectedCategories.length > 0) {
        await this.voucherRepository.createVoucherCategories(createdVoucher.id, body.selectedCategories, tx)
      }
    })
  }
}
