-- CreateEnum
CREATE TYPE "VoucherUsageStatus" AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('ALL', 'CATEGORY', 'PRODUCT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENT');

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "shop_id" UUID,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "min_order_value" INTEGER NOT NULL DEFAULT 0,
    "max_discount_value" INTEGER,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "usage_limit" INTEGER NOT NULL,
    "per_user_limit" INTEGER NOT NULL,
    "scope" "ScopeType" NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_by" UUID,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_usages" (
    "id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "status" "VoucherUsageStatus" NOT NULL DEFAULT 'RESERVED',
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_categories" (
    "voucher_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "voucher_categories_pkey" PRIMARY KEY ("voucher_id","category_id")
);

-- CreateTable
CREATE TABLE "voucher_products" (
    "voucher_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "voucher_products_pkey" PRIMARY KEY ("voucher_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_shop_id_is_deleted_created_at_idx" ON "vouchers"("shop_id", "is_deleted", "created_at" DESC);

-- CreateIndex
CREATE INDEX "vouchers_shop_id_is_deleted_start_date_end_date_idx" ON "vouchers"("shop_id", "is_deleted", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "vouchers_shop_id_is_deleted_start_date_end_date_min_order_v_idx" ON "vouchers"("shop_id", "is_deleted", "start_date", "end_date", "min_order_value");

-- CreateIndex
CREATE INDEX "voucher_usages_voucher_id_status_idx" ON "voucher_usages"("voucher_id", "status");

-- CreateIndex
CREATE INDEX "voucher_usages_user_id_voucher_id_status_idx" ON "voucher_usages"("user_id", "voucher_id", "status");

-- CreateIndex
CREATE INDEX "voucher_usages_user_id_status_idx" ON "voucher_usages"("user_id", "status");

-- AddForeignKey
ALTER TABLE "voucher_usages" ADD CONSTRAINT "voucher_usages_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_categories" ADD CONSTRAINT "voucher_categories_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_products" ADD CONSTRAINT "voucher_products_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
