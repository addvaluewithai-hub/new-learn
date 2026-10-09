import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const definition = JSON.parse(
  await readFile(resolve(root, 'packages/lesson-runtime/package.json')),
);
const manifest = JSON.parse(
  await readFile(resolve(root, `distributions/lesson-runtime-${definition.version}.json`)),
);
const consumer = await mkdtemp(resolve(dirname(root), 'sdk-consumer-'));
const run = (program, args) =>
  execFileSync(program, args, {
    cwd: consumer,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
try {
  await writeFile(
    resolve(consumer, 'package.json'),
    JSON.stringify({
      name: 'independent-sdk-consumer',
      private: true,
      type: 'module',
      dependencies: {
        '@learn/lesson-runtime': `file:${resolve(root, 'distributions', manifest.file)}`,
        react: '19.2.8',
        'react-dom': '19.2.8',
      },
      devDependencies: {
        vite: '8.2.2',
        typescript: '5.9.3',
        '@types/react': '19.3.0',
        '@types/react-dom': '19.3.0',
      },
    }),
  );
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  const installed = run(process.execPath, [
    '--input-type=module',
    '-e',
    "console.log(import.meta.resolve('@learn/lesson-runtime/core'))",
  ]).trim();
  assert.ok(installed.startsWith(`file://${consumer}/`));
  assert.equal(
    run(process.execPath, [
      '--input-type=module',
      '-e',
      "import {runtimeVersion} from '@learn/lesson-runtime/core'; console.log(runtimeVersion)",
    ]).trim(),
    manifest.version,
  );
  const lesson = execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--input-type=module',
      '-e',
      "import {probeLesson} from './fixtures/runtime-probe/lesson.ts'; console.log(JSON.stringify(probeLesson))",
    ],
    { cwd: root, encoding: 'utf8' },
  );
  await writeFile(resolve(consumer, 'lesson.json'), lesson);
  await writeFile(
    resolve(consumer, 'index.html'),
    '<div id="root"></div><script type="module" src="/main.tsx"></script>',
  );
  await writeFile(
    resolve(consumer, 'main.tsx'),
    `
import {createRoot} from 'react-dom/client';
import {LessonPreview, type LessonPackage, type VisualProps} from '@learn/lesson-runtime';
import '@learn/lesson-runtime/style.css';
import lesson from './lesson.json';
function Board({frame}: VisualProps) { return <div>{frame}</div>; }
createRoot(document.getElementById('root')!).render(<LessonPreview lesson={lesson as LessonPackage} registry={{'runtime-probe': Board}} />);
`,
  );
  await writeFile(
    resolve(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        skipLibCheck: true,
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        resolveJsonModule: true,
        esModuleInterop: true,
        lib: ['ES2022', 'DOM'],
      },
      include: ['main.tsx'],
    }),
  );
  run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit']);
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
  console.log(
    'SDK: isolated tarball installation, Node core export, public types, CSS and consumer build passed.',
  );
} catch (error) {
  console.error(error.stderr?.toString() || error.message);
  throw error;
} finally {
  await rm(consumer, { recursive: true, force: true });
}
