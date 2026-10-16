import early from './early.json';
import late from './late.json';
export type ReferencePart = {
  page: number;
  file: string;
  width: number;
  height: number;
  focus: number[];
  raster: string;
  pixelCrop: number[];
  sha256: string;
};
export const referenceParts: Record<string, ReferencePart> = { ...early, ...late };
export function referencePart(sceneId: string) {
  const id = sceneId.replace(/-(?:intro|check)$/, '');
  return { id, part: referenceParts[id] ?? referenceParts['P133-Q4'] };
}
