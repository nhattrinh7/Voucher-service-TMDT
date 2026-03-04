export class SagaConfirmVouchersCommand {
  constructor(
    public readonly sagaId: string,
    public readonly userId: string,
    public readonly voucherIds: string[],
  ) {}
}
