import {
  Controller,
  Headers,
  Body,
  Post,
  Get,
  Param,
  Query,
  Delete,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateVoucherCommand } from '~/application/commands/create-voucher/create-voucher.command'
import { DeleteVoucherCommand } from '~/application/commands/delete-voucher/delete-voucher.command'
import { GetShopVouchersQuery } from '~/application/queries/get-shop-vouchers/get-shop-vouchers.query'
import { CreateVoucherBodyDto } from '~/presentation/dtos/voucher.dto'


@Controller('v1/vouchers')
export class VoucherController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/')
  async getShopVouchers(
    @Query('shopId') shopId: string,
  ): Promise<any> {
    const vouchers = await this.queryBus.execute(new GetShopVouchersQuery(shopId))

    return { message: 'Get shop vouchers successful', data: vouchers }
  }

  @Post('/')
  async createVoucher(
    @Body() body: CreateVoucherBodyDto,
  ): Promise<any> {
    await this.commandBus.execute(new CreateVoucherCommand(body))

    return { message: 'Create voucher successful' }
  }

  @Delete('/:id')
  async deleteVoucher(
    @Param('id') id: string,
    @Headers('x-user-id') deletedById: string,
  ): Promise<any> {
    await this.commandBus.execute(new DeleteVoucherCommand(id, deletedById))

    return { message: 'Delete voucher successful' }
  }

}

