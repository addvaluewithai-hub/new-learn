import p134 from './pages/134.json';
import p135 from './pages/135.json';
import p136 from './pages/136.json';
import p137 from './pages/137.json';
import p138 from './pages/138.json';
import p139 from './pages/139.json';
import p140 from './pages/140.json';
import p141 from './pages/141.json';
import p142 from './pages/142.json';
import p143 from './pages/143.json';
import p144 from './pages/144.json';
import p145 from './pages/145.json';
import p146 from './pages/146.json';
import p147 from './pages/147.json';
import p148 from './pages/148.json';
import p149 from './pages/149.json';
export type BookPart = {
  id: string;
  page: number;
  title: string;
  quotes: string[];
  explanation: string[];
  crop: number[];
  formula?: string;
  note?: string;
  image?: string | string[];
  question?: { arabic: string; answer: string; solution: string[] };
};
export const bookParts: BookPart[] = [
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
];
export const sourceById = Object.fromEntries(bookParts.map((p) => [p.id, p]));
