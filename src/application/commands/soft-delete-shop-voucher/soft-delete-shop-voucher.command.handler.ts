import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { SoftDeleteShopVoucherCommand } from '~/application/commands/soft-delete-shop-voucher/soft-delete-shop-voucher.command'
import {
  VOUCHER_REPOSITORY,
  type IVoucherRepository,
} from '~/domain/repositories/voucher.repository.interface'
import { CACHE_EVENT, CACHE_RESOURCE, CACHE_TYPE } from '~/common/constants/cache.constant'

@CommandHandler(SoftDeleteShopVoucherCommand)
export class SoftDeleteShopVoucherHandler
  implements ICommandHandler<SoftDeleteShopVoucherCommand, void>
{
  constructor(
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: IVoucherRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: SoftDeleteShopVoucherCommand) {
    const { id, deletedById } = command

    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundException('Voucher not found')

    // Kiểm tra đây là voucher của shop (có shopId), không phải voucher sàn
    if (!voucher.shopId)
      throw new ForbiddenException('Cannot delete platform voucher using this API')

    // Soft delete voucher
    await this.voucherRepository.softDelete(id, deletedById)

    // Invalidate cache voucher detail + list
    this.eventEmitter.emit(CACHE_EVENT.INVALIDATE, {
      type: CACHE_TYPE.DETAIL,
      resource: CACHE_RESOURCE.VOUCHERS,
      id,
    })
    this.eventEmitter.emit(CACHE_EVENT.INVALIDATE, {
      type: CACHE_TYPE.LIST,
      resource: CACHE_RESOURCE.VOUCHERS,
    })
  }
}
