import { createServer } from 'vite';
// Own the temporary service and always close it, including on failed assertions.
const server = process.env.SMOKE_URL ? undefined : await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true } });
try {
  if (server) {
    await server.listen();
    process.env.SMOKE_URL = 'http://127.0.0.1:5174/';
  }
  await import('./browser-smoke.mjs');
} finally { await server?.close(); }
