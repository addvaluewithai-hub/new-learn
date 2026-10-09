import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = resolve(root, 'packages/lesson-runtime/src');
const allowed = new Set(['react', '@remotion/player', 'remotion']);
const excluded = new Set(['.git', 'node_modules', 'dist', 'test-results']);
const generated = new Set(['package-lock.json', 'fixtures/runtime-probe/audio-manifest.json']);
const sourceExtensions = /\.(?:tsx?|mjs|css|json|ya?ml|md|html)$/;
const errors = [];
let count = 0;
let largest = { path: '', lines: 0 };

async function scan(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    if (excluded.has(item.name)) continue;
    const path = resolve(folder, item.name);
    if (item.isSymbolicLink()) {
      errors.push(`Unexpected symlink: ${relative(root, path)}`);
      continue;
    }
    if (item.isDirectory()) {
      await scan(path);
      continue;
    }
    const name = relative(root, path).split(sep).join('/');
    if (!sourceExtensions.test(name) || generated.has(name)) continue;
    const content = await readFile(path, 'utf8');
    const lines = content.trimEnd().split('\n').length;
    count++;
    if (lines > largest.lines) largest = { path: name, lines };
    if (lines > 300) errors.push(`${name}: ${lines} lines (limit 300)`);
    if (!path.startsWith(runtime + sep)) continue;
    for (const match of content.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      if (specifier.startsWith('.')) {
        if (!resolve(dirname(path), specifier).startsWith(runtime + sep))
          errors.push(`${name}: runtime escape ${specifier}`);
      } else if (!allowed.has(specifier)) {
        errors.push(`${name}: runtime cannot depend on ${specifier}`);
      }
    }
  }
}
await scan(root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Boundaries and 300-line limit passed: ${count} authored files. Largest: ${largest.path} (${largest.lines}).`,
  );
}
