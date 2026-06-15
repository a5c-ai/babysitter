function roomUrlWithJwt(roomUrl, jwt) {
  if (!jwt) return roomUrl;
  const url = new URL(roomUrl);
  url.searchParams.set('jwt', jwt);
  return url.toString();
}

export function createPuppeteerJitsiClient(config = {}) {
  let browser = null;
  let page = null;

  async function evaluateBestEffort(fn, ...args) {
    if (!page) return;
    try {
      await page.evaluate(fn, ...args);
    } catch {
      // Jitsi UI APIs vary by deployment; IPC command acknowledgement should not crash the sidecar.
    }
  }

  return {
    async connect(overrides = {}) {
      const runtimeConfig = { ...config, ...overrides };
      const puppeteer = await import('puppeteer-core');
      browser = await puppeteer.launch({
        headless: runtimeConfig.headless ?? true,
        executablePath: runtimeConfig.chromiumExecutablePath || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH || 'chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--autoplay-policy=no-user-gesture-required',
        ],
      });
      page = await browser.newPage();
      await page.goto(roomUrlWithJwt(runtimeConfig.roomUrl, runtimeConfig.jwt), { waitUntil: 'domcontentloaded', timeout: 30000 });
      await evaluateBestEffort((name) => {
        window.localStorage.setItem('displayname', name || 'Kradle Agent');
      }, runtimeConfig.participantName);
      return { connected: true, participants: [{ id: 'agent', name: runtimeConfig.participantName || 'Kradle Agent' }] };
    },

    async sendChat(text) {
      await evaluateBestEffort((message) => {
        const api = window.APP?.conference;
        if (api?.sendMessage) api.sendMessage(message);
      }, text);
    },

    async raiseHand() {
      await evaluateBestEffort(() => window.APP?.conference?.room?.setRaisedHand?.(true));
    },

    async lowerHand() {
      await evaluateBestEffort(() => window.APP?.conference?.room?.setRaisedHand?.(false));
    },

    async react(emoji) {
      await evaluateBestEffort((value) => window.APP?.conference?.sendEndpointMessage?.('', { type: 'reaction', emoji: value }), emoji);
    },

    async shareScreen(url) {
      await evaluateBestEffort((value) => window.open(value, '_blank'), url);
    },

    async disconnect() {
      if (page) {
        await evaluateBestEffort(() => window.APP?.conference?.hangup?.());
        await page.close().catch(() => {});
        page = null;
      }
      if (browser) {
        await browser.close().catch(() => {});
        browser = null;
      }
    },
  };
}
