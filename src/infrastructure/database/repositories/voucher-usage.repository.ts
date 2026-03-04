import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IVoucherUsageRepository } from '~/domain/repositories/voucher-usage.repository.interface'
import { VoucherUsage } from '~/domain/entities/voucher-usage.entity'
import { VoucherUsageMapper } from '~/infrastructure/database/mappers/voucher-usage.mapper'

@Injectable()
export class VoucherUsageRepository implements IVoucherUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(voucherUsage: VoucherUsage, tx?: any): Promise<void> {
    const client = tx || this.prisma
    await client.voucherUsage.create({
      data: VoucherUsageMapper.toPersistence(voucherUsage),
    })
  }

  async findById(id: string): Promise<VoucherUsage | null> {
    const raw = await this.prisma.voucherUsage.findUnique({
      where: { id },
    })

    return raw ? VoucherUsageMapper.toDomain(raw) : null
  }

  async findByVoucherIdAndUserId(voucherId: string, userId: string): Promise<VoucherUsage[]> {
    const raws = await this.prisma.voucherUsage.findMany({
      where: {
        voucherId,
        userId,
      },
    })

    return raws.map(raw => VoucherUsageMapper.toDomain(raw))
  }

  async updateStatus(id: string, status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED'): Promise<void> {
    await this.prisma.voucherUsage.update({
      where: { id },
      data: { status },
    })
  }

  async updateOrderId(id: string, orderId: string): Promise<void> {
    await this.prisma.voucherUsage.update({
      where: { id },
      data: { orderId },
    })
  }

  async countByVoucherId(
    voucherId: string, 
    statuses: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[] = ['RESERVED', 'CONFIRMED']
  ): Promise<number> {
    return await this.prisma.voucherUsage.count({
      where: {
        voucherId,
        status: { in: statuses },
      },
    })
  }

  async countByUserAndVoucher(
    userId: string, 
    voucherId: string,
    statuses: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[] = ['RESERVED', 'CONFIRMED']
  ): Promise<number> {
    return await this.prisma.voucherUsage.count({
      where: {
        userId,
        voucherId,
        status: { in: statuses },
      },
    })
  }

  // dùng groupBy vì groupBy → trả về nhiều số, nhóm theo field. Ví dụ: "voucher A, B, C mỗi cái có bao nhiêu usage?" → {A: 5, B: 3, C: 0}
  // count trả về 1 số duy nhất cho 1 điều kiện. Ví dụ: "voucher A có bao nhiêu usage?" → 5, dùng count cho batch sẽ phải gọi N lần
  async countByVoucherIds(
    voucherIds: string[],
    statuses: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[] = ['RESERVED', 'CONFIRMED']
  ): Promise<Map<string, number>> {
    const results = await this.prisma.voucherUsage.groupBy({
      by: ['voucherId'],
      where: {
        voucherId: { in: voucherIds },
        status: { in: statuses },
      },
      _count: { voucherId: true },
    })

    const map = new Map<string, number>()
    for (const r of results) {
      map.set(r.voucherId, r._count.voucherId)
    }
    return map
  }

  async countByUserAndVoucherIds(
    userId: string,
    voucherIds: string[],
    statuses: ('RESERVED' | 'CONFIRMED' | 'CANCELLED')[] = ['RESERVED', 'CONFIRMED']
  ): Promise<Map<string, number>> {
    const results = await this.prisma.voucherUsage.groupBy({
      by: ['voucherId'],
      where: {
        userId,
        voucherId: { in: voucherIds },
        status: { in: statuses },
      },
      _count: { voucherId: true },
    })

    const map = new Map<string, number>()
    for (const r of results) {
      map.set(r.voucherId, r._count.voucherId)
    }
    return map
  }

  async deleteAllReservedByUserId(userId: string, tx?: any): Promise<number> {
    const client = tx || this.prisma
    const result = await client.voucherUsage.deleteMany({
      where: { userId, status: 'RESERVED' },
    })
    return result.count
  }

  async confirmByUserAndVoucherIds(userId: string, voucherIds: string[]): Promise<number> {
    const result = await this.prisma.voucherUsage.updateMany({
      where: {
        userId,
        voucherId: { in: voucherIds },
        status: 'RESERVED',
      },
      data: { status: 'CONFIRMED' },
    })
    return result.count
  }

  async cancelByUserAndVoucherIds(userId: string, voucherIds: string[]): Promise<number> {
    const result = await this.prisma.voucherUsage.updateMany({
      where: {
        userId,
        voucherId: { in: voucherIds },
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
      data: { status: 'CANCELLED' },
    })
    return result.count
  }
}
