export class GatewayClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayClientError';
  }
}

export class GatewayClientTimeoutError extends GatewayClientError {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayClientTimeoutError';
  }
}

export class GatewayClientDisconnectedError extends GatewayClientError {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayClientDisconnectedError';
  }
}
