import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
export function launchBrowser() {
  const managed = chromium.executablePath();
  const executablePath =
    process.env.CHROMIUM_PATH ||
    (existsSync(managed)
      ? undefined
      : existsSync('/usr/bin/chromium')
        ? '/usr/bin/chromium'
        : undefined);
  return chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
}
