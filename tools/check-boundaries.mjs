import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = resolve(root, 'packages/lesson-runtime/src');
const allowed = new Set(['react', 'react-dom', '@remotion/player', 'remotion']);
const excluded = new Set([
  '.git',
  'node_modules',
  'dist',
  'test-results',
  '.functions-check',
  '.wrangler',
  '.browser-tmp',
]);
const generated = new Set([
  'package-lock.json',
  'fixtures/runtime-probe/audio-manifest.json',
  'content/chemistry/states-of-matter/data/manifest.json',
  'database/migrations/meta/0000_snapshot.json',
  // Imported catalog data grows with curricula; its generated JSON is not authored code.
  'content/imported/registry.json',
  'apps/platform/content-modules.json',
  // Board editions (tools/build-boards.mjs): one entry per built board, not authored code.
  'apps/platform/src/features/boards/editions.generated.json',
  // Style guides with their reference boards (tools/style-guides.mjs), for get_style.
  'apps/platform/server/styles/styles.generated.json',
  // The server's messages from every language file (tools/i18n.mjs).
  'apps/platform/server/i18n/messages.generated.json',
]);
const sourceExtensions = /\.(?:tsx?|mjs|css|json|ya?ml|md|html|sql)$/;
const errors = [];
const AIM = 300;
const HARD = 800;
const long = [];
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
    if (
      !sourceExtensions.test(name) ||
      generated.has(name) ||
      /^database\/migrations\/meta\/\d+_snapshot\.json$/.test(name) ||
      // Language files are translation data, one per language (docs/i18n.md), not code.
      /^apps\/platform\/src\/i18n\/locales\/[\w-]+\.json$/.test(name) ||
      /^content\/imported\/[a-z0-9-]+\/[a-z0-9-]+\/(reading|lesson)\.json$/.test(name) ||
      /^content\/imported\/[a-z0-9-]+\/curriculum\.json$/.test(name)
    )
      continue;
    const content = await readFile(path, 'utf8');
    const lines = content.trimEnd().split('\n').length;
    count++;
    if (lines > largest.lines) largest = { path: name, lines };
    // 300 is the aim, not a wall (AGENTS.md): longer files are listed; only very big fail.
    if (lines > HARD) errors.push(`${name}: ${lines} lines (more than ${HARD}: split it)`);
    else if (lines > AIM) long.push(`${name} (${lines})`);
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
    `Boundaries passed and no file over ${HARD} lines: ${count} authored files. Largest: ${largest.path} (${largest.lines}).`,
  );
  if (long.length)
    console.log(`Over the ${AIM}-line aim (fine if they read better whole): ${long.join(', ')}.`);
}
