import { IQuery } from '@nestjs/cqrs'

export class GetSzoneVouchersQuery implements IQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED',
    public readonly search?: string,
  ) {}
}
