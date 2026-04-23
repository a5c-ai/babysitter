import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@a5c-ai/compendium';

import { copyToClipboard } from '../web-only/clipboard.js';
import { useGatewayAuth, useGatewayFetch } from '../providers/GatewayProvider.js';

function randomCode(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
}

export function PairDevicePage(): JSX.Element {
  const { auth } = useGatewayAuth();
  const fetchGateway = useGatewayFetch();
  const [code] = useState(() => randomCode());
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const qrPayload = useMemo(
    () => JSON.stringify({ url: auth?.gatewayUrl, token: auth?.token }),
    [auth?.gatewayUrl, auth?.token],
  );

  useEffect(() => {
    void QRCode.toDataURL(qrPayload, { margin: 1, width: 256 }).then(setQrDataUrl);
  }, [qrPayload]);

  useEffect(() => {
    if (!auth) {
      return;
    }
    void fetchGateway('/api/v1/pairing/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        code,
        url: auth.gatewayUrl,
        token: auth.token,
      }),
    })
      .then((response) => response.json() as Promise<{ expiresAt: number }>)
      .then((body) => setExpiresAt(body.expiresAt));
  }, [auth, code, fetchGateway]);

  return (
    <section className="pairing-layout">
      <article className="panel">
        <header><h2>Direct QR pairing</h2></header>
        <p>Scan this from a phone to attach immediately with the current token.</p>
        {qrDataUrl ? <img className="qr" src={qrDataUrl} alt="Pairing QR code" /> : <p>Rendering QR…</p>}
      </article>
      <article className="panel">
        <header><h2>Short code pairing</h2></header>
        <p>Use this for TV and no-camera flows. Codes expire after five minutes and are consumed once.</p>
        <div className="pairing-code">{code}</div>
        <div className="actions">
          <Button type="button" onClick={() => void copyToClipboard(code)}>
            Copy code
          </Button>
          <Button type="button" variant="ghost" onClick={() => void copyToClipboard(qrPayload)}>
            Copy QR payload
          </Button>
        </div>
        <p>{expiresAt ? `Expires at ${new Date(expiresAt).toLocaleTimeString()}` : 'Registering code…'}</p>
      </article>
    </section>
  );
}
