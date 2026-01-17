import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { ScopeType, DiscountType } from '~/domain/enums/voucher.enum'


export const VoucherSchema = z.object({
  id: z.uuid(),
  shopId: z.uuid().nullable(),
  code: z.string().max(20),
  name: z.string().max(255),
  description: z.string(),
  discountType: z.enum(DiscountType),
  discountValue: z.number().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.number().nonnegative(),
  perUserLimit: z.number().nonnegative(),
  scope: z.enum(ScopeType),
  selectedProducts: z.array(z.uuid()).optional(), // Thêm trường này
  isDeleted: z.boolean(),
  deletedBy: z.uuid().nullable(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export class VoucherDto extends createZodDto(VoucherSchema) {}

export const CreateVoucherBodySchema = VoucherSchema.pick({
  shopId: true, 
  code: true,
  name: true,
  description: true,  
  discountType: true,
  discountValue: true,
  startDate: true,
  endDate: true,
  usageLimit: true, 
  perUserLimit: true,
  scope: true,
  selectedProducts: true,
})
export class CreateVoucherBodyDto extends createZodDto(CreateVoucherBodySchema) {}