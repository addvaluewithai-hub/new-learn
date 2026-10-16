import type { BookSection } from '../../index';
import { basics } from './basics';
import { moduli } from './moduli';
import { exerciseIntros, exerciseSolutions } from './exercises';
const narration = { ...basics, ...moduli, ...exerciseIntros };
/** Spoken editorial layer; the pinned input draft and original book excerpts stay traceable. */
export function spokenSection(section: BookSection): BookSection {
  const blocks = narration[section.id];
  if (!blocks) throw new Error(`Missing spoken book section: ${section.id}`);
  const model = section.solution.find((b) => b.startsWith('English model answer:'));
  return { ...section, blocks, solution: model ? [...exerciseSolutions[section.id], model] : [] };
}
