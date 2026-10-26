// Local board origin for development and browser tests: serves boards/dist on its own port
// (a different origin from the app) with the same headers as production (_headers).
import { resolve } from 'node:path';
import { serveOrigin } from './boards/serve.mjs';

const dir = resolve(new URL('../boards/dist', import.meta.url).pathname);
const { url } = await serveOrigin(dir, Number(process.env.BOARD_PORT ?? 5174));
console.log(`Board origin on ${url}`);
