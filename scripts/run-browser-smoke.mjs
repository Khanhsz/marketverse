import { createServer, preview } from 'vite';
let stop;
// Own temporary services; an explicit SMOKE_URL always belongs to the caller.
try {
  if (!process.env.SMOKE_URL) {
    if (process.env.BROWSER_PRODUCTION === '1') {
      const server = await preview({
        preview: { host: '127.0.0.1', port: 5174, strictPort: true },
      });
      stop = () =>
        new Promise((resolve) => {
          server.httpServer.close(resolve);
          server.httpServer.closeAllConnections();
        });
    } else {
      const server = await createServer({
        server: { host: '127.0.0.1', port: 5174, strictPort: true },
      });
      await server.listen();
      stop = () => server.close();
    }
    process.env.SMOKE_URL = 'http://127.0.0.1:5174/' + (process.env.BROWSER_SUITE === './browser-visual.mjs' ? '' : '?view=classic');
  }
  await import(process.env.BROWSER_SUITE || './browser-smoke.mjs');
} finally {
  await stop?.();
}
