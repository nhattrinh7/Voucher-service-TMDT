import { AggregateRoot } from '@nestjs/cqrs'
import { v4 as uuidv4 } from 'uuid'
import { VoucherScopeType, DiscountType } from '~/domain/enums/voucher.enum'
import { CreateVoucherBodyDto, UpdateVoucherBodyDto } from '~/presentation/dtos/voucher.dto'

export class Voucher extends AggregateRoot {
  constructor(
    public id: string,
    public shopId: string | null,
    public code: string,
    public name: string,
    public description: string,
    public discountType: DiscountType,
    public discountValue: number,
    public startDate: Date,
    public endDate: Date,
    public usageLimit: number,
    public perUserLimit: number,
    public scope: VoucherScopeType,
    public isDeleted: boolean,
    public deletedBy: string | null,
    public deletedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
    super()
  }

  static create(props: CreateVoucherBodyDto): Voucher {
    const shop = new Voucher(
      uuidv4(),
      props.shopId || null,
      props.code,
      props.name,
      props.description,
      props.discountType,
      props.discountValue,
      props.startDate,
      props.endDate,
      props.usageLimit,
      props.perUserLimit,
      props.scope,
      false,
      null,
      null,
      new Date(),
      new Date(),
    )
    
    return shop
  }

  update(props: UpdateVoucherBodyDto): void {
    this.code = props.code
    this.name = props.name
    this.description = props.description
    this.discountType = props.discountType
    this.discountValue = props.discountValue
    this.startDate = props.startDate
    this.endDate = props.endDate
    this.usageLimit = props.usageLimit
    this.perUserLimit = props.perUserLimit
    this.scope = props.scope
    this.updatedAt = new Date()
  }
}