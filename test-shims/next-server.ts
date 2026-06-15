export class NextRequest extends Request {
  readonly nextUrl: URL;

  constructor(input: ConstructorParameters<typeof Request>[0], init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(typeof input === 'string' || input instanceof URL ? input.toString() : input.url);
  }
}

export class NextResponse<T = unknown> extends Response {
  static json<TBody>(body: TBody, init?: ResponseInit): NextResponse<TBody> {
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    return new NextResponse<TBody>(JSON.stringify(body), {
      ...init,
      headers,
    });
  }
}
