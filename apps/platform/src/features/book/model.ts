import type { BookSection } from '../../../../../content/book-guided/physics-ch08';

export type BookStep = {
  section: BookSection;
  phase: 'teach' | 'attempt' | 'solution';
  blocks: string[];
  ordinal: number;
};

function chunks(blocks: string[]) {
  const groups: string[][] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block.startsWith('$$') && last && /[:：]$/.test(last[last.length - 1])) last.push(block);
    else groups.push([block]);
  }
  return groups;
}

export function bookSteps(sections: BookSection[]): BookStep[] {
  return sections.flatMap<BookStep>((section) =>
    section.question
      ? [
          { section, phase: 'attempt' as const, blocks: section.blocks, ordinal: 0 },
          ...chunks(section.solution).map((blocks, ordinal) => ({
            section,
            phase: 'solution' as const,
            blocks,
            ordinal,
          })),
        ]
      : chunks(section.blocks).map((blocks, ordinal) => ({
          section,
          phase: 'teach' as const,
          blocks,
          ordinal,
        })),
  );
}

export function allowedStep(steps: BookStep[], wanted: number, answers: Record<string, string>) {
  const index = Math.max(0, Math.min(steps.length - 1, wanted));
  const target = steps[index];
  if (target.phase === 'solution' && !answers[target.section.id])
    return steps.findIndex((s) => s.section.id === target.section.id && s.phase === 'attempt');
  return index;
}
