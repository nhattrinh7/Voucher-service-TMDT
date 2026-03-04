export class SagaCancelVouchersCommand {
  constructor(
    public readonly userId: string,
    public readonly voucherIds: string[],
  ) {}
}
