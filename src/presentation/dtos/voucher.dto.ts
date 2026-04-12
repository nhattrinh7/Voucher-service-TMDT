import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { VoucherScopeType, DiscountType } from '~/domain/enums/voucher.enum'

//----------- Shop Voucher -----------
export const VoucherSchema = z.object({
  id: z.uuid(),
  shopId: z.uuid().optional().nullable(),
  code: z.string().max(20),
  name: z.string().max(255),
  description: z.string(),
  discountType: z.enum(DiscountType),
  discountValue: z.number().nonnegative(),
  minOrderValue: z.number().nonnegative(),
  maxDiscountValue: z.number().nonnegative().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.number().nonnegative(),
  perUserLimit: z.number().nonnegative(),
  scope: z.enum(VoucherScopeType),
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
  minOrderValue: true,
  maxDiscountValue: true,
  startDate: true,
  endDate: true,
  usageLimit: true,
  perUserLimit: true,
  scope: true,
}).extend({
  selectedProducts: z.array(z.uuid()).optional(),
  selectedCategories: z.array(z.uuid()).optional(),
})
export class CreateVoucherBodyDto extends createZodDto(CreateVoucherBodySchema) {}
export class UpdateVoucherBodyDto extends createZodDto(CreateVoucherBodySchema) {}

export const getSzoneVouchersPaginatedQueryDto = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1)) // chuyển kiểu dữ liệu sang int, nếu không có giá trị thì mặc định là 1
    .pipe(z.number().int().positive()), // xác thực lại sau khi chuyển kiểu dữ liệu

  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)) // chuyển kiểu dữ liệu sang int, nếu không có giá trị thì mặc định là 10
    .pipe(z.number().int().positive().max(10)),

  search: z
    .string()
    .optional()
    .transform(val => val || undefined),

  status: z.enum(['UPCOMING', 'ACTIVE', 'EXPIRED']).optional(),
})
export class GetSzoneVouchersPaginatedQueryDto extends createZodDto(
  getSzoneVouchersPaginatedQueryDto,
) {}

//Get Eligible Shop Vouchers
export const CartItemSchema = z.object({
  productId: z.uuid(),
  productVariantId: z.uuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})

export const GetEligibleShopVouchersBodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
})

export class GetEligibleShopVouchersBodyDto extends createZodDto(
  GetEligibleShopVouchersBodySchema,
) {}

// Get Eligible Szone Vouchers
export const GetEligibleSzoneVouchersBodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
})

export class GetEligibleSzoneVouchersBodyDto extends createZodDto(
  GetEligibleSzoneVouchersBodySchema,
) {}
