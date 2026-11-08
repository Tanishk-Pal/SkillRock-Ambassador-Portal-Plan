// frontend/tests/server-manager.mjs
// Manages Vite preview / dev server lifecycle for automated E2E tests

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isPortResponding(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

export async function ensureServer(options = {}) {
  const port = options.port || 5174;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Check if server is already running
  if (await isPortResponding(baseUrl)) {
    console.log(`[ServerManager] Existing server detected on ${baseUrl}`);
    return {
      port,
      baseUrl,
      spawned: false,
      teardown: async () => {},
    };
  }

  console.log(`[ServerManager] Starting vite preview on ${baseUrl}...`);

  // Use cmd.exe on Windows to run npm run preview with host 127.0.0.1
  const cmd = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const args = process.platform === 'win32'
    ? ['/c', `npm run preview -- --port ${port} --host 127.0.0.1`]
    : ['run', 'preview', '--', '--port', String(port), '--host', '127.0.0.1'];

  const serverProc = spawn(cmd, args, {
    cwd: frontendDir,
    stdio: 'pipe',
  });

  serverProc.stdout.on('data', (d) => {
    // console.log(`[Vite stdout] ${d.toString().trim()}`);
  });
  serverProc.stderr.on('data', (d) => {
    console.error(`[Vite stderr] ${d.toString().trim()}`);
  });

  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 20000;

  while (Date.now() - startTime < timeoutMs) {
    if (await isPortResponding(baseUrl)) {
      console.log(`[ServerManager] Vite preview server is ready on ${baseUrl}`);
      return {
        port,
        baseUrl,
        spawned: true,
        teardown: async () => {
          console.log('[ServerManager] Tearing down Vite preview server...');
          try {
            if (process.platform === 'win32' && serverProc.pid) {
              spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t'], { stdio: 'ignore' });
            } else {
              serverProc.kill('SIGTERM');
            }
          } catch (e) {
            console.error('[ServerManager] Teardown error:', e.message);
          }
          await sleep(500);
        },
      };
    }
    await sleep(250);
  }

  // If we reach here, startup timed out
  try {
    if (serverProc.pid) {
      spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t'], { stdio: 'ignore' });
    }
  } catch {}
  throw new Error(`[ServerManager] Timed out waiting for Vite server on ${baseUrl}`);
}
