export const GATEWAY_CLOSE_CODES = Object.freeze({
  invalidFrame: 4400,
  unauthorized: 4401,
  backpressure: 4008,
  rateLimit: 4029,
});

export class GatewayProtocolError extends Error {
  readonly closeCode: number;

  constructor(message: string, closeCode: number) {
    super(message);
    this.name = 'GatewayProtocolError';
    this.closeCode = closeCode;
  }
}
