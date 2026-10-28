import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** Saves the job's uploads in its folder; PDF and Word files also get a .txt copy. */
export async function prepareFiles(api, job, dir) {
  await mkdir(dir, { recursive: true });
  const images = [];
  for (const file of job.files) {
    const path = join(dir, file.name);
    await writeFile(path, await api.file(job.id, file.id));
    if (file.mime.startsWith('image/')) images.push(path);
    try {
      if (file.mime === 'application/pdf') await run('pdftotext', ['-layout', path, `${path}.txt`]);
      if (file.mime.includes('wordprocessingml'))
        await run('pandoc', [path, '-t', 'plain', '-o', `${path}.txt`]);
    } catch {
      // Codex still has the original file.
    }
  }
  return images;
}
