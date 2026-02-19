export class ReserveVoucherUsageCommand {
  constructor(
    public readonly voucherId: string,
    public readonly userId: string,
  ) {}
}
