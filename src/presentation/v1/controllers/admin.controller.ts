import {
  Controller,
  Headers,
  Body,
  Post,
  Get,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateSzoneVoucherCommand } from '~/application/commands/create-szone-voucher/create-szone-voucher.command'
import { SoftDeleteSzoneVoucherCommand } from '~/application/commands/soft-delete-szone-voucher/soft-delete-szone-voucher.command'
import { UpdateSzoneVoucherCommand } from '~/application/commands/update-szone-voucher/update-szone-voucher.command'
import { CreateVoucherBodyDto, UpdateVoucherBodyDto } from '~/presentation/dtos/voucher.dto'


@Controller('v1/admin/vouchers')
export class AdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  async createSzoneVoucher(
    @Body() body: CreateVoucherBodyDto,
  ): Promise<any> {
    await this.commandBus.execute(new CreateSzoneVoucherCommand(body))

    return { message: 'Create Szone voucher successful' }
  }

  @Delete('/:id')
  async softDeleteSzoneVoucher(
    @Param('id') id: string,
    @Headers('x-user-id') deletedById: string,
  ): Promise<any> {
    await this.commandBus.execute(new SoftDeleteSzoneVoucherCommand(id, deletedById))

    return { message: 'Delete szone voucher successful' }
  }

  @Put('/:id')
  async updateSzoneVoucher(
    @Param('id') id: string,
    @Body() body: UpdateVoucherBodyDto,
  ): Promise<any> {
    await this.commandBus.execute(new UpdateSzoneVoucherCommand(id, body))

    return { message: 'Update szone voucher successful' }
  }

}

