declare module 'qrcode' {
  const QRCode: {
    toDataURL(text: string, options?: Record<string, unknown>): Promise<string>;
  };

  export default QRCode;
}
