import type { BookSection } from '../content/book-guided/physics-ch08';
export function parseBookDraft(text: string): BookSection[];
export function importBookDraft(
  source: string,
): Promise<{ sections: number; pages: number; revision: string }>;
