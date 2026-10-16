import p134 from './134.json';
import p135 from './135.json';
import p136 from './136.json';
import p137 from './137.json';
import p138 from './138.json';
import p139 from './139.json';
import p140 from './140.json';
import p141 from './141.json';
import p142 from './142.json';
import p143 from './143.json';
import p144 from './144.json';
import p145 from './145.json';
import p146 from './146.json';
import p147 from './147.json';
import p148 from './148.json';
import p149 from './149.json';
import type { ReferencePart } from '../../physics-ch08/reference';
export const referenceParts: Record<string, ReferencePart & { questionOnly: boolean }> = {
  ...p134,
  ...p135,
  ...p136,
  ...p137,
  ...p138,
  ...p139,
  ...p140,
  ...p141,
  ...p142,
  ...p143,
  ...p144,
  ...p145,
  ...p146,
  ...p147,
  ...p148,
  ...p149,
};
export function referencePart(sceneId: string) {
  const id = sceneId.replace(/-(?:intro|check)$/, '');
  return { id, part: referenceParts[id] ?? referenceParts['P149-Q7'] };
}
