// A review-only document reader import. It does not create a student release.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const files = [
  '01-pages-121-123.md',
  '02-pages-124-126.md',
  '03-pages-127-129.md',
  '04-pages-130-133.md',
];
const sha = (s) => createHash('sha256').update(s).digest('hex');

export function parseBookDraft(text) {
  const sections = [];
  let section;
  let solution = false;
  for (const raw of text.split(/\n\s*\n/)) {
    const block = raw.trim();
    const heading = /^## (P(\d{3})-[^ ]+) (.+)$/.exec(block);
    if (heading) {
      section = {
        id: heading[1],
        page: Number(heading[2]),
        title: heading[3],
        question: /-Q\d+$/.test(heading[1]),
        blocks: [],
        solution: [],
        notes: [],
      };
      sections.push(section);
      solution = false;
      continue;
    }
    if (!section || block.startsWith('# ')) continue;
    if (/^## /.test(block)) {
      section = undefined;
      continue;
    }
    if (/^### P\d{3}-A/.test(block)) {
      solution = true;
      section.solution.push(block.replace(/^### P\d{3}-[^ ]+ /, ''));
      continue;
    }
    if (block.startsWith('### ')) continue;
    if (
      /^\*\*(?:الموضع|إشارة العرض|ملاحظة تحريرية|ملاحظة للمراجع|تنبيه نسخ للمراجع):/.test(block)
    ) {
      if (!block.startsWith('**الموضع:')) section.notes.push(block);
      continue;
    }
    (solution ? section.solution : section.blocks).push(block);
  }
  return sections;
}

export async function importBookDraft(source) {
  const texts = await Promise.all(files.map((f) => readFile(join(source, 'drafts', f), 'utf8')));
  const sections = texts.flatMap(parseBookDraft);
  const pages = Array.from({ length: 13 }, (_, i) => 121 + i);
  if (sections.filter((s) => s.question).length !== 4) throw new Error('Expected four exercises');
  for (const page of pages)
    if (!sections.some((s) => s.page === page)) throw new Error(`Missing page ${page}`);
  const output = fileURLToPath(new URL('../content/book-guided/physics-ch08/', import.meta.url));
  await mkdir(join(output, 'pages'), { recursive: true });
  for (const page of pages)
    await writeFile(
      join(output, 'pages', `${page}.json`),
      JSON.stringify(
        sections.filter((s) => s.page === page),
        null,
        2,
      ) + '\n',
    );
  const metadata = {
    title: 'خواص المواد الصلبة والمرونة',
    chapter: 8,
    contentRevision: sha(files.map((f, i) => f + '\n' + texts[i]).join('\n')),
    authoringCommit: 'cc2801523844a577f474703883072b124272e252',
    authoringPath: 'curricula/physics-1-mechanics-waves/experiments/book-guided-ch08',
    inputs: files.map((file, i) => ({ file, sha256: sha(texts[i]) })),
    delivery: 'book-guided-review',
    publicationApproved: false,
  };
  await writeFile(join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  return { sections: sections.length, pages: pages.length, revision: metadata.contentRevision };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Pass the authoring experiment directory');
  console.log(await importBookDraft(resolve(process.argv[2])));
}
