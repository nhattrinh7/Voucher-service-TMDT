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
  UseInterceptors,
} from '@nestjs/common'
import { CacheTTL } from '@nestjs/cache-manager'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateShopVoucherCommand } from '~/application/commands/create-shop-voucher/create-shop-voucher.command'
import { SoftDeleteShopVoucherCommand } from '~/application/commands/soft-delete-shop-voucher/soft-delete-shop-voucher.command'
import { UpdateShopVoucherCommand } from '~/application/commands/update-shop-voucher/update-shop-voucher.command'
import { GetShopVouchersQuery } from '~/application/queries/get-shop-vouchers/get-shop-vouchers.query'
import { GetSzoneVouchersQuery } from '~/application/queries/get-szone-vouchers/get-szone-vouchers.query'
import { GetVoucherDetailByIdQuery } from '~/application/queries/get-voucher-detail-by-id/get-voucher-detail-by-id.query'
import { GetEligibleShopVouchersQuery } from '~/application/queries/get-eligible-shop-vouchers/get-eligible-shop-vouchers.query'
import { GetEligibleSzoneVouchersQuery } from '~/application/queries/get-eligible-szone-vouchers/get-eligible-szone-vouchers.query'
import {
  CreateVoucherBodyDto,
  GetSzoneVouchersPaginatedQueryDto,
  UpdateVoucherBodyDto,
  GetEligibleShopVouchersBodyDto,
  GetEligibleSzoneVouchersBodyDto,
} from '~/presentation/dtos/voucher.dto'
import { CustomCacheInterceptor } from '~/infrastructure/cache/custom-cache.interceptor'
import { CacheType } from '~/infrastructure/cache/cache-type.decorator'
import { CacheResource } from '~/infrastructure/cache/cache-prefix.decorator'
import { CACHE_TYPE, CACHE_RESOURCE } from '~/common/constants/cache.constant'

@Controller('v1/vouchers')
export class VoucherController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/')
  @UseInterceptors(CustomCacheInterceptor)
  @CacheType(CACHE_TYPE.LIST)
  @CacheResource(CACHE_RESOURCE.VOUCHERS)
  @CacheTTL(300_000) // 5 phút
  async getShopVouchers(@Query('shopId') shopId: string): Promise<any> {
    const vouchers = await this.queryBus.execute(new GetShopVouchersQuery(shopId))

    return { message: 'Get shop vouchers successful', data: vouchers }
  }

  @Get('/szone')
  async getSzoneVouchersPaginated(@Query() query: GetSzoneVouchersPaginatedQueryDto): Promise<any> {
    const result = await this.queryBus.execute(
      new GetSzoneVouchersQuery(query.page, query.limit, query.status, query.search),
    )

    return { message: 'Get zone vouchers successful', data: result }
  }

  @Post('/')
  async createShopVoucher(@Body() body: CreateVoucherBodyDto): Promise<any> {
    await this.commandBus.execute(new CreateShopVoucherCommand(body))

    return { message: 'Create shop voucher successful' }
  }

  @Delete('/:id')
  async softDeleteShopVoucher(
    @Param('id') id: string,
    @Headers('x-user-id') deletedById: string,
  ): Promise<any> {
    await this.commandBus.execute(new SoftDeleteShopVoucherCommand(id, deletedById))

    return { message: 'Delete voucher successful' }
  }

  @Get('/:id')
  @UseInterceptors(CustomCacheInterceptor)
  @CacheType(CACHE_TYPE.DETAIL)
  @CacheResource(CACHE_RESOURCE.VOUCHERS)
  @CacheTTL(300_000) // 5 phút
  async getVoucherDetailById(@Param('id') id: string): Promise<any> {
    const voucher = await this.queryBus.execute(new GetVoucherDetailByIdQuery(id))

    return { message: 'Get voucher detail successful', data: voucher }
  }

  @Put('/:id')
  async updateShopVoucher(
    @Param('id') id: string,
    @Body() body: UpdateVoucherBodyDto,
  ): Promise<any> {
    await this.commandBus.execute(new UpdateShopVoucherCommand(id, body))

    return { message: 'Update shop voucher successful' }
  }

  @Post('/shops/:shopId/eligible')
  async getEligibleShopVouchers(
    @Param('shopId') shopId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: GetEligibleShopVouchersBodyDto,
  ): Promise<any> {
    const vouchers = await this.queryBus.execute(
      new GetEligibleShopVouchersQuery(userId, shopId, body.items),
    )

    return { message: 'Get eligible shop vouchers successful', data: { vouchers } }
  }

  @Post('/platform-vouchers/eligible')
  async getEligibleSzoneVouchers(
    @Headers('x-user-id') userId: string,
    @Body() body: GetEligibleSzoneVouchersBodyDto,
  ): Promise<any> {
    const vouchers = await this.queryBus.execute(
      new GetEligibleSzoneVouchersQuery(userId, body.items),
    )

    return { message: 'Get eligible platform vouchers successful', data: { vouchers } }
  }
}
