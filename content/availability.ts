import policy from './availability.json';
/** null restores the existing catalog; an explicit list pauses everything outside it. */
export const availableCurricula: string[] | null = policy.curricula;
export const curriculumAvailable = (id: string) =>
  availableCurricula === null || availableCurricula.includes(id);
