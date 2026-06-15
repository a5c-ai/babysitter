export interface PairingRecord {
  code: string;
  url: string;
  token: string;
  expiresAt: number;
}

export class ShortCodeStore {
  private readonly records = new Map<string, PairingRecord>();

  constructor(private readonly ttlMs: number = 5 * 60 * 1000) {}

  generateCode(length: number = 8): string {
    const digits = '0123456789';
    let code = '';
    do {
      code = '';
      for (let index = 0; index < length; index += 1) {
        code += digits[Math.floor(Math.random() * digits.length)]!;
      }
      this.cleanup();
    } while (this.records.has(code));
    return code;
  }

  register(input: { code?: string; url: string; token: string; ttlMs?: number }): PairingRecord {
    const code = input.code?.trim() || this.generateCode();
    const record: PairingRecord = {
      code,
      url: input.url,
      token: input.token,
      expiresAt: Date.now() + (input.ttlMs ?? this.ttlMs),
    };
    this.records.set(code, record);
    return record;
  }

  consume(code: string): PairingRecord | null {
    const record = this.records.get(code);
    if (!record) {
      return null;
    }
    this.records.delete(code);
    if (record.expiresAt <= Date.now()) {
      return null;
    }
    return record;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [code, record] of this.records.entries()) {
      if (record.expiresAt <= now) {
        this.records.delete(code);
      }
    }
  }
}
