// frontend/tests/cdp-client.mjs
// Lightweight Chrome DevTools Protocol (CDP) client using native Node.js 24 WebSocket and fetch

import { spawn } from 'child_process';
import { handleMockApiRequest, mockAmbassadorUser } from './mock-api.mjs';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const DEFAULT_CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export class CdpSession {
  constructor(ws, sessionId, sendFn) {
    this.ws = ws;
    this.sessionId = sessionId;
    this.sendRaw = sendFn;
  }

  async send(method, params = {}) {
    return this.sendRaw(method, params, this.sessionId);
  }

  async setViewport({ width, height = 800, deviceScaleFactor = 1, mobile = true }) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: Math.round(width),
      height: Math.round(height),
      deviceScaleFactor,
      mobile,
    });
    // Brief settle time for media query recalculations
    await sleep(80);
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.result?.exceptionDetails) {
      const desc = res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text;
      throw new Error(`CDP Evaluate Error: ${desc}`);
    }
    return res.result?.result?.value;
  }

  async navigate(url, options = {}) {
    await this.send('Page.navigate', { url });
    const timeoutMs = options.timeoutMs || 10000;
    const start = Date.now();

    // Poll until document.readyState === 'complete'
    while (Date.now() - start < timeoutMs) {
      try {
        const state = await this.evaluate('document.readyState');
        if (state === 'complete' || state === 'interactive') {
          await sleep(150);
          return;
        }
      } catch {}
      await sleep(100);
    }
  }

  async seedAuth(user = mockAmbassadorUser, token = 'mock-e2e-token-xyz') {
    const userStr = JSON.stringify(user);
    await this.evaluate(`
      localStorage.setItem('token', ${JSON.stringify(token)});
      localStorage.setItem('user', ${JSON.stringify(userStr)});
      localStorage.setItem('sessionTimestamp', String(Date.now()));
    `);
  }

  async waitForSelector(selector, options = {}) {
    const timeoutMs = options.timeout || 5000;
    const checkVisible = options.visible !== false;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const exists = await this.evaluate(`
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return false;
          if (${checkVisible}) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          }
          return true;
        })()
      `);
      if (exists) return true;
      await sleep(80);
    }
    throw new Error(`Selector "${selector}" not found or not visible within ${timeoutMs}ms`);
  }

  async isVisible(selector) {
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      })()
    `);
  }

  async click(selector) {
    const found = await this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.click();
        return true;
      })()
    `);
    if (!found) {
      throw new Error(`Click failed: element "${selector}" not found`);
    }
    await sleep(100);
  }

  async pressKey(key, code = key, windowsVirtualKeyCode = 0) {
    await this.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key,
      code,
      windowsVirtualKeyCode,
    });
    await sleep(30);
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode,
    });
    await sleep(100);
  }

  async pressEscape() {
    await this.pressKey('Escape', 'Escape', 27);
  }

  async getLayoutMetrics() {
    return this.evaluate(`
      (() => {
        const docEl = document.documentElement;
        const body = document.body;
        return {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          scrollWidth: Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0),
          scrollHeight: Math.max(docEl.scrollHeight, body ? body.scrollHeight : 0),
          clientWidth: docEl.clientWidth,
          clientHeight: docEl.clientHeight,
        };
      })()
    `);
  }

  async checkNoHorizontalOverflow() {
    const metrics = await this.getLayoutMetrics();
    const hasOverflow = metrics.scrollWidth > metrics.innerWidth;
    return {
      pass: !hasOverflow,
      scrollWidth: metrics.scrollWidth,
      innerWidth: metrics.innerWidth,
      overflowPx: hasOverflow ? metrics.scrollWidth - metrics.innerWidth : 0,
    };
  }

  async getBodyOverflowStyle() {
    return this.evaluate(`document.body.style.overflow || window.getComputedStyle(document.body).overflow`);
  }
}

export class CdpBrowser {
  constructor(chromeProc, ws, port) {
    this.chromeProc = chromeProc;
    this.ws = ws;
    this.port = port;
    this.id = 1;
    this.pending = new Map();
    this.sessionHandlers = new Map();

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          this.pending.get(msg.id)(msg);
          this.pending.delete(msg.id);
        } else if (msg.method) {
          if (msg.sessionId && this.sessionHandlers.has(msg.sessionId)) {
            this.sessionHandlers.get(msg.sessionId)(msg);
          }
        }
      } catch (e) {
        console.error('[CDP] Message parse error:', e);
      }
    };
  }

  send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      const timeout = setTimeout(() => {
        if (this.pending.has(msgId)) {
          this.pending.delete(msgId);
          reject(new Error(`CDP command ${method} timed out after 10000ms`));
        }
      }, 10000);

      this.pending.set(msgId, (res) => {
        clearTimeout(timeout);
        if (res.error) {
          reject(new Error(`CDP Error (${method}): ${res.error.message}`));
        } else {
          resolve(res);
        }
      });

      const payload = { id: msgId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      this.ws.send(JSON.stringify(payload));
    });
  }

  async newPage(options = {}) {
    const newTarget = await this.send('Target.createTarget', { url: 'about:blank' });
    const targetId = newTarget.result.targetId;

    const attachRes = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attachRes.result.sessionId;

    const session = new CdpSession(this.ws, sessionId, (method, params) =>
      this.send(method, params, sessionId)
    );

    // Setup network interception for API calls
    this.sessionHandlers.set(sessionId, async (msg) => {
      if (msg.method === 'Fetch.requestPaused') {
        const { requestId, request } = msg.params;
        try {
          const mockData = handleMockApiRequest(request.url);
          const body = JSON.stringify(mockData);
          const base64Body = Buffer.from(body).toString('base64');
          await session.send('Fetch.fulfillRequest', {
            requestId,
            responseCode: 200,
            responseHeaders: [
              { name: 'Content-Type', value: 'application/json' },
              { name: 'Access-Control-Allow-Origin', value: '*' },
            ],
            body: base64Body,
          });
        } catch (e) {
          try {
            await session.send('Fetch.continueRequest', { requestId });
          } catch {}
        }
      }
    });

    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    await session.send('Fetch.enable', {
      patterns: [{ urlPattern: '*api*', requestStage: 'Request' }],
    });

    return session;
  }

  async close() {
    try {
      this.ws.close();
    } catch {}
    try {
      if (process.platform === 'win32' && this.chromeProc?.pid) {
        spawn('taskkill', ['/pid', String(this.chromeProc.pid), '/f', '/t'], { stdio: 'ignore' });
      } else if (this.chromeProc) {
        this.chromeProc.kill('SIGTERM');
      }
    } catch {}
    await sleep(300);
  }
}

export async function launchCdpBrowser(options = {}) {
  const port = options.port || 9338;
  const chromePath = options.chromePath || DEFAULT_CHROME_PATH;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    'about:blank',
  ], { stdio: 'ignore' });

  const start = Date.now();
  let wsUrl = null;

  while (Date.now() - start < 10000) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await sleep(200);
  }

  if (!wsUrl) {
    try {
      chromeProc.kill();
    } catch {}
    throw new Error(`Failed to connect to Chrome CDP on port ${port}`);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  return new CdpBrowser(chromeProc, ws, port);
}
