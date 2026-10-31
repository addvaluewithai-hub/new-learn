// The school grades a listed course can be for (docs/marketplace.md), shared by the server's
// check and the pages' filters. Labels are in the language files (market.grades.<id>).

export const GRADES = [
  'kg',
  'g1',
  'g2',
  'g3',
  'g4',
  'g5',
  'g6',
  'g7',
  'g8',
  'g9',
  'g10',
  'g11',
  'g12',
  'university',
  'adults',
] as const;
export type Grade = (typeof GRADES)[number];
export const isGrade = (value: unknown): value is Grade =>
  typeof value === 'string' && (GRADES as readonly string[]).includes(value);
